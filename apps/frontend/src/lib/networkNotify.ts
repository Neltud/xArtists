/**
 * Toasts réseau MultiversX — 429 / offline / timeout.
 * Utilisable hors React via window event consommé par NetworkToastBridge.
 */

export type NetNotifyKind = 'rateLimit' | 'offline' | 'timeout' | 'okCache'

const EVENT = 'xartists-net-notify'

export function notifyNetwork(kind: NetNotifyKind, detail?: string): void {
  try {
    window.dispatchEvent(
      new CustomEvent(EVENT, {
        detail: { kind, detail: detail || '' },
      }),
    )
  } catch {
    /* SSR / tests */
  }
}

export function isRateLimitError(err: unknown, status?: number): boolean {
  if (status === 429) return true
  const msg = String((err as { message?: string })?.message || err || '')
  return /429|rate.?limit|too many requests/i.test(msg)
}

export function isOfflineError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message || err || '')
  return (
    typeof navigator !== 'undefined' && navigator.onLine === false
  ) || /failed to fetch|networkerror|offline|err_internet/i.test(msg)
}

/** Wrap fetch: on 429/offline notify + optional cache fallback caller-side. */
export async function fetchWithNetNotify(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      notifyNetwork('offline')
      throw new Error('offline')
    }
    const r = await fetch(input, init)
    if (r.status === 429) {
      notifyNetwork('rateLimit')
    }
    return r
  } catch (e) {
    if (isOfflineError(e)) notifyNetwork('offline')
    else if (isRateLimitError(e)) notifyNetwork('rateLimit')
    throw e
  }
}

export const NET_EVENT = EVENT
