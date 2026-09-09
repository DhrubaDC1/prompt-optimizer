export async function copyText(
  text,
  textarea,
  clipboard = globalThis.navigator?.clipboard,
  execCommand = globalThis.document?.execCommand?.bind(globalThis.document),
) {
  try {
    if (clipboard?.writeText) {
      await clipboard.writeText(text)
      return true
    }
  } catch {}

  textarea.focus()
  textarea.select()

  try {
    return Boolean(execCommand?.('copy'))
  } catch {
    return false
  }
}
