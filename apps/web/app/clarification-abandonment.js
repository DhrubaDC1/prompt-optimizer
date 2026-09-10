export function watchClarificationAbandonment(getStatus, doc, navigation) {
  let sent = false

  function handleVisibilityChange() {
    const { phase, reachedResult } = getStatus()

    if (
      sent ||
      doc.visibilityState !== 'hidden' ||
      phase !== 'clarify' ||
      reachedResult
    ) {
      return
    }

    sent = true

    try {
      navigation.sendBeacon(
        '/api/log',
        JSON.stringify({ event: 'clarification_abandoned' }),
      )
    } catch {}
  }

  doc.addEventListener('visibilitychange', handleVisibilityChange)
  return () => doc.removeEventListener('visibilitychange', handleVisibilityChange)
}
