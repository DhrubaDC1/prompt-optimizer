import { useEffect, useRef } from 'react'

function Choice({ type, name, value, checked, onChange, children }) {
  return (
    <label className="choice">
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  )
}

export function SingleSelectQuestion({ question, answer, onAnswer }) {
  const otherSelected =
    question.allowOther && answer !== undefined && !question.options.includes(answer)

  return (
    <fieldset>
      <legend>{question.question}</legend>
      <div className="choices">
        {question.options.map((option) => (
          <Choice
            key={option}
            type="radio"
            name={question.id}
            value={option}
            checked={answer === option}
            onChange={() => onAnswer(option)}
          >
            {option}
          </Choice>
        ))}
        {question.allowOther && (
          <>
            <Choice
              type="radio"
              name={question.id}
              value=""
              checked={otherSelected}
              onChange={() => onAnswer('')}
            >
              Other
            </Choice>
            <input
              className="other-input"
              aria-label="Other answer"
              value={otherSelected ? answer : ''}
              onChange={(event) => onAnswer(event.target.value)}
              disabled={!otherSelected}
              placeholder="Type another answer"
              maxLength={1_000}
            />
          </>
        )}
      </div>
    </fieldset>
  )
}

export function MultiSelectQuestion({ question, answer = [], onAnswer }) {
  const otherInput = useRef(null)
  const customAnswer = answer.find((value) => !question.options.includes(value))
  const otherSelected = customAnswer !== undefined

  useEffect(() => {
    if (otherSelected) otherInput.current?.focus()
  }, [otherSelected])

  function toggle(option, checked) {
    onAnswer(checked ? [...answer, option] : answer.filter((value) => value !== option))
  }

  function toggleOther(checked) {
    onAnswer(checked ? [...answer, ''] : answer.filter((value) => question.options.includes(value)))
  }

  function changeOther(value) {
    onAnswer([...answer.filter((item) => question.options.includes(item)), value])
  }

  return (
    <fieldset>
      <legend>{question.question}</legend>
      <div className="choices">
        {question.options.map((option) => (
          <Choice
            key={option}
            type="checkbox"
            name={question.id}
            value={option}
            checked={answer.includes(option)}
            onChange={(event) => toggle(option, event.target.checked)}
          >
            {option}
          </Choice>
        ))}
        {question.allowOther && (
          <>
            <Choice
              type="checkbox"
              name={`${question.id}-other`}
              value="other"
              checked={otherSelected}
              onChange={(event) => toggleOther(event.target.checked)}
            >
              Other
            </Choice>
            <input
              ref={otherInput}
              className="other-input"
              aria-label="Other answer"
              value={customAnswer ?? ''}
              onChange={(event) => changeOther(event.target.value)}
              disabled={!otherSelected}
              placeholder="Type another answer"
              maxLength={1_000}
            />
          </>
        )}
      </div>
    </fieldset>
  )
}

export function TextQuestion({ question, answer = '', onAnswer }) {
  return (
    <fieldset>
      <legend>{question.question}</legend>
      <input
        className="text-answer"
        value={answer}
        onChange={(event) => onAnswer(event.target.value)}
        maxLength={1_000}
        autoFocus
      />
    </fieldset>
  )
}

export function TextareaQuestion({ question, answer = '', onAnswer }) {
  return (
    <fieldset>
      <legend>{question.question}</legend>
      <textarea
        className="text-answer"
        value={answer}
        onChange={(event) => onAnswer(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        maxLength={1_000}
        rows={6}
        autoFocus
      />
    </fieldset>
  )
}

export function YesNoQuestion({ question, answer, onAnswer }) {
  return (
    <fieldset>
      <legend>{question.question}</legend>
      <div className="choices choices-inline">
        {['Yes', 'No'].map((option) => (
          <Choice
            key={option}
            type="radio"
            name={question.id}
            value={option}
            checked={answer === option}
            onChange={() => onAnswer(option)}
          >
            {option}
          </Choice>
        ))}
      </div>
    </fieldset>
  )
}

const QUESTION_COMPONENTS = {
  single_select: SingleSelectQuestion,
  multi_select: MultiSelectQuestion,
  text: TextQuestion,
  textarea: TextareaQuestion,
  yes_no: YesNoQuestion,
}

export default function QuestionRenderer(props) {
  const Component = QUESTION_COMPONENTS[props.question.type]
  return Component ? <Component {...props} /> : null
}
