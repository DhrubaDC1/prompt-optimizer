import { GENERATION_MODES } from '@prompt-optimizer/optimizer/modes'

function toBase64Url(text) {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(encoded) {
  const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'))
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
}

// The prompts ride in the URL fragment, which browsers never send to the server.
export function shareUrl(base, { originalPrompt, optimizedPrompt, mode, target }) {
  const payload = JSON.stringify({ o: originalPrompt, p: optimizedPrompt, m: mode, t: target })
  return `${base}#s=${toBase64Url(payload)}`
}

// Anyone can craft a link, so check every field before it becomes app state.
export function readShareHash(hash) {
  const match = /^#s=([A-Za-z0-9_-]+)$/.exec(hash ?? '')
  if (!match) return null

  try {
    const data = JSON.parse(fromBase64Url(match[1]))
    if (
      typeof data?.o !== 'string' ||
      typeof data.p !== 'string' ||
      !data.p.trim() ||
      data.o.length > 8_000 ||
      data.p.length > 20_000 ||
      !GENERATION_MODES.includes(data.m)
    ) {
      return null
    }

    return {
      originalPrompt: data.o,
      optimizedPrompt: data.p,
      mode: data.m,
      target: typeof data.t === 'string' ? data.t : null,
      score: null,
      changes: null,
    }
  } catch {
    return null
  }
}
