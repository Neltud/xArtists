/**
 * xPortal / WalletConnect V2 — mainnet login + TX sign.
 * Keep provider session so signature opens xPortal approval (not web-wallet hook).
 */
import { XPORTAL_DEEP_LINKS, sdkDappConfig, WALLET_CONNECT_V2_RELAY_URL } from '../config/sdkDapp'
import * as WcNs from '@multiversx/sdk-wallet-connect-provider'

const MAINNET = '1'

export type XPortalLoginProgress = {
  phase: 'init' | 'uri' | 'waiting' | 'done' | 'error'
  uri?: string
  message?: string
}

type PlainTx = {
  receiver?: string
  value?: string
  data?: string
  gasLimit?: number | string
  chainID?: string
  sender?: string
  nonce?: number
}

type XcProvider = {
  init: () => Promise<boolean>
  connect: () => Promise<{ uri?: string; approval: () => Promise<unknown> }>
  getAddress?: () => Promise<string>
  address?: string
  signTransactions?: (txs: unknown[]) => Promise<unknown[]>
  signTransaction?: (tx: unknown) => Promise<unknown>
  sendCustomRequest?: (args: unknown) => Promise<unknown>
  logout?: () => Promise<void>
}

type WcCtor = new (
  callbacks: unknown,
  chainId: string,
  relayUrl: string,
  projectId: string,
) => XcProvider

/** Singleton — must survive between login and sign */
let activeProvider: XcProvider | null = null
let activeAddress: string | null = null

export function getXPortalSession(): { address: string; provider: XcProvider } | null {
  if (activeProvider && activeAddress) {
    return { address: activeAddress, provider: activeProvider }
  }
  return null
}

export function clearXPortalSession(): void {
  try {
    void activeProvider?.logout?.()
  } catch {
    /* */
  }
  activeProvider = null
  activeAddress = null
}

function resolveWalletConnectCtor(): WcCtor | null {
  const roots: unknown[] = [WcNs, (WcNs as { default?: unknown }).default]
  for (const root of roots) {
    if (!root || typeof root !== 'object') continue
    const r = root as Record<string, unknown>
    const direct = r.WalletConnectV2Provider
    if (typeof direct === 'function') return direct as WcCtor
    const nested = r.default
    if (nested && typeof nested === 'object') {
      const n = (nested as Record<string, unknown>).WalletConnectV2Provider
      if (typeof n === 'function') return n as WcCtor
    }
    if (typeof nested === 'function' && /WalletConnect/i.test(String(nested.name))) {
      return nested as WcCtor
    }
    for (const v of Object.values(r)) {
      if (typeof v === 'function' && /WalletConnectV2/i.test(String((v as { name?: string }).name || v))) {
        return v as WcCtor
      }
    }
  }
  return null
}

function isMobileUa(): boolean {
  return /iPhone|iPad|Android/i.test(navigator.userAgent || '')
}

/** Show QR on desktop; universal link on mobile — never xportal:// in Chrome tab */
function presentWcUri(uri: string) {
  try {
    // Dispatch for WalletConnectPanel QR
    window.dispatchEvent(new CustomEvent('xartists-wc-uri', { detail: { uri } }))
  } catch {
    /* */
  }

  const deep =
    (typeof XPORTAL_DEEP_LINKS.walletConnectUri === 'function'
      ? XPORTAL_DEEP_LINKS.walletConnectUri(uri)
      : null) ||
    `https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=${encodeURIComponent(
      `https://xportal.com/?wallet-connect=${encodeURIComponent(uri)}`,
    )}`

  if (isMobileUa()) {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = deep
    document.body.appendChild(iframe)
    setTimeout(() => {
      try {
        document.body.removeChild(iframe)
      } catch {
        /* */
      }
    }, 3000)
    window.open(deep, '_blank', 'noopener,noreferrer')
  }
  // Desktop: QR only (event) — user scans with xPortal camera
}

export async function loginWithXPortalMainnet(
  onProgress?: (p: XPortalLoginProgress) => void,
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
  const projectId = sdkDappConfig.walletConnectV2ProjectId
  if (!projectId || projectId.length < 32) {
    return {
      ok: false,
      error:
        'WalletConnect projectId manquant. Utilise Web Wallet (recommandé sur GitHub Pages).',
    }
  }

  const WalletConnectV2Provider = resolveWalletConnectCtor()
  if (!WalletConnectV2Provider) {
    return {
      ok: false,
      error:
        'Module WalletConnect indisponible dans ce build. Utilise Web Wallet (recommandé).',
    }
  }

  onProgress?.({ phase: 'init', message: 'Initialisation WalletConnect mainnet…' })
  clearXPortalSession()

  try {
    const callbacks = {
      onClientLogin: async () => undefined,
      onClientLogout: async () => {
        activeProvider = null
        activeAddress = null
      },
      onClientEvent: async () => undefined,
    }

    const provider = new WalletConnectV2Provider(
      callbacks,
      MAINNET,
      WALLET_CONNECT_V2_RELAY_URL,
      projectId,
    )

    await provider.init()
    const { uri, approval } = await provider.connect()

    if (uri) {
      onProgress?.({
        phase: 'uri',
        uri,
        message: isMobileUa()
          ? 'Ouvre xPortal et approuve…'
          : 'Scanne le QR avec xPortal (caméra) ou ouvre le lien universel.',
      })
      presentWcUri(uri)
    }

    onProgress?.({
      phase: 'waiting',
      uri,
      message: 'En attente d’approbation dans xPortal…',
    })
    await approval()

    let address = ''
    if (typeof provider.getAddress === 'function') {
      address = (await provider.getAddress()).trim()
    } else if (provider.address) {
      address = String(provider.address).trim()
    }

    if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
      return { ok: false, error: 'Adresse xPortal invalide après login.' }
    }

    // KEEP session for TX sign
    activeProvider = provider
    activeAddress = address

    onProgress?.({ phase: 'done', message: address })
    return { ok: true, address }
  } catch (e) {
    clearXPortalSession()
    const msg = e instanceof Error ? e.message : String(e)
    onProgress?.({ phase: 'error', message: msg })
    if (/reject/i.test(msg)) {
      return { ok: false, error: 'Connexion refusée dans xPortal.' }
    }
    return {
      ok: false,
      error: `xPortal WC indisponible (${msg.slice(0, 80)}). Utilise Web Wallet.`,
    }
  }
}

async function fetchAccountNonce(address: string): Promise<number> {
  try {
    const r = await fetch(`https://api.multiversx.com/accounts/${address}`)
    if (!r.ok) return 0
    const j = await r.json()
    return Number(j.nonce ?? 0)
  } catch {
    return 0
  }
}

