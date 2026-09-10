import { useEffect, useRef } from 'react'

import { clarificationAnswers, isAnswered } from '../app/prompt-state.js'
import QuestionRenderer from './QuestionRenderer.jsx'

export default function ClarificationForm({ questions, answers, index, dispatch, onSubmit }) {
  const container = useRef(null)
  const question = questions[index]
  const complete = isAnswered(question, answers[question.id])
  const last = index === questions.length - 1
  const canOptimizeAnyway = questions.length === 1 || index > 0

  useEffect(() => {
    container.current?.focus()
  }, [index])

  function submit(event) {
    event.preventDefault()
    if (!complete) return

    if (last) {
      onSubmit(clarificationAnswers(questions, answers))
    } else {
      dispatch({ type: 'NEXT' })
    }
  }

  function optimizeAnyway() {
    onSubmit(clarificationAnswers(questions, answers, question))
  }

  return (
    <section
      ref={container}
      className="clarification-screen"
      tabIndex={-1}
    >
      <div className="progress-copy">
        Question {index + 1} of {questions.length}
      </div>
      <progress value={index + 1} max={questions.length} aria-label="Clarification progress" />

      <form className="clarification-form" onSubmit={submit}>
        <QuestionRenderer
          key={question.id}
          question={question}
          answer={answers[question.id]}
          onAnswer={(answer) => dispatch({ type: 'ANSWER', questionId: question.id, answer })}
        />

        <div className="clarification-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => dispatch({ type: 'BACK' })}
            disabled={index === 0}
          >
            Go back
          </button>
          {canOptimizeAnyway && (
            <button className="text-button" type="button" onClick={optimizeAnyway}>
              Optimize anyway
            </button>
          )}
          <button className="primary-button" type="submit" disabled={!complete}>
            {last ? 'Optimize' : 'Continue'}
          </button>
        </div>
      </form>
    </section>
  )
}
