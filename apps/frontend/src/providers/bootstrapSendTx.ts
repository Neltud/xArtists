/**
 * Inject window.__xartistsSendTx for user TX (stake / market / venue).
 * Priority:
 *  1) sdk-dapp sendTransactions if DappProvider session is active
 *  2) MultiversX Web Wallet / xPortal hook URL (works on mobile GH Pages)
 * Never holds PEM — user signs in their wallet app.
 */
import { empireTxStart, empireTxSigning, empireTxBroadcast, empireTxSuccess, empireTxError } from '../store/empireStore'
import { DAPP_CALLBACK_BASE } from '../config/sdkDapp'

const EXPLORER = 'https://explorer.multiversx.com'
const WALLET_HOOK = 'https://wallet.multiversx.com/hook/transaction'

type TxInput = {
  receiver?: string
  value?: string
  data?: string
  gasLimit?: number | string
  sender?: string
  nonce?: number
  chainID?: string
}

type DisplayInfo = {
  processingMessage?: string
  successMessage?: string
  errorMessage?: string
}

type SendResult = { sessionId?: string }

function toPlainTx(t: unknown): TxInput {
  if (!t || typeof t !== 'object') return {}
  const o = t as Record<string, unknown>
  return {
    receiver: String(o.receiver ?? ''),
    value: String(o.value ?? '0'),
    data: typeof o.data === 'string' ? o.data : '',
    gasLimit: (o.gasLimit as number | string) ?? 12_000_000,
    sender: o.sender ? String(o.sender) : undefined,
    chainID: o.chainID ? String(o.chainID) : '1',
  }
}

/** Build MultiversX web-wallet / xPortal transaction hook URL */
function buildWalletHookUrl(tx: TxInput, callbackUrl: string): string {
  const params = new URLSearchParams()
  params.set('receiver', tx.receiver || '')
  params.set('value', tx.value || '0')
  params.set('gasLimit', String(tx.gasLimit ?? 12_000_000))
  if (tx.data) {
    params.set('data', tx.data)
  }
  params.set('callbackUrl', callbackUrl)
  return `${WALLET_HOOK}?${params.toString()}`
}

function defaultCallback(): string {
  try {
    const origin = (DAPP_CALLBACK_BASE || 'https://neltud.github.io/xArtists').replace(/\/$/, '')
    const hash = window.location.hash || '#/staking'
    return `${origin}/${hash.startsWith('#') ? hash : '#' + hash}`
  } catch {
    return 'https://neltud.github.io/xArtists/#/staking'
  }
}

async function trySdkDappSend(
  txs: unknown[],
  info?: DisplayInfo,
): Promise<SendResult | null> {
  try {
    const mod = await import('@multiversx/sdk-dapp/services/transactions/sendTransactions')
    const sendTransactions = (mod as { sendTransactions?: Function }).sendTransactions
    if (typeof sendTransactions !== 'function') return null
    const result = await sendTransactions({
      transactions: txs,
      transactionsDisplayInfo: {
        processingMessage: info?.processingMessage,
        successMessage: info?.successMessage,
        errorMessage: info?.errorMessage,
      },
    })
    const sessionId =
      (result as { sessionId?: string })?.sessionId ??
      (typeof result === 'string' ? result : 'submitted')
    return { sessionId }
  } catch {
    return null
  }
}

function injectSendTx() {
  const w = window as unknown as {
    __xartistsSendTx?: (txs: unknown[], info?: DisplayInfo) => Promise<SendResult>
  }
  if (typeof w.__xartistsSendTx === 'function') return

  w.__xartistsSendTx = async (txs, info) => {
    const label = info?.processingMessage || 'Transaction MultiversX'
    empireTxStart(label)
    empireTxSigning()

    const list = Array.isArray(txs) ? txs : [txs]
    if (!list.length) {
      const msg = 'Aucune transaction'
      empireTxError(msg)
      throw new Error(msg)
    }

    const sdkRes = await trySdkDappSend(list, info)
    if (sdkRes?.sessionId) {
      empireTxBroadcast(sdkRes.sessionId)
      const url =
        sdkRes.sessionId !== 'submitted'
          ? `${EXPLORER}/transactions/${sdkRes.sessionId}`
          : undefined
      empireTxSuccess(sdkRes.sessionId, url)
      return sdkRes
    }

    const plain = toPlainTx(list[0])
    if (!plain.receiver || !plain.receiver.startsWith('erd1')) {
      const msg = 'Receiver invalide'
      empireTxError(msg)
      throw new Error(msg)
    }

    const callback = defaultCallback()
    const hookUrl = buildWalletHookUrl(plain, callback)

    empireTxBroadcast('wallet-hook')
    try {
      window.location.assign(hookUrl)
    } catch {
      window.open(hookUrl, '_blank', 'noopener,noreferrer')
    }
    empireTxSuccess('wallet-hook', undefined)
    return { sessionId: 'wallet-hook' }
  }
}

/** Call once at app boot (MxDappProvider + TxShell). */
export function bootstrapSendTx(): void {
  if (typeof window === 'undefined') return
  try {
    injectSendTx()
  } catch (e) {
    console.warn('[bootstrapSendTx]', e)
  }
}
