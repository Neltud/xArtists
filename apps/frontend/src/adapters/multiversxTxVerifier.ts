/**
 * Read-only MultiversX TX verification via public API.
 * Does not broadcast; used after SUBMITTED to resolve CONFIRMED | FAILED | UNKNOWN.
 */

import type { ITxVerifier, VerifyResult } from '../application/adapters'
import type { ChainId } from '../domain/chain'

const MVX_API = 'https://api.multiversx.com'

export class MultiversxApiTxVerifier implements ITxVerifier {
  readonly chainId: ChainId = 'mvx'

  constructor(private readonly apiBase: string = MVX_API) {}

  async verify(txHash: string): Promise<VerifyResult> {
    const hash = txHash?.trim()
    if (!hash || hash.length < 16) {
      return { status: 'failed', txHash: hash || '', error: 'invalid_tx_hash' }
    }

    try {
      const r = await fetch(`${this.apiBase}/transactions/${encodeURIComponent(hash)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (r.status === 404) {
        // Not found yet — ambiguous (pending vs never broadcast)
        return { status: 'unknown', txHash: hash }
      }

      if (!r.ok) {
        return { status: 'unknown', txHash: hash }
      }

      const data = (await r.json()) as {
        status?: string
        pendingResults?: boolean
      }

      const status = (data.status || '').toLowerCase()
      if (status === 'success') {
        return { status: 'confirmed', txHash: hash }
      }
      if (status === 'fail' || status === 'failed' || status === 'invalid') {
        return { status: 'failed', txHash: hash, error: status }
      }
      // pending / partially-executed / empty → fail-closed UNKNOWN if stuck
      return { status: 'unknown', txHash: hash }
    } catch {
      return { status: 'unknown', txHash: hash }
    }
  }
}
