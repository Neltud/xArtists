/** Relayer gasless — cycle de vie (paper jusqu’à infra prod). */

import type { LiaIntent, TransactionReceipt, TxLifecycle } from '../types'
import { evaluateIntent } from '../guardian'
import { decimalsForChain } from '../constants'

export class RelayerService {
  private nonces = new Map<string, number>()

  async submit(intent: LiaIntent): Promise<TransactionReceipt> {
    const g = evaluateIntent(intent)
    if (!g.allowed) {
      return this.receipt(intent, 'FAILED', '0xguardian_block', '0')
    }
    const expected = decimalsForChain(intent.chain)
    if (intent.decimals !== expected) {
      return this.receipt(intent, 'FAILED', '0xdecimal_err', '0')
    }

    const key = intent.target_address || 'relayer'
    const n = (this.nonces.get(key) || 0) + 1
    this.nonces.set(key, n)

    // Paper path — no broadcast
    return this.receipt(intent, 'SUCCESS', `paper_${n}_${Date.now()}`, '0', 'CONFIRMED')
  }

  private receipt(
    intent: LiaIntent,
    status: TransactionReceipt['status'],
    tx_hash: string,
    gas: string,
    lifecycle: TxLifecycle = status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED'
  ): TransactionReceipt {
    return {
      tx_hash,
      status,
      chain: intent.chain,
      gas_spent_by_relayer: gas,
      final_atomic_amount: intent.amount_atomic,
      lifecycle,
    }
  }
}
