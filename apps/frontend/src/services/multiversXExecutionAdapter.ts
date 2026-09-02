/**
 * MultiversXExecutionAdapter — exécution réelle appelée DEPUIS Vellum workflows.
 *
 * Vellum = orchestration IA (app.vellum.ai), PAS une chaîne / DEX / relayer.
 * Les swaps s’exécutent sur MultiversX (xExchange, OneDex), pas « sur Vellum ».
 *
 * Ne retourne JAMAIS un succès factice sans provider injecté.
 */

export interface AdapterIntent {
  type: string
  target: string
  action: string
  args: unknown[]
}

export interface MxChainAction {
  targetContract: string
  method: string
  params: unknown[]
}

export interface BroadcastResult {
  success: boolean
  txHash?: string
  error?: string
}

/** Implémentation réelle = sdk-dapp sign+send. Jamais fake ici. */
export interface MultiversXTransactionSender {
  sendTransaction(action: MxChainAction): Promise<{ txHash: string }>
}

export class MultiversXExecutionAdapter {
  constructor(private readonly sender: MultiversXTransactionSender) {}

  translateIntentToAction(intent: AdapterIntent): MxChainAction {
    return {
      targetContract: intent.target,
      method: intent.action,
      params: intent.args,
    }
  }

  async broadcastAction(action: MxChainAction): Promise<BroadcastResult> {
    try {
      const result = await this.sender.sendTransaction(action)
      if (!result.txHash || result.txHash.includes('FAKE')) {
        return { success: false, error: 'Hash invalide ou factice refusé' }
      }
      return { success: true, txHash: result.txHash }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

/** Tests unitaires uniquement — jamais brancher en prod. */
export class __TEST_ONLY_FakeSender implements MultiversXTransactionSender {
  async sendTransaction(_action: MxChainAction): Promise<{ txHash: string }> {
    return { txHash: '0xFAKE_TEST_HASH_NEVER_REAL' }
  }
}
