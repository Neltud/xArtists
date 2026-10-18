/**
 * xPortal / WalletConnect V2 — correct cycle:
 * init → connect → login({ approval }) → getAddress → UI connected.
 * QR local only; open app only on explicit user gesture.
 */
import { XPORTAL_DEEP_LINKS, sdkDappConfig, WALLET_CONNECT_V2_RELAY_URL, dappOrigin } from '../config/sdkDapp'
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
  login?: (opts: { approval: () => Promise<unknown> }) => Promise<unknown>
  getAddress?: () => Promise<string>
  address?: string
  signTransactions?: (txs: unknown[]) => Promise<unknown[]>
  signTransaction?: (tx: unknown) => Promise<unknown>
  sendCustomRequest?: (args: unknown) => Promise<unknown>
  logout?: () => Promise<void>
  ping?: () => Promise<boolean>
}

type WcCtor = new (
  callbacks: unknown,
  chainId: string,
  relayUrl: string,
  projectId: string,
  metadata?: { name?: string; description?: string; url?: string; icons?: string[] },
) => XcProvider

let activeProvider: XcProvider | null = null
let activeAddress: string | null = null
let restorePromise: Promise<boolean> | null = null
let signingLock = 0
let lastPing = 0
let lastWcUri: string | null = null

function persistAddr(addr: string | null) {
  try {
    if (addr) sessionStorage.setItem(SESSION_ADDR_KEY, addr)
    else sessionStorage.removeItem(SESSION_ADDR_KEY)
  } catch {
    /* */
  }
}

