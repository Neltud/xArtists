/**
 * xPortal / WalletConnect V2 — mainnet login + multi-TX sign.
 * Session kept in memory + restored after mobile app switch.
 */
import { XPORTAL_DEEP_LINKS, sdkDappConfig, WALLET_CONNECT_V2_RELAY_URL } from '../config/sdkDapp'
import * as WcNs from '@multiversx/sdk-wallet-connect-provider'

const MAINNET = '1'
const SESSION_ADDR_KEY = 'xartists_xportal_addr'

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

/** Singleton — survives between login and successive signs */
let activeProvider: XcProvider | null = null
let activeAddress: string | null = null
let restorePromise: Promise<boolean> | null = null

function persistAddr(addr: string | null) {
  try {
    if (addr) sessionStorage.setItem(SESSION_ADDR_KEY, addr)
    else sessionStorage.removeItem(SESSION_ADDR_KEY)
  } catch {
    /* */
  }
}

function readPersistedAddr(): string | null {
  try {
    const a = sessionStorage.getItem(SESSION_ADDR_KEY)
    return a && /^erd1[a-z0-9]{58}$/i.test(a) ? a : null
  } catch {
    return null
  }
}

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
  persistAddr(null)
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

function presentWcUri(uri: string) {
  try {
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
}

function makeCallbacks() {
  return {
    onClientLogin: async () => undefined,
    onClientLogout: async () => {
      // Soft clear — do not wipe mid multi-TX if relay flaps
      activeProvider = null
      activeAddress = null
    },
    onClientEvent: async () => undefined,
  }
}

async function readProviderAddress(provider: XcProvider): Promise<string> {
  if (typeof provider.getAddress === 'function') {
    return (await provider.getAddress()).trim()
  }
  if (provider.address) return String(provider.address).trim()
  return ''
}

/**
 * Re-attach to an existing WalletConnect session after mobile app switch / HMR.
 * Does NOT open a new QR if a pairing is still alive in the WC client.
 */
export async function ensureXPortalSession(): Promise<boolean> {
  // Fast path: live singleton
  if (activeProvider && activeAddress) {
    try {
      const a = await readProviderAddress(activeProvider)
      if (a && a.toLowerCase() === activeAddress.toLowerCase()) return true
    } catch {
      /* fall through to restore */
    }
  }

  if (restorePromise) return restorePromise

  restorePromise = (async () => {
    const projectId = sdkDappConfig.walletConnectV2ProjectId
    if (!projectId || projectId.length < 32) return false

    const WalletConnectV2Provider = resolveWalletConnectCtor()
    if (!WalletConnectV2Provider) return false

    try {
      const provider = new WalletConnectV2Provider(
        makeCallbacks(),
        MAINNET,
        WALLET_CONNECT_V2_RELAY_URL,
        projectId,
      )
      await provider.init()

      // Existing WC session? getAddress works without new connect()
      let address = ''
      try {
        address = await readProviderAddress(provider)
      } catch {
        address = ''
      }

      if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
        // Try persisted addr as soft hint only
        const hint = readPersistedAddr()
        if (!hint) return false
        return false
      }

      activeProvider = provider
      activeAddress = address
      persistAddr(address)
      console.info('[xArtists] xPortal session restored', address.slice(0, 12) + '…')
      return true
    } catch (e) {
      console.warn('[xArtists] xPortal restore failed', e)
      return false
    } finally {
      restorePromise = null
    }
  })()

  return restorePromise
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

  // Prefer restore over new QR when session already paired
  const restored = await ensureXPortalSession()
  if (restored && activeAddress) {
    onProgress?.({ phase: 'done', message: activeAddress })
    return { ok: true, address: activeAddress }
  }

  clearXPortalSession()

  try {
    const provider = new WalletConnectV2Provider(
      makeCallbacks(),
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

    const address = await readProviderAddress(provider)

    if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
      return { ok: false, error: 'Adresse xPortal invalide après login.' }
    }

    activeProvider = provider
    activeAddress = address
    persistAddr(address)

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
    const r = await fetch(`https://api.multiversx.com/accounts/${address}`, { cache: 'no-store' })
    if (!r.ok) return 0
    const j = await r.json()
    return Number(j.nonce ?? 0)
  } catch {
    return 0
  }
}

async function toSignableTx(plain: PlainTx, sender: string, nonce: number): Promise<unknown> {
  try {
    const core = await import('@multiversx/sdk-core')
    const Transaction = (core as { Transaction?: new (o: Record<string, unknown>) => unknown }).Transaction
    const Address = (core as { Address?: { fromBech32: (s: string) => unknown } }).Address
    const TransactionPayload = (
      core as {
        TransactionPayload?: {
          fromEncoded?: (s: string) => unknown
          fromString?: (s: string) => unknown
        }
      }
    ).TransactionPayload
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
 * Sign via active xPortal session (restore first if mobile killed JS).
 * Fresh nonce from API each call → multi-TX OK.
 */
export async function signWithXPortalSession(
  plains: PlainTx[],
): Promise<{ ok: true; signed: unknown[] } | { ok: false; error: string }> {
  // Multi-TX: always ensure session before sign
  if (!getXPortalSession()) {
    const ok = await ensureXPortalSession()
    if (!ok) {
      return {
        ok: false,
        error:
          'Session xPortal expirée. Reconnecte via « xPortal mainnet (WalletConnect) » puis réessaie.',
      }
    }
  }

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
    // Keep session for next TX
    activeProvider = provider
    activeAddress = address
    persistAddr(address)
    return { ok: true, signed }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Session dead → clear so next attempt restores or prompts reconnect
    if (/session|disconnect|expired|no matching/i.test(msg)) {
      activeProvider = null
      activeAddress = null
    }
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
