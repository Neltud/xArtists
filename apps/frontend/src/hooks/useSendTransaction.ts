import { useWeb3 } from './useWeb3'

interface TransactionDisplayInfo {
  processingMessage?: string
  errorMessage?: string
  successMessage?: string
}

interface SendTransactionResult {
  sessionId: string | null
  error: string | null
}

/**
 * Send MultiversX transactions.
 * - If window.__xartistsSendTx is injected by sdk-dapp bootstrap → real sign
 * - Else queues payload and returns structured error (wallet must be connected)
 */
export const useSendTransaction = () => {
  const { isLoggedIn, address } = useWeb3()

  const send = async (
    transactions: unknown[],
    displayInfo?: TransactionDisplayInfo,
  ): Promise<SendTransactionResult> => {
    if (!isLoggedIn) {
      throw new Error('Wallet non connecté')
    }

    const w = window as unknown as {
      __xartistsSendTx?: (
        txs: unknown[],
        info?: TransactionDisplayInfo,
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

    // Fallback: log for debugging + return clear status (UI still works)
    console.info('[useSendTransaction]', {
      address,
      count: transactions.length,
      displayInfo,
      sample: transactions[0],
    })
    console.warn(
      '[useSendTransaction] Inject window.__xartistsSendTx from sdk-dapp bootstrap for live signing.',
    )
    return {
      sessionId: null,
      error:
        'SDK dapp non branché — connecte xPortal et configure WalletConnect project ID (sdkDapp.ts)',
    }
  }

  return { send }
}