export function getLastWcUri(): string | null {
  return lastWcUri
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
  lastWcUri = null
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

/** Publish URI for local QR — does NOT auto-open the app */
function publishWcUri(uri: string) {
  lastWcUri = uri
  try {
    window.dispatchEvent(new CustomEvent('xartists-wc-uri', { detail: { uri } }))
  } catch {
    /* */
  }
}

/**
 * Open xPortal — must be called from a user gesture (button click).
 * No Firebase dynamic links.
 */
export function openXPortalApp(uri?: string): void {
  const u = uri || lastWcUri
  if (!u) {
    window.open(XPORTAL_DEEP_LINKS.web, '_blank', 'noopener,noreferrer')
    return
  }
  const target = XPORTAL_DEEP_LINKS.walletConnectUri(u)
  try {
    if (isMobileUa()) {
      window.location.href = XPORTAL_DEEP_LINKS.walletConnectNative(u)
      setTimeout(() => {
        window.open(XPORTAL_DEEP_LINKS.walletConnectHttps(u), '_blank', 'noopener,noreferrer')
      }, 600)
    } else {
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  } catch {
    window.open(XPORTAL_DEEP_LINKS.walletConnectHttps(u), '_blank', 'noopener,noreferrer')
  }
}

function makeCallbacks() {
  return {
    onClientLogin: async () => undefined,
    onClientLogout: async () => {
      if (signingLock > 0) {
        console.warn('[xArtists] WC logout ignored during sign')
        return
      }
      activeProvider = null
      activeAddress = null
      try {
        window.dispatchEvent(new CustomEvent('xartists-wc-logout'))
      } catch {
        /* */
      }
    },
    onClientEvent: async () => undefined,
  }
}

function wcMetadata() {
  return {
    name: 'xArtists',
    description: 'xArtists — MultiversX RWA & agent packs',
    url: dappOrigin(),
    icons: [`${dappOrigin()}/favicon.ico`],
  }
}

async function readProviderAddress(provider: XcProvider): Promise<string> {
  if (typeof provider.getAddress === 'function') {
    return (await provider.getAddress()).trim()
  }
  if (provider.address) return String(provider.address).trim()
  return ''
}

export async function pingXPortalSession(): Promise<boolean> {
  const now = Date.now()
  if (now - lastPing < 8000 && activeProvider && activeAddress) return true
  lastPing = now
  if (!activeProvider) {
    return ensureXPortalSession()
  }
  try {
    if (typeof activeProvider.ping === 'function') {
      await activeProvider.ping()
    }
    const a = await readProviderAddress(activeProvider)
    if (a && /^erd1[a-z0-9]{58}$/i.test(a)) {
      activeAddress = a
      persistAddr(a)
      return true
    }
  } catch {
    /* fall through restore */
  }
  activeProvider = null
  activeAddress = null
  return ensureXPortalSession()
}

export async function ensureXPortalSession(): Promise<boolean> {
  if (activeProvider && activeAddress) {
    try {
      const a = await readProviderAddress(activeProvider)
      if (a && a.toLowerCase() === activeAddress.toLowerCase()) {
        lastPing = Date.now()
        return true
      }
    } catch {
      /* restore */
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
        wcMetadata(),
      )
      await provider.init()

      let address = ''
      try {
        address = await readProviderAddress(provider)
      } catch {
        address = ''
      }

      if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
        return false
      }

      activeProvider = provider
      activeAddress = address
      persistAddr(address)
      lastPing = Date.now()
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

export function installXPortalVisibilityHooks(): () => void {
  if (typeof window === 'undefined') return () => undefined

  const onVis = () => {
    if (document.visibilityState === 'visible') {
      void pingXPortalSession()
    }
  }
  const onPage = () => {
    void pingXPortalSession()
  }
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('pageshow', onPage)
  window.addEventListener('focus', onPage)

  return () => {
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('pageshow', onPage)
    window.removeEventListener('focus', onPage)
  }
}

/**
 * Full login cycle:
 * 1. init
 * 2. connect → uri + approval
 * 3. login({ approval }) when available
 * 4. getAddress → activate UI
 */
export async function loginWithXPortalMainnet(
  onProgress?: (p: XPortalLoginProgress) => void,
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
  const projectId = sdkDappConfig.walletConnectV2ProjectId
  if (!projectId || projectId.length < 32) {
    return { ok: false, error: 'WalletConnect projectId manquant.' }
  }

  const WalletConnectV2Provider = resolveWalletConnectCtor()
  if (!WalletConnectV2Provider) {
    return { ok: false, error: 'Module WalletConnect indisponible — utilise Web Wallet.' }
  }

  onProgress?.({ phase: 'init', message: 'Initialisation WalletConnect…' })

  const restored = await ensureXPortalSession()
  if (restored && activeAddress) {
    onProgress?.({ phase: 'done', message: activeAddress })
    return { ok: true, address: activeAddress }
  }

  activeProvider = null
  activeAddress = null
  lastWcUri = null

  try {
    const provider = new WalletConnectV2Provider(
      makeCallbacks(),
      MAINNET,
      WALLET_CONNECT_V2_RELAY_URL,
      projectId,
      wcMetadata(),
    )

    await provider.init()
    const { uri, approval } = await provider.connect()

    if (uri) {
      publishWcUri(uri)
      onProgress?.({
        phase: 'uri',
        uri,
        message: isMobileUa()
          ? 'Scanne ou ouvre xPortal (bouton), puis approuve.'
          : 'Scanne le QR avec xPortal.',
      })
    }

    onProgress?.({
      phase: 'waiting',
      uri: uri || undefined,
      message: 'En attente d’approbation xPortal…',
    })

    // Canonical: login({ approval }) when SDK exposes it
    if (typeof provider.login === 'function') {
      await provider.login({ approval })
    } else {
      await approval()
    }

    // Late approval / race: poll address briefly
    let address = ''
    const deadline = Date.now() + 15_000
    while (Date.now() < deadline) {
      try {
        address = await readProviderAddress(provider)
        if (/^erd1[a-z0-9]{58}$/i.test(address)) break
      } catch {
        /* */
      }
      await new Promise(r => setTimeout(r, 400))
    }

    if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
      return {
        ok: false,
        error: 'Adresse xPortal invalide ou session expirée — réessaie le QR.',
      }
    }

    activeProvider = provider
    activeAddress = address
    persistAddr(address)
    lastPing = Date.now()

    onProgress?.({ phase: 'done', message: address })
    return { ok: true, address }
  } catch (e) {
    activeProvider = null
    activeAddress = null
    const msg = e instanceof Error ? e.message : String(e)
    onProgress?.({ phase: 'error', message: msg })
    if (/reject|denied|user rejected/i.test(msg)) {
      return { ok: false, error: 'Connexion refusée dans xPortal.' }
    }
    if (/expir|timeout|cancel/i.test(msg)) {
      return { ok: false, error: 'Session expirée ou annulée — relance la connexion.' }
    }
    return {
      ok: false,
      error: `xPortal: ${msg.slice(0, 120)}. Réessaie ou Web Wallet.`,
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
      core as { TransactionPayload?: { fromString?: (s: string) => unknown } }
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
    /* */
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

export async function signWithXPortalSession(
  plains: PlainTx[],
): Promise<{ ok: true; signed: unknown[] } | { ok: false; error: string }> {
  signingLock += 1
  try {
    const warm = await pingXPortalSession()
    if (!warm || !getXPortalSession()) {
      return {
        ok: false,
        error: 'Session xPortal expirée. Reconnecte (QR) puis réessaie.',
      }
    }

    const session = getXPortalSession()!
    const { provider, address } = session
    const nonce = await fetchAccountNonce(address)
    const signables: unknown[] = []
    for (let i = 0; i < plains.length; i++) {
      signables.push(await toSignableTx(plains[i], address, nonce + i))
    }

    let signed: unknown[]
    if (typeof provider.signTransactions === 'function') {
      signed = await provider.signTransactions(signables)
    } else if (typeof provider.signTransaction === 'function') {
      signed = [await provider.signTransaction(signables[0])]
    } else {
      return { ok: false, error: 'Provider WC sans signature — reconnecte xPortal.' }
    }

    activeProvider = provider
    activeAddress = address
    persistAddr(address)
    return { ok: true, signed }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/session|disconnect|expired|no matching/i.test(msg)) {
      activeProvider = null
      activeAddress = null
    }
    if (/reject|denied|cancel/i.test(msg)) {
      return { ok: false, error: 'Signature refusée dans xPortal.' }
    }
    return { ok: false, error: `Signature xPortal : ${msg.slice(0, 120)}` }
  } finally {
    signingLock = Math.max(0, signingLock - 1)
  }
}

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
