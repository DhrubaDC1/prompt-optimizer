export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST() {
  return Response.json(
    { error: 'optimizer_not_implemented' },
    { status: 501 },
  )
}
