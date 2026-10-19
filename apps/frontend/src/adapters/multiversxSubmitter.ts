/**
 * MultiversX chain submitter — default is REJECT (no autonomous broadcast).
 *
 * Production path must: APPROVED digest → user-signed payload from sdk-dapp only.
 * This class documents the contract; wiring to real broadcast is a separate,
 * reviewed change and never runs in CI with live funds.
 */

import type { IChainSubmitter, SubmitResult } from '../application/adapters'
import type { ChainId } from '../domain/chain'

export class MultiversxRejectingSubmitter implements IChainSubmitter {
  readonly chainId: ChainId = 'mvx'

  async submit(_signedPayload: unknown): Promise<SubmitResult> {
    return {
      status: 'failed',
      error:
        'mvx_submitter_not_wired — use existing user-signed hooks (useAgentPackTx, etc.); no autonomous broadcast',
    }
  }
}

/**
 * Optional future: accept only pre-validated signed payloads after markApproved.
 * Not enabled: would require human review of financial controls before merge to main.
 */
export class MultiversxGuardedSubmitter implements IChainSubmitter {
  readonly chainId: ChainId = 'mvx'

  constructor(
    private readonly opts: {
      /** Must be true only after security review; default false */
      allowBroadcast: boolean
      submitFn?: (payload: unknown) => Promise<{ txHash?: string; error?: string }>
    },
  ) {}

  async submit(signedPayload: unknown): Promise<SubmitResult> {
    if (!this.opts.allowBroadcast || !this.opts.submitFn) {
      return {
        status: 'failed',
        error: 'broadcast_disabled',
      }
    }
    try {
      const r = await this.opts.submitFn(signedPayload)
      if (r.txHash) return { status: 'submitted', txHash: r.txHash }
      if (r.error) return { status: 'failed', error: r.error }
      return { status: 'unknown', detail: 'no_tx_hash' }
    } catch (e) {
      return {
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
      }
    }
  }
}
