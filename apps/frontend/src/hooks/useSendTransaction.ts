import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { signBlockReason, hasSendTxInjected } from '../lib/txCapability'
import { bootstrapSendTx } from '../providers/bootstrapSendTx'

interface TransactionDisplayInfo {
  processingMessage?: string
  errorMessage?: string
  successMessage?: string
}

interface SendTransactionResult {
  sessionId: string | null
  error: string | null
}

/** Send MultiversX TX — blocks paste_readonly, LIA ops. Uses __xartistsSendTx (wallet hook). */
export const useSendTransaction = () => {
  const { connected, address, method } = useWallet()

  const send = async (
    transactions: unknown[],
    displayInfo?: TransactionDisplayInfo
  ): Promise<SendTransactionResult> => {
    if (!connected) {
      throw new Error('Wallet non connecté')
    }

    if (address && address.toLowerCase() === LIA_WALLET.toLowerCase()) {
      return {
        sessionId: null,
        error:
          'Wallet protocole LIA interdit pour les TX user. Déconnecte et utilise ton wallet.',
      }
    }

    if (!hasSendTxInjected()) {
      bootstrapSendTx()
    }

    const block = signBlockReason(method)
    if (block && method === 'paste_readonly') {
      return { sessionId: null, error: block }
    }
    if (method === 'pem') {
      return { sessionId: null, error: block || 'PEM interdit côté dApp user.' }
    }
    if (!method) {
      return { sessionId: null, error: 'Connecte xPortal ou Web Wallet.' }
    }

    const w = window as unknown as {
      __xartistsSendTx?: (
        txs: unknown[],
        info?: TransactionDisplayInfo
      ) => Promise<{ sessionId?: string }>
    }

    if (typeof w.__xartistsSendTx !== 'function') {
      bootstrapSendTx()
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

    return {
      sessionId: null,
      error: 'Bridge TX indisponible — recharge la page.',
    }
  }

  return { send }
}
