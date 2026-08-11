import { useWallet } from '../context/WalletContext'
import { canSignOnChain, signBlockReason } from '../lib/txCapability'

interface TransactionDisplayInfo {
  processingMessage?: string
  errorMessage?: string
  successMessage?: string
}

interface SendTransactionResult {
  sessionId: string | null
  error: string | null
}

/** Send MultiversX TX — blocks paste_readonly and missing sdk-dapp. */
export const useSendTransaction = () => {
  const { connected, address, method } = useWallet()

  const send = async (
    transactions: unknown[],
    displayInfo?: TransactionDisplayInfo
  ): Promise<SendTransactionResult> => {
    if (!connected) {
      throw new Error('Wallet non connecté')
    }

    const block = signBlockReason(method)
    if (block) {
      return { sessionId: null, error: block }
    }

    if (!canSignOnChain(method)) {
      return {
        sessionId: null,
        error:
          'Signature non disponible — xPortal / DeFi Wallet + TxShell (page Market), pas coller erd1.',
      }
    }

    const w = window as unknown as {
      __xartistsSendTx?: (
        txs: unknown[],
        info?: TransactionDisplayInfo
      ) => Promise<{ sessionId?: string }>
    }

    if (typeof w.__xartistsSendTx === 'function') {
      try {
        const res = await w.__xartistsSendTx(transactions, displayInfo)
        return { sessionId: res?.sessionId ?? 'submitted', error: null }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'send failed'
        return { sessionId: null, error: msg }
      }
    }

    console.info('[useSendTransaction]', { address, count: transactions.length, displayInfo })
    return {
      sessionId: null,
      error: 'SDK dapp non branché — __xartistsSendTx manquant après TxShell.',
    }
  }

  return { send }
}
