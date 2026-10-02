/**
 * Inject window.__xartistsSendTx
 * Multi-TX: sign batch + broadcast EACH signed tx (nonce chain).
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
  ensureXPortalSession,
  signWithXPortalSession,
  broadcastSignedTx,
} from '../lib/xportalWc'
import { getSignMode, markPipeline, DIRECT_SHEET_BUDGET_MS } from '../lib/signTransport'

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
  const t0 = markPipeline('ensure_session')
  if (!getXPortalSession()) {
    await ensureXPortalSession()
  }
  if (!getXPortalSession()) return null

  const plains = list.map(toPlainTx)
  if (!plains[0]?.receiver?.startsWith('erd1')) return null

  markPipeline('sheet', t0)
  const signed = await signWithXPortalSession(plains)
  if (!signed.ok) {
    empireTxError(signed.error)
    throw new Error(signed.error)
  }

  empireTxBroadcast('xportal-wc')
  markPipeline('broadcast', t0)

  // Multi-TX: broadcast every signed tx in order
  let lastHash = ''
  for (let i = 0; i < signed.signed.length; i++) {
    const br = await broadcastSignedTx(signed.signed[i])
    if (br.error || !br.hash) {
      const msg =
        signed.signed.length > 1
          ? `TX ${i + 1}/${signed.signed.length}: ${br.error || 'broadcast \u00e9chou\u00e9'}`
          : br.error || 'Broadcast \u00e9chou\u00e9'
      empireTxError(msg)
      throw new Error(msg)
    }
    lastHash = br.hash
    // small gap so gateway accepts sequential nonces
    if (i < signed.signed.length - 1) {
      await new Promise(r => setTimeout(r, 400))
    }
  }

  empireTxSuccess(lastHash, `${EXPLORER}/transactions/${lastHash}`)
  markPipeline('done', t0)
  return { sessionId: lastHash }
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
    const mode = getSignMode()

    if (method === 'paste_readonly' || method === 'pem') {
      const msg =
        method === 'pem'
          ? 'PEM interdit c\u00f4t\u00e9 dApp user.'
          : 'Lecture seule \u2014 Disconnect puis xPortal ou Web Wallet.'
      empireTxError(msg)
      throw new Error(msg)
    }

    const preferWc =
      mode === 'direct' || mode === 'wc' || method === 'xportal' || !!getXPortalSession()

    if (preferWc && mode !== 'hook') {
      try {
        const xpPromise = tryXPortalSignAndBroadcast(list)
        const timeout = new Promise<null>(resolve =>
          setTimeout(() => resolve(null), DIRECT_SHEET_BUDGET_MS * 8),
        )
        const xp = await Promise.race([xpPromise, timeout.then(() => xpPromise)])
        if (xp?.sessionId) return xp
      } catch (e) {
        if (method === 'xportal' || mode === 'wc') throw e
        console.warn('[sign] WC path failed, fallback', e)
      }
    }

    if (mode !== 'hook') {
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
    }

    const plain = toPlainTx(list[0])
    if (!plain.receiver || !plain.receiver.startsWith('erd1')) {
      const msg = 'Receiver invalide'
      empireTxError(msg)
      throw new Error(msg)
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
