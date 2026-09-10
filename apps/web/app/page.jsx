'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import useMeasure from 'react-use-measure'

import ClarificationForm from '../components/ClarificationForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import PromptInput from '../components/PromptInput.jsx'
import ResultView from '../components/ResultView.jsx'
import Spinner from '../components/Spinner.jsx'
import { watchClarificationAbandonment } from './clarification-abandonment.js'
import { INITIAL_STATE, PHASE, reducer } from './prompt-state.js'

const ERROR_MESSAGES = {
  rate_limited: 'You have reached the hourly limit. Try again later.',
  too_long: 'That prompt is too long. Shorten it and try again.',
  upstream_timeout: 'The optimizer took too long to respond. Try again.',
  upstream_error: 'The optimizer is unavailable right now. Try again.',
  invalid_response: 'The optimizer returned an unusable response. Try again.',
}

const CONTENT_VARIANTS = {
  enter: (direction) => ({ opacity: 0, y: direction * 24 }),
  center: { opacity: 1, y: 0 },
  exit: (direction) => ({ opacity: 0, y: direction * -20 }),
}

function AnimatedContent({ children, phase, questionIndex, direction }) {
  const [measureRef, bounds] = useMeasure()
  const [heightAnimating, setHeightAnimating] = useState(false)
  const [contentAnimating, setContentAnimating] = useState(false)
  const reduceMotion = useReducedMotion()
  const contentKey = `${phase}:${questionIndex}`
  const isAnimating = heightAnimating || contentAnimating

  return (
    <motion.div
      className={`motion-height${isAnimating ? ' is-animating' : ''}`}
      initial={false}
      animate={bounds.height ? { height: bounds.height } : {}}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.32, 0.72, 0, 1] }}
      onAnimationStart={() => !reduceMotion && setHeightAnimating(true)}
      onAnimationComplete={() => setHeightAnimating(false)}
    >
      <div ref={measureRef} className="motion-measure">
        <AnimatePresence
          mode="wait"
          initial={false}
          custom={direction}
          onExitComplete={() => setContentAnimating(false)}
        >
          <motion.div
            key={contentKey}
            custom={direction}
            variants={CONTENT_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            onAnimationStart={() => !reduceMotion && setContentAnimating(true)}
            onAnimationComplete={() => setContentAnimating(false)}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const direction = useRef(1)
  const status = useRef({ phase: state.phase, reachedResult: false })
  status.current.phase = state.phase
  status.current.reachedResult ||= state.phase === PHASE.RESULT

  useEffect(
    () => watchClarificationAbandonment(() => status.current, document, navigator),
    [],
  )

  async function runOptimize(request, replaceOriginal = false) {
    direction.current = 1
    dispatch({ type: 'START', request, replaceOriginal })

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      })
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        dispatch({ type: 'FAIL', error: body?.error ?? 'upstream_error' })
        return
      }

      if (
        request.clarifications.length === 0 &&
        body?.status === 'needs_clarification' &&
        Array.isArray(body.questions)
      ) {
        dispatch({ type: 'CLARIFY', questions: body.questions })
        return
      }

      if (body?.status === 'ready' && typeof body.optimizedPrompt === 'string') {
        dispatch({ type: 'RESULT', optimizedPrompt: body.optimizedPrompt })
        return
      }

      dispatch({ type: 'FAIL', error: 'invalid_response' })
    } catch {
      dispatch({ type: 'FAIL', error: 'upstream_error' })
    }
  }

  function submitPrompt() {
    if (!state.prompt.trim() || state.prompt.length > 8_000) return
    runOptimize({ prompt: state.prompt, clarifications: [] }, true)
  }

  function submitClarifications(clarifications) {
    runOptimize({ prompt: state.requestPrompt, clarifications })
  }

  function updateClarification(action) {
    if (action.type === 'BACK') direction.current = -1
    if (action.type === 'NEXT') direction.current = 1
    dispatch(action)
  }

  return (
    <main className="app-shell">
      <div className="brand">Prompt sharpener</div>

      <AnimatedContent
        phase={state.phase}
        questionIndex={state.index}
        direction={direction.current}
      >
        {state.phase === PHASE.INPUT && (
          <section className="input-screen" aria-labelledby="page-title">
            <h1 id="page-title">Sharpen your prompt</h1>
            <p className="supporting-copy">
              Turn a rough idea into a clear prompt without changing what you mean.
            </p>
            <PromptInput
              value={state.prompt}
              onChange={(prompt) => dispatch({ type: 'EDIT', prompt })}
              onSubmit={submitPrompt}
            />
          </section>
        )}

        {state.phase === PHASE.LOADING && <Spinner />}

        {state.phase === PHASE.CLARIFY && (
          <ClarificationForm
            questions={state.questions}
            answers={state.answers}
            index={state.index}
            dispatch={updateClarification}
            onSubmit={submitClarifications}
          />
        )}

        {state.phase === PHASE.RESULT && (
          <ResultView
            value={state.optimizedPrompt}
            onChange={(optimizedPrompt) => dispatch({ type: 'EDIT_RESULT', optimizedPrompt })}
            onStartOver={() => {
              direction.current = 1
              dispatch({ type: 'START_OVER' })
            }}
            onResubmit={() =>
              runOptimize({ prompt: state.optimizedPrompt, clarifications: [] })
            }
          />
        )}

        {state.phase === PHASE.ERROR && (
          <ErrorBanner
            message={ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.upstream_error}
            onRetry={() => state.retryRequest && runOptimize(state.retryRequest)}
          />
        )}
      </AnimatedContent>
    </main>
  )
}
