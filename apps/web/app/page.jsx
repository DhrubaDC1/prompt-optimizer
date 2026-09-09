'use client'

import { useReducer } from 'react'

import ClarificationForm from '../components/ClarificationForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import PromptInput from '../components/PromptInput.jsx'
import ResultView from '../components/ResultView.jsx'
import Spinner from '../components/Spinner.jsx'
import { INITIAL_STATE, PHASE, reducer } from './prompt-state.js'

const ERROR_MESSAGES = {
  rate_limited: 'You have reached the hourly limit. Try again later.',
  too_long: 'That prompt is too long. Shorten it and try again.',
  upstream_timeout: 'The optimizer took too long to respond. Try again.',
  upstream_error: 'The optimizer is unavailable right now. Try again.',
  invalid_response: 'The optimizer returned an unusable response. Try again.',
}

export default function HomePage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  async function runOptimize(request, replaceOriginal = false) {
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

  return (
    <main className="app-shell">
      <div className="brand">Prompt sharpener</div>

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
          dispatch={dispatch}
          onSubmit={submitClarifications}
        />
      )}

      {state.phase === PHASE.RESULT && (
        <ResultView
          value={state.optimizedPrompt}
          onChange={(optimizedPrompt) => dispatch({ type: 'EDIT_RESULT', optimizedPrompt })}
          onStartOver={() => dispatch({ type: 'START_OVER' })}
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
    </main>
  )
}
