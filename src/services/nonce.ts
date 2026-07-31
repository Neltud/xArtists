/**
 * MultiversX nonce polling & local reservation (with network timeouts)
 */
import { fetchJson, fetchWithTimeout } from './network'

const DEFAULT_API = 'https://api.multiversx.com'
const DEFAULT_GATEWAY = 'https://gateway.multiversx.com'

export type AccountNonceInfo = {
  address: string
  nonce: number
  balance?: string
  source: 'api' | 'gateway'
  fetchedAt: number
}

export type PollOptions = {
  api?: string
  gateway?: string
  intervalMs?: number
  timeoutMs?: number
  signal?: AbortSignal
  preferGateway?: boolean
  /** Per-request HTTP timeout (default 12s) */
  fetchTimeoutMs?: number
}

function assertAddress(address: string): void {
  if (!address || !address.startsWith('erd1') || address.length < 20) {
    throw new Error(`Invalid MultiversX address: ${address || '(empty)'}`)
  }
}

export async function fetchAccountNonce(
  address: string,
  opts: PollOptions = {}
): Promise<AccountNonceInfo> {
  assertAddress(address)
  const api = opts.api || DEFAULT_API
  const gateway = opts.gateway || DEFAULT_GATEWAY
  const fetchTimeoutMs = opts.fetchTimeoutMs ?? 12_000

  if (opts.preferGateway) {
    try {
      const gRes = await fetchWithTimeout(
        `${gateway}/address/${address}/nonce`,
        {},
        { timeoutMs: fetchTimeoutMs, retries: 1, signal: opts.signal }
      )
      if (gRes.ok) {
        const body = await gRes.json()
        const nonce = Number(body?.data?.nonce ?? body?.nonce)
        if (Number.isFinite(nonce)) {
          return {
            address,
            nonce,
            source: 'gateway',
            fetchedAt: Date.now(),
          }
        }
      }
    } catch {
      /* fall through */
    }
  }

  const data = await fetchJson<{
    nonce?: number
    balance?: string
  }>(`${api}/accounts/${address}`, {}, {
    timeoutMs: fetchTimeoutMs,
    retries: 2,
    signal: opts.signal,
  })
  const nonce = Number(data?.nonce)
  if (!Number.isFinite(nonce)) {
    throw new Error('Nonce missing in account response')
  }
  return {
    address,
    nonce,
    balance: data?.balance != null ? String(data.balance) : undefined,
    source: 'api',
    fetchedAt: Date.now(),
  }
}

export async function waitNonceStable(
  address: string,
  opts: PollOptions & { stableReads?: number } = {}
): Promise<AccountNonceInfo> {
  const intervalMs = opts.intervalMs ?? 1500
  const timeoutMs = opts.timeoutMs ?? 45_000
  const needStable = opts.stableReads ?? 2
  const start = Date.now()
  let last = -1
  let streak = 0
  let info: AccountNonceInfo | null = null

  while (Date.now() - start < timeoutMs) {
    if (opts.signal?.aborted) throw new Error('nonce poll aborted')
    info = await fetchAccountNonce(address, opts)
    if (info.nonce === last) {
      streak += 1
      if (streak >= needStable - 1) return info
    } else {
      last = info.nonce
      streak = 0
    }
    await sleep(intervalMs, opts.signal)
  }
  if (info) return info
  throw new Error('waitNonceStable timeout')
}

export async function waitNonceAdvanced(
  address: string,
  usedNonce: number,
  opts: PollOptions = {}
): Promise<AccountNonceInfo> {
  const intervalMs = opts.intervalMs ?? 2000
  const timeoutMs = opts.timeoutMs ?? 120_000
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (opts.signal?.aborted) throw new Error('nonce advance aborted')
    const info = await fetchAccountNonce(address, opts)
    if (info.nonce > usedNonce) return info
    await sleep(intervalMs, opts.signal)
  }
  throw new Error(
    `Nonce did not advance past ${usedNonce} within ${timeoutMs}ms — check explorer`
  )
}

export async function waitNonceAtLeast(
  address: string,
  targetNonce: number,
  opts: PollOptions = {}
): Promise<AccountNonceInfo> {
  const intervalMs = opts.intervalMs ?? 2000
  const timeoutMs = opts.timeoutMs ?? 120_000
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (opts.signal?.aborted) throw new Error('nonce wait aborted')
    const info = await fetchAccountNonce(address, opts)
    if (info.nonce >= targetNonce) return info
    await sleep(intervalMs, opts.signal)
  }
  throw new Error(`Timeout waiting for nonce >= ${targetNonce}`)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'))
      return
    }
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new Error('aborted'))
      },
      { once: true }
    )
  })
}

export class NonceTracker {
  private address: string
  private nextNonce: number | null = null
  private opts: PollOptions

  constructor(address: string, opts: PollOptions = {}) {
    this.address = address
    this.opts = opts
  }

  async syncFromNetwork(waitStable = true): Promise<number> {
    const info = waitStable
      ? await waitNonceStable(this.address, this.opts)
      : await fetchAccountNonce(this.address, this.opts)
    this.nextNonce = info.nonce
    return info.nonce
  }

  peek(): number {
    if (this.nextNonce == null) {
      throw new Error('NonceTracker not synced — call syncFromNetwork() first')
    }
    return this.nextNonce
  }

  next(): number {
    const n = this.peek()
    this.nextNonce = n + 1
    return n
  }

  releaseLast(): void {
    if (this.nextNonce != null && this.nextNonce > 0) this.nextNonce -= 1
  }

  async resetFromNetwork(): Promise<number> {
    return this.syncFromNetwork(true)
  }
}

export async function getFreshNonce(
  address: string,
  opts: PollOptions & { stable?: boolean } = {}
): Promise<number> {
  if (opts.stable === false) {
    return (await fetchAccountNonce(address, opts)).nonce
  }
  return (await waitNonceStable(address, opts)).nonce
}
