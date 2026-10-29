// Token bucket per client: a burst of CAPACITY requests, then one more every REFILL_MS.
const CAPACITY = 20
const REFILL_MS = 10_000
const MAX_TRACKED = 10_000

// shortcut: in-memory, so each server instance counts on its own; move to a shared store
// (e.g. Redis) when the app runs on more than one instance.
const buckets = new Map()

// Returns 0 when the request may go ahead, otherwise the seconds to wait.
export function takeToken(key, now = Date.now()) {
  if (buckets.size > MAX_TRACKED) {
    // A bucket idle long enough to refill completely is the same as no bucket.
    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.at >= CAPACITY * REFILL_MS) buckets.delete(bucketKey)
    }
  }

  const bucket = buckets.get(key)
  const tokens = bucket
    ? Math.min(CAPACITY, bucket.tokens + (now - bucket.at) / REFILL_MS)
    : CAPACITY

  if (tokens < 1) {
    buckets.set(key, { tokens, at: now })
    return Math.ceil(((1 - tokens) * REFILL_MS) / 1000)
  }

  buckets.set(key, { tokens: tokens - 1, at: now })
  return 0
}

// shortcut: trusts x-forwarded-for as set by the hosting proxy (e.g. Vercel); a `next start`
// exposed directly to the internet lets clients spoof it, so put a proxy in front.
export function clientKey(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  )
}
