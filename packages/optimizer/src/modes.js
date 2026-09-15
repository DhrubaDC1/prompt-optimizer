export const GENERATION_MODES = ['chat', 'image', 'agent']

export const TARGETS_BY_MODE = {
  chat: ['claude', 'gpt', 'gemini'],
  image: ['midjourney', 'dall-e', 'stable-diffusion', 'flux'],
  agent: ['claude', 'gpt'],
}

export const TARGET_LABELS = {
  claude: 'Claude',
  gpt: 'GPT',
  gemini: 'Gemini',
  midjourney: 'Midjourney',
  'dall-e': 'DALL-E',
  'stable-diffusion': 'Stable Diffusion',
  flux: 'Flux',
}

export const MODE_LABELS = {
  chat: 'Chat',
  image: 'Image',
  agent: 'Agent',
}
