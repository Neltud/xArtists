/**
 * Transactional monitoring — MultiversX API réelle.
 * Pas de succès factice : seul le statut API (success/fail/pending) fait autorité.
 */

export type TxNetwork = 'mainnet' | 'devnet' | 'testnet'

export type TxChainStatus = 'pending' | 'success' | 'fail' | 'unknown' | 'not_found'

export type MonitoredTx = {
  hash: string
  network: TxNetwork
  status: TxChainStatus
  startedAt: number
  updatedAt: number
  polls: number
  explorerUrl: string
  error?: string
  /** Optional intent correlation */
  intentId?: string
}

type Listener = (tx: MonitoredTx) => void

const API: Record<TxNetwork, string> = {
  mainnet: 'https://api.multiversx.com',
  devnet: 'https://devnet-api.multiversx.com',
  testnet: 'https://testnet-api.multiversx.com',
}

const EXPLORER: Record<TxNetwork, string> = {
  mainnet: 'https://explorer.multiversx.com',
  devnet: 'https://devnet-explorer.multiversx.com',
  testnet: 'https://testnet-explorer.multiversx.com',
}

const DEFAULT_INTERVAL_MS = 3000
const MAX_POLLS = 60 // ~3 min

function mapStatus(raw: string | undefined): TxChainStatus {
  const s = (raw || '').toLowerCase()
  if (s === 'success' || s === 'executed') return 'success'
  if (s === 'pending' || s === 'received') return 'pending'
  if (s === 'fail' || s === 'invalid' || s === 'invalidtx') return 'fail'
  if (!raw) return 'not_found'
  return 'unknown'
}

export class TransactionMonitor {
  private watches = new Map<string, { timer: number; tx: MonitoredTx }>()
  private listeners = new Set<Listener>()
  private history: MonitoredTx[] = []

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(tx: MonitoredTx) {
    this.listeners.forEach(fn => {
      try {
        fn(tx)
      } catch {
        /* ignore listener errors */
      }
    })
  }

  getHistory(): MonitoredTx[] {
    return [...this.history]
  }

  getActive(): MonitoredTx[] {
    return [...this.watches.values()].map(w => w.tx)
  }

  explorerUrl(hash: string, network: TxNetwork = 'mainnet'): string {
    return `${EXPLORER[network]}/transactions/${hash}`
  }

  /** One-shot status fetch from MultiversX API. */
  async fetchStatus(hash: string, network: TxNetwork = 'mainnet'): Promise<TxChainStatus> {
    if (!hash || hash.length < 16) return 'unknown'
    if (hash.startsWith('0xFAKE') || hash.includes('FAKE')) return 'fail'
    try {
      const r = await fetch(`${API[network]}/transactions/${hash}`, { cache: 'no-store' })
      if (r.status === 404) return 'not_found'
      if (!r.ok) return 'unknown'
      const j = (await r.json()) as { status?: string }
      return mapStatus(j.status)
    } catch {
      return 'unknown'
    }
  }

  /**
   * Start polling until success, fail, or max polls.
   * Returns immediately with initial pending state.
   */
  watch(
    hash: string,
    opts?: {
      network?: TxNetwork
      intentId?: string
      intervalMs?: number
      maxPolls?: number
      onUpdate?: (tx: MonitoredTx) => void
    }
  ): MonitoredTx {
    const network = opts?.network ?? 'mainnet'
    const key = `${network}:${hash}`

    // Cancel previous watch on same hash
    this.unwatch(hash, network)

    const tx: MonitoredTx = {
      hash,
      network,
      status: 'pending',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      polls: 0,
      explorerUrl: this.explorerUrl(hash, network),
      intentId: opts?.intentId,
    }

    const interval = opts?.intervalMs ?? DEFAULT_INTERVAL_MS
    const maxPolls = opts?.maxPolls ?? MAX_POLLS

    const tick = async () => {
      const entry = this.watches.get(key)
      if (!entry) return

      entry.tx.polls += 1
      const status = await this.fetchStatus(hash, network)
      entry.tx.status = status
      entry.tx.updatedAt = Date.now()

      if (status === 'not_found' && entry.tx.polls < 3) {
        // TX may not be indexed yet — keep pending
        entry.tx.status = 'pending'
      }

      this.emit(entry.tx)
      opts?.onUpdate?.(entry.tx)

      const terminal =
        entry.tx.status === 'success' ||
        entry.tx.status === 'fail' ||
        entry.tx.polls >= maxPolls

      if (terminal) {
        if (entry.tx.polls >= maxPolls && entry.tx.status === 'pending') {
          entry.tx.error = 'Timeout monitoring — vérifier explorer'
        }
        this.history.unshift({ ...entry.tx })
        if (this.history.length > 50) this.history.pop()
        this.unwatch(hash, network)
      }
    }

    const timer = window.setInterval(() => {
      void tick()
    }, interval) as unknown as number

    this.watches.set(key, { timer, tx })
    this.emit(tx)
    void tick() // immediate first poll

    return tx
  }

  unwatch(hash: string, network: TxNetwork = 'mainnet') {
    const key = `${network}:${hash}`
    const entry = this.watches.get(key)
    if (!entry) return
    window.clearInterval(entry.timer)
    this.watches.delete(key)
  }

  unwatchAll() {
    for (const [, entry] of this.watches) {
      window.clearInterval(entry.timer)
    }
    this.watches.clear()
  }
}

export const transactionMonitor = new TransactionMonitor()
