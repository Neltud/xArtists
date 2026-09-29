/**
 * Inject window.__xartistsSendTx for user TX (stake / market / studio mint).
 * Priority:
 *  1) Active xPortal WC session → sign in xPortal app
 *  2) sdk-dapp sendTransactions if DappProvider session active
 *  3) Web Wallet hook URL — always OK for signable methods (xportal session lost, web_wallet)
 * Never holds PEM — user signs in their wallet app.
 */
import {
  empireTxStart,
  empireTxSigning,
  empireTxBroadcast,
  empireTxSuccess,
  empireTxError,
} from '../store/empireStore'
import { DAPP_CALLBACK_BASE } from '../config/sdkDapp'
import {
  getXPortalSession,
  signWithXPortalSession,
  broadcastSignedTx,
} from '../lib/xportalWc'

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

function buildWalletHookUrl(tx: TxInput, callbackUrl: string): string {
  const params = new URLSearchParams()
  params.set('receiver', tx.receiver || '')
  params.set('value', tx.value || '0')
  params.set('gasLimit', String(tx.gasLimit ?? 12_000_000))
  if (tx.data) params.set('data', tx.data)
  params.set('callbackUrl', callbackUrl)
  return `${WALLET_HOOK}?${params.toString()}`
}

function defaultCallback(): string {
  try {
    const origin = (DAPP_CALLBACK_BASE || 'https://neltud.github.io/xArtists').replace(/\/$/, '')
    const hash = window.location.hash || '#/studio'
    return `${origin}/${hash.startsWith('#') ? hash : '#' + hash}`
  } catch {
    return 'https://neltud.github.io/xArtists/#/studio'
  }
}

function walletMethod(): string | null {
  try {
    const raw = localStorage.getItem('xartists_wallet')
    if (!raw) return null
    const p = JSON.parse(raw) as { method?: string }
    return p.method || null
  } catch {
    return null
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

async function tryXPortalSignAndBroadcast(list: unknown[]): Promise<SendResult | null> {
  if (!getXPortalSession()) return null
  const plains = list.map(toPlainTx)
  if (!plains[0]?.receiver?.startsWith('erd1')) return null

  const signed = await signWithXPortalSession(plains)
  if (!signed.ok) {
    empireTxError(signed.error)
    throw new Error(signed.error)
  }

  empireTxBroadcast('xportal-wc')
  const first = signed.signed[0]
  const br = await broadcastSignedTx(first)
  if (br.error || !br.hash) {
    const msg = br.error || 'Broadcast échoué'
    empireTxError(msg)
    throw new Error(msg)
  }
  empireTxSuccess(br.hash, `${EXPLORER}/transactions/${br.hash}`)
  return { sessionId: br.hash }
}

function openWebWalletHook(plain: TxInput): SendResult {
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

function injectSendTx() {
  const w = window as unknown as {
    __xartistsSendTx?: (txs: unknown[], info?: DisplayInfo) => Promise<SendResult>
  }

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

    const method = walletMethod()

    // Read-only / pem never sign
    if (method === 'paste_readonly' || method === 'pem') {
      const msg =
        method === 'pem'
          ? 'PEM interdit côté dApp user.'
          : 'Lecture seule — Disconnect puis xPortal ou Web Wallet.'
      empireTxError(msg)
      throw new Error(msg)
    }

    // 1) Live xPortal WC session
    if (getXPortalSession()) {
      try {
        const xp = await tryXPortalSignAndBroadcast(list)
        if (xp?.sessionId) return xp
      } catch (e) {
        throw e
      }
    }

    // 2) sdk-dapp
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

    // 3) Web Wallet hook — xportal (session perdue), web_wallet, defi without sdk, null
    //    Mobile xPortal users often land here after navigation; hook still signs in app.
    const plain = toPlainTx(list[0])
    if (!plain.receiver || !plain.receiver.startsWith('erd1')) {
      const msg = 'Receiver invalide'
      empireTxError(msg)
      throw new Error(msg)
    }

    if (method === 'xportal' && !getXPortalSession()) {
      // Soft notice then redirect — do not hard-fail Studio / stake
      console.info(
        '[xArtists] Session WC absente — fallback Web Wallet hook (même adresse).',
      )
    }

    return openWebWalletHook(plain)
  }
}

export function bootstrapSendTx(): void {
  if (typeof window === 'undefined') return
  try {
    injectSendTx()
  } catch (e) {
    console.warn('[bootstrapSendTx]', e)
  }
}
