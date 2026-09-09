export const PHASE = {
  INPUT: 'input',
  LOADING: 'loading',
  CLARIFY: 'clarify',
  RESULT: 'result',
  ERROR: 'error',
}

export const INITIAL_STATE = {
  phase: PHASE.INPUT,
  prompt: '',
  originalPrompt: '',
  questions: [],
  answers: {},
  index: 0,
  requestPrompt: '',
  optimizedPrompt: '',
  error: null,
  retryRequest: null,
}

export function isAnswered(question, answer) {
  if (question.type === 'multi_select') {
    return Array.isArray(answer) && answer.length > 0 && answer.every((value) => value.trim())
  }

  return typeof answer === 'string' && Boolean(answer.trim())
}

export function clarificationAnswers(questions, answers, fallbackQuestion) {
  const clarifications = questions.flatMap((question) =>
    isAnswered(question, answers[question.id])
      ? [{ questionId: question.id, answer: answers[question.id] }]
      : [],
  )

  if (!clarifications.length && fallbackQuestion) {
    clarifications.push({ questionId: fallbackQuestion.id, answer: '' })
  }

  return clarifications
}

export function reducer(state, action) {
  switch (action.type) {
    case 'EDIT':
      return { ...state, prompt: action.prompt }
    case 'START':
      return {
        ...state,
        phase: PHASE.LOADING,
        originalPrompt:
          action.replaceOriginal || !state.originalPrompt
            ? action.request.prompt
            : state.originalPrompt,
        requestPrompt: action.request.prompt,
        error: null,
        retryRequest: action.request,
      }
    case 'CLARIFY':
      return {
        ...state,
        phase: PHASE.CLARIFY,
        questions: action.questions,
        answers: {},
        index: 0,
      }
    case 'ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
      }
    case 'BACK':
      return { ...state, index: Math.max(0, state.index - 1) }
    case 'NEXT':
      return { ...state, index: Math.min(state.questions.length - 1, state.index + 1) }
    case 'RESULT':
      return {
        ...state,
        phase: PHASE.RESULT,
        optimizedPrompt: action.optimizedPrompt,
      }
    case 'EDIT_RESULT':
      return { ...state, optimizedPrompt: action.optimizedPrompt }
    case 'START_OVER':
      return {
        ...INITIAL_STATE,
        prompt: state.originalPrompt,
        originalPrompt: state.originalPrompt,
      }
    case 'FAIL':
      return { ...state, phase: PHASE.ERROR, error: action.error }
    default:
      return state
  }
}
