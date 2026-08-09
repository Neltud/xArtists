/**
 * Safe JSON fetch — timeout, abort, optional cache mode.
 */
export type FetchJsonOpts = {
  timeoutMs?: number
  cache?: RequestCache
  signal?: AbortSignal
  retries?: number
}

export class FetchJsonError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'FetchJsonError'
    this.status = status
  }
}

export async function fetchJson<T = unknown>(
  url: string,
  opts: FetchJsonOpts = {}
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 12_000
  const retries = opts.retries ?? 0
  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const onOuter = () => ctrl.abort()
    opts.signal?.addEventListener('abort', onOuter)

    try {
      const res = await fetch(url, {
        cache: opts.cache ?? 'default',
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new FetchJsonError(`HTTP ${res.status}`, res.status)
      return (await res.json()) as T
    } catch (e) {
      lastErr = e
      if (attempt < retries) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
    } finally {
      clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onOuter)
    }
  }
  throw lastErr instanceof Error ? lastErr : new FetchJsonError(String(lastErr))
}
