import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { signBlockReason, hasSendTxInjected } from '../lib/txCapability'
import { bootstrapSendTx } from '../providers/bootstrapSendTx'
import { logTxFailure, shouldForcePaper } from '../lib/txLog'
import { forcePaperMode } from '../lib/appMode'
import { empireTxError } from '../store/empireStore'

interface TransactionDisplayInfo {
  processingMessage?: string
  errorMessage?: string
  successMessage?: string
}

interface SendTransactionResult {
  sessionId: string | null
  error: string | null
}

function handleFail(action: string, msg: string, sessionId?: string | null): SendTransactionResult {
  const entry = logTxFailure(action, msg, sessionId)
  empireTxError(msg)
  if (shouldForcePaper(entry.kind, msg)) {
    forcePaperMode(`${entry.kind}: ${msg.slice(0, 120)}`)
  }
  return { sessionId: null, error: msg }
}

/** Send MultiversX TX — Phase 5: log failures + Safety Switch → paper on hard errors. */
export const useSendTransaction = () => {
  const { connected, address, method } = useWallet()

  const send = async (
    transactions: unknown[],
    displayInfo?: TransactionDisplayInfo,
  ): Promise<SendTransactionResult> => {
    const action = displayInfo?.processingMessage || 'tx'

    if (!connected) {
      return handleFail(action, 'Wallet non connecté')
    }

    if (address && address.toLowerCase() === LIA_WALLET.toLowerCase()) {
      return handleFail(
        action,
        'Wallet protocole LIA interdit pour les TX user. Déconnecte et utilise ton wallet.',
      )
    }

    if (!hasSendTxInjected()) {
      bootstrapSendTx()
    }

    const block = signBlockReason(method)
    if (block && method === 'paste_readonly') {
      return handleFail(action, block)
    }
    if (method === 'pem') {
      return handleFail(action, block || 'PEM interdit côté dApp user.')
    }
    if (!method) {
      return handleFail(action, 'Connecte xPortal ou Web Wallet.')
    }

    const w = window as unknown as {
      __xartistsSendTx?: (
        txs: unknown[],
        info?: TransactionDisplayInfo,
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
        return handleFail(action, msg)
      }
    }

    return handleFail(action, 'Bridge TX indisponible — recharge la page.')
  }

  return { send }
}
