import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { signBlockReason, hasSendTxInjected } from '../lib/txCapability'
import { bootstrapSendTx } from '../providers/bootstrapSendTx'
import { logTxFailure, shouldForcePaper } from '../lib/txLog'
import { forcePaperMode } from '../lib/appMode'
import { empireTxError } from '../store/empireStore'
import { LIA_LIVE_TRADING } from '../config/liaConfig'

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

/** Send MultiversX TX — LIA ops autorisé seulement si LIA_LIVE_TRADING=1 (xPortal). */
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

    const isLiaOps = address && address.toLowerCase() === LIA_WALLET.toLowerCase()
    if (isLiaOps && !LIA_LIVE_TRADING) {
      return handleFail(
        action,
        'Wallet protocole LIA interdit en mode paper. Active VITE_LIA_LIVE_TRADING=1 pour signer en ops xPortal.',
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
      return handleFail(action, block || 'PEM interdit côté dApp — utilise xPortal.')
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
