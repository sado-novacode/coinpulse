// Simple in-memory TTL cache for server-side market data
type Entry<T> = { value: T; expires: number }

const store = new Map<string, Entry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key)
  if (!e) return undefined
  if (Date.now() > e.expires) {
    store.delete(key)
    return undefined
  }
  return e.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs })
}

/** Get from cache or fetch fresh (and cache the result). */
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key)
  if (hit !== undefined) return hit
  const value = await fetcher()
  cacheSet(key, value, ttlMs)
  return value
}

/** In-flight promise dedupe so parallel requests share one upstream call. */
const inflight = new Map<string, Promise<unknown>>()
export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>
  const p = fn().finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}
