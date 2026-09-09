import { isIP } from 'node:net'

import { OptimizerError, optimize } from '@prompt-optimizer/optimizer'
import {
  MAX_REQUEST_BYTES,
  optimizeRequestSchema,
} from '@prompt-optimizer/optimizer/schemas'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const maxDuration = 30

const ERROR_STATUS = {
  rate_limited: 429,
  too_long: 413,
  upstream_timeout: 504,
  upstream_error: 502,
  invalid_response: 502,
}

let ratelimit

function getRatelimit() {
  ratelimit ??= new Ratelimit({
    redis: Redis.fromEnv({
      retry: false,
      responseEncoding: false,
      enableTelemetry: false,
      enableAutoPipelining: false,
    }),
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'prompt-optimizer:optimize',
    ephemeralCache: false,
    timeout: 2_000,
  })

  return ratelimit
}

function errorResponse(error, status = ERROR_STATUS[error]) {
  return Response.json({ error }, { status })
}

function validationErrorResponse(error) {
  const tooLong = error.issues.some(
    (issue) => issue.code === 'too_big' || issue.message === 'Request body is too large',
  )

  return errorResponse(tooLong ? 'too_long' : 'invalid_response', tooLong ? 413 : 400)
}

function optimizerErrorResponse(error) {
  const code =
    error instanceof OptimizerError && error.code in ERROR_STATUS
      ? error.code
      : 'upstream_error'

  return errorResponse(code)
}

function clientIdentifier(request) {
  for (const candidate of (request.headers.get('x-forwarded-for') ?? '').split(',')) {
    const ip = candidate.trim()
    if (isIP(ip)) return `ip:${ip}`
  }

  return 'ip:unknown'
}

export async function POST(request) {
  let limit

  try {
    limit = await getRatelimit().limit(clientIdentifier(request))
  } catch {
    return errorResponse('upstream_error')
  }

  if (limit.reason === 'timeout') return errorResponse('upstream_error')
  if (!limit.success) return errorResponse('rate_limited')

  let rawBody

  try {
    rawBody = await request.text()
  } catch {
    return errorResponse('invalid_response', 400)
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return errorResponse('too_long')
  }

  let input

  try {
    input = JSON.parse(rawBody)
  } catch {
    return errorResponse('invalid_response', 400)
  }

  const parsed = optimizeRequestSchema.safeParse(input)
  if (!parsed.success) return validationErrorResponse(parsed.error)

  const body = parsed.data
  const isFinal = body.clarifications.length > 0

  try {
    const result = await optimize(body.prompt, body.clarifications)

    if (isFinal) {
      return Response.json({ status: 'ready', optimizedPrompt: result.optimizedPrompt })
    }

    return Response.json(result)
  } catch (error) {
    return optimizerErrorResponse(error)
  }
}
