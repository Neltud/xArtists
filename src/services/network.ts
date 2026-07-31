/**
 * Network fetch with timeout, retries, and AbortController
 */

export type FetchTimeoutOptions = {
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
  signal?: AbortSignal
  /** HTTP methods safe to retry */
  retryOn?: number[]
}

export class NetworkTimeoutError extends Error {
  readonly code = 'NETWORK_TIMEOUT'
  constructor(url: string, timeoutMs: number) {
    super(`Timeout réseau (${timeoutMs}ms) — ${url}`)
    this.name = 'NetworkTimeoutError'
  }
}

export class NetworkError extends Error {
  readonly code = 'NETWORK'
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'NetworkError'
    this.status = status
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}

/**
 * fetch with hard timeout. Does not leave hung requests without abort.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  opts: FetchTimeoutOptions = {}
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 15_000
  const retries = opts.retries ?? 2
  const retryDelayMs = opts.retryDelayMs ?? 800
  const retryOn = opts.retryOn ?? [408, 429, 500, 502, 503, 504]
  const url = typeof input === 'string' ? input : input.toString()

  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const onParentAbort = () => controller.abort()
    opts.signal?.addEventListener('abort', onParentAbort)
    if (init.signal) {
      init.signal.addEventListener('abort', onParentAbort)
    }

    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
      })
      clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onParentAbort)

      if (!res.ok && retryOn.includes(res.status) && attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1), opts.signal)
        continue
      }
      return res
    } catch (e) {
      clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onParentAbort)
      lastErr = e
      const isAbort =
        (e instanceof DOMException && e.name === 'AbortError') ||
        (e instanceof Error && /abort/i.test(e.message))

      if (isAbort && opts.signal?.aborted) throw e

      if (isAbort) {
        lastErr = new NetworkTimeoutError(url, timeoutMs)
      }

      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1), opts.signal)
        continue
      }
    }
  }

  if (lastErr instanceof Error) throw lastErr
  throw new NetworkError(String(lastErr))
}

export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
  opts?: FetchTimeoutOptions
): Promise<T> {
  const res = await fetchWithTimeout(url, init, opts)
  if (!res.ok) {
    throw new NetworkError(`HTTP ${res.status} ${url}`, res.status)
  }
  return res.json() as Promise<T>
}
