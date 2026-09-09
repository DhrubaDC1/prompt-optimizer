export const runtime = 'nodejs'

export async function POST(request) {
  const payload = await request.json().catch(() => null)
  console.log(JSON.stringify(payload))
  return new Response(null, { status: 204 })
}
