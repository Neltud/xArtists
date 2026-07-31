/**
 * Global TX concurrency control — one in-flight chain of sends per account
 * Prevents nonce races when UI triggers parallel list/buy/cycle actions.
 */

type QueueJob<T> = {
  id: string
  address: string
  run: () => Promise<T>
  resolve: (v: T) => void
  reject: (e: unknown) => void
}

class TxQueue {
  private chains = new Map<string, Promise<unknown>>()
  private pendingCount = new Map<string, number>()
  private listeners = new Set<() => void>()

  /** Number of queued+running jobs for address (or all if omitted) */
  size(address?: string): number {
    if (address) return this.pendingCount.get(address.toLowerCase()) || 0
    let n = 0
    for (const v of this.pendingCount.values()) n += v
    return n
  }

  isBusy(address: string): boolean {
    return this.size(address) > 0
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    for (const fn of this.listeners) fn()
  }

  /**
   * Serialize work per address. Concurrent enqueue for same address runs FIFO.
   */
  enqueue<T>(address: string, run: () => Promise<T>, label = 'tx'): Promise<T> {
    const key = address.toLowerCase()
    const id = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    this.pendingCount.set(key, (this.pendingCount.get(key) || 0) + 1)
    this.notify()

    const prev = this.chains.get(key) || Promise.resolve()
    const next = prev
      .catch(() => {
        /* isolate previous failure */
      })
      .then(() => run())
      .finally(() => {
        const c = (this.pendingCount.get(key) || 1) - 1
        if (c <= 0) this.pendingCount.delete(key)
        else this.pendingCount.set(key, c)
        // If this promise is still the head chain tip, allow GC of map entry later
        this.notify()
      })

    this.chains.set(
      key,
      next.then(
        () => undefined,
        () => undefined
      )
    )

    return next
  }
}

/** Singleton — shared across hooks */
export const txQueue = new TxQueue()

export class TxConcurrencyError extends Error {
  readonly code = 'TX_CONCURRENCY'
  constructor(message = 'Une transaction est déjà en cours pour ce wallet') {
    super(message)
    this.name = 'TxConcurrencyError'
  }
}

/**
 * Optional hard lock: reject immediately if busy instead of queueing.
 */
export async function withTxLock<T>(
  address: string,
  run: () => Promise<T>,
  opts: { queue?: boolean; label?: string } = {}
): Promise<T> {
  if (opts.queue === false && txQueue.isBusy(address)) {
    throw new TxConcurrencyError()
  }
  return txQueue.enqueue(address, run, opts.label || 'tx')
}
