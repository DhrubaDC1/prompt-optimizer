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
  optimizedPrompt: '',
  error: null,
  retryRequest: null,
}

export function reducer(state, action) {
  switch (action.type) {
    case 'EDIT':
      return { ...state, prompt: action.prompt }
    case 'START':
      return {
        ...state,
        phase: PHASE.LOADING,
        originalPrompt: state.originalPrompt || action.request.prompt,
        error: null,
        retryRequest: action.request,
      }
    case 'CLARIFY':
      return { ...state, phase: PHASE.CLARIFY, questions: action.questions }
    case 'RESULT':
      return {
        ...state,
        phase: PHASE.RESULT,
        optimizedPrompt: action.optimizedPrompt,
      }
    case 'FAIL':
      return { ...state, phase: PHASE.ERROR, error: action.error }
    default:
      return state
  }
}
