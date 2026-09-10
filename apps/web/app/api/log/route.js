export const runtime = 'nodejs'

const EVENTS = new Set(['prompt_copied', 'clarification_abandoned'])

export async function POST(request) {
  const rawBody = await request.text().catch(() => '')
  if (!rawBody || rawBody.length > 100) return new Response(null, { status: 400 })

  let payload

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(null, { status: 400 })
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).length !== 1 ||
    !EVENTS.has(payload.event)
  ) {
    return new Response(null, { status: 400 })
  }

  const event = { event: payload.event }
  console.log(JSON.stringify(event))
  return new Response(null, { status: 204 })
}
