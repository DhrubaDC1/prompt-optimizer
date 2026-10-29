export const GENERATION_MODES = ['chat', 'image', 'agent']

export const TARGETS_BY_MODE = {
  chat: ['claude', 'chatgpt', 'gemini', 'grok'],
  image: ['chatgpt', 'gemini', 'grok'],
  agent: ['claude-code', 'codex', 'antigravity'],
}

export const TARGET_LABELS = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  grok: 'Grok',
  'claude-code': 'Claude Code',
  codex: 'Codex',
  antigravity: 'Antigravity',
}

export const MODE_LABELS = {
  chat: 'Chat',
  image: 'Image',
  agent: 'Agent',
}
