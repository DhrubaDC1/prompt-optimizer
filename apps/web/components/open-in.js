// Agent targets are local tools, so they have no web page to open.
const OPEN_URLS = {
  claude: 'https://claude.ai/new',
  chatgpt: 'https://chatgpt.com/',
  gemini: 'https://gemini.google.com/app',
  grok: 'https://grok.com/',
}

// Gemini has no documented way to prefill a prompt; the user pastes from the clipboard.
const PREFILL = new Set(['claude', 'chatgpt', 'grok'])

// Long query strings get rejected by servers; past this the clipboard copy carries the prompt.
const MAX_QUERY_LENGTH = 6_000

export function openInUrl(target, text) {
  const base = OPEN_URLS[target]
  if (!base) return null

  const query = encodeURIComponent(text)
  return PREFILL.has(target) && query.length <= MAX_QUERY_LENGTH ? `${base}?q=${query}` : base
}