/** Build sdk-core Transaction if available, else plain object WC accepts */
async function toSignableTx(plain: PlainTx, sender: string, nonce: number): Promise<unknown> {
  try {
    const core = await import('@multiversx/sdk-core')
    const Transaction = (core as { Transaction?: new (o: Record<string, unknown>) => unknown }).Transaction
    const Address = (core as { Address?: { fromBech32: (s: string) => unknown } }).Address
    const TransactionPayload = (core as { TransactionPayload?: { fromEncoded?: (s: string) => unknown; fromString?: (s: string) => unknown } }).TransactionPayload
    if (Transaction && Address) {
      let dataField: unknown = plain.data || ''
      if (TransactionPayload?.fromString && plain.data) {
        dataField = TransactionPayload.fromString(plain.data)
      }
      return new Transaction({
        nonce,
        value: plain.value || '0',
        receiver: Address.fromBech32(plain.receiver || ''),
        sender: Address.fromBech32(sender),
        gasLimit: Number(plain.gasLimit ?? 12_000_000),
        chainID: plain.chainID || MAINNET,
        data: dataField,
      })
    }
  } catch {
    /* fall through */
  }
  return {
    nonce,
    value: plain.value || '0',
    receiver: plain.receiver,
    sender,
    gasLimit: Number(plain.gasLimit ?? 12_000_000),
    chainID: plain.chainID || MAINNET,
    data: plain.data || '',
    version: 1,
  }
}

/**
 * Sign + return signed txs via active xPortal WC session.
 * Opens native xPortal approval sheet (correct popup).
 */
export async function signWithXPortalSession(
  plains: PlainTx[],
): Promise<{ ok: true; signed: unknown[] } | { ok: false; error: string }> {
  const session = getXPortalSession()
  if (!session) {
    return {
      ok: false,
      error:
        'Session xPortal expirée. Reconnecte via « xPortal mainnet (WalletConnect) » puis réessaie.',
    }
  }

  const { provider, address } = session
  const nonce = await fetchAccountNonce(address)
  const signables: unknown[] = []
  for (let i = 0; i < plains.length; i++) {
    signables.push(await toSignableTx(plains[i], address, nonce + i))
  }

  try {
    let signed: unknown[]
    if (typeof provider.signTransactions === 'function') {
      signed = await provider.signTransactions(signables)
    } else if (typeof provider.signTransaction === 'function') {
      signed = [await provider.signTransaction(signables[0])]
    } else {
      return {
        ok: false,
        error: 'Provider WC sans signTransactions — reconnecte xPortal.',
      }
    }
    return { ok: true, signed }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/reject|denied|cancel/i.test(msg)) {
      return { ok: false, error: 'Signature refusée dans xPortal.' }
    }
    return { ok: false, error: `Signature xPortal : ${msg.slice(0, 120)}` }
  }
}

/** Broadcast signed TX to MultiversX gateway */
export async function broadcastSignedTx(signed: unknown): Promise<{ hash?: string; error?: string }> {
  try {
    const body =
      typeof signed === 'string'
        ? signed
        : JSON.stringify(
            // sdk-core Transaction often has toPlainObject / toSendable
            typeof (signed as { toSendable?: () => unknown }).toSendable === 'function'
              ? (signed as { toSendable: () => unknown }).toSendable()
              : typeof (signed as { toPlainObject?: () => unknown }).toPlainObject === 'function'
                ? (signed as { toPlainObject: () => unknown }).toPlainObject()
                : signed,
          )

    const r = await fetch('https://gateway.multiversx.com/transaction/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' && body.startsWith('{') ? body : JSON.stringify({ transaction: signed }),
    })
    const j = await r.json()
    const hash = j?.data?.txHash || j?.txHash
    if (hash) return { hash: String(hash) }
    return { error: j?.error || j?.message || 'Broadcast échoué' }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'broadcast failed' }
  }
}
