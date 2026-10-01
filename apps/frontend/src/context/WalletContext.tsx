import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setEmpireWallet } from '../store/empireStore'
import { clearXPortalSession, ensureXPortalSession, getXPortalSession } from '../lib/xportalWc'

const STORAGE_KEY = 'xartists_wallet'
/** Protocol LIA wallet — never as connected user */
export const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export interface WalletState {
  connected: boolean
  address: string
  method: 'xportal' | 'defi_wallet' | 'web_wallet' | 'wallet_connect' | 'paste_readonly' | 'pem' | null
  /** WC session verified (xportal only) */
  sessionLive?: boolean
}

interface WalletContextValue extends WalletState {
  connect: (address: string, method: WalletState['method']) => { ok: boolean; error?: string }
  disconnect: () => void
  shortAddress: string
  isLiaAddress: boolean
  canAttemptSign: boolean
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/i.test(addr.trim())
}

function addressFromUrl(): { address: string; method: WalletState['method'] } | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  const candidates = [q.get('address'), q.get('addr'), q.get('loginAddress'), q.get('loginToken')]
  for (const c of candidates) {
    if (c && isValidErd(c)) {
      return { address: c.trim(), method: 'web_wallet' }
    }
  }
  const hash = window.location.hash || ''
  const hq = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  if (hq) {
    const hqParams = new URLSearchParams(hq)
    const a = hqParams.get('address') || hqParams.get('addr')
    if (a && isValidErd(a)) return { address: a.trim(), method: 'web_wallet' }
  }
  const m = hash.match(/erd1[a-z0-9]{58}/i)
  if (m) return { address: m[0], method: 'web_wallet' }
  return null
}

function cleanUrlParams() {
  try {
    const url = new URL(window.location.href)
    ;['address', 'addr', 'loginAddress', 'signature', 'loginToken'].forEach(k =>
      url.searchParams.delete(k),
    )
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  } catch {
    /* ignore */
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* */
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(() => {
    // Never soft-restore xportal as "connected" without live WC — start empty, verify async
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as WalletState
        if (parsed.address?.toLowerCase() === LIA_WALLET.toLowerCase()) {
          clearStorage()
          return { connected: false, address: '', method: null, sessionLive: false }
        }
        // paste / web / defi can restore address; xportal waits for session check
        if (parsed.method === 'xportal') {
          return {
            connected: false,
            address: '',
            method: null,
            sessionLive: false,
          }
        }
        if (parsed.address && parsed.method && parsed.method !== 'pem') {
          return {
            connected: true,
            address: parsed.address,
            method: parsed.method,
            sessionLive: parsed.method !== 'paste_readonly',
          }
        }
      }
    } catch {
      /* ignore */
    }
    return { connected: false, address: '', method: null, sessionLive: false }
  })

  useEffect(() => {
    const fromUrl = addressFromUrl()
    if (!fromUrl) return
    if (fromUrl.address.toLowerCase() === LIA_WALLET.toLowerCase()) return
    setState({
      connected: true,
      address: fromUrl.address,
      method: fromUrl.method,
      sessionLive: true,
    })
    setEmpireWallet({ connected: true, address: fromUrl.address, method: fromUrl.method })
    cleanUrlParams()
  }, [])

  // Boot: try restore xPortal ONLY if WC session still alive
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as WalletState
        if (parsed.method !== 'xportal' || !parsed.address) return
        if (parsed.address.toLowerCase() === LIA_WALLET.toLowerCase()) {
          clearStorage()
          return
        }
        const ok = await ensureXPortalSession()
        if (cancelled) return
        const sess = getXPortalSession()
        if (
          ok &&
          sess &&
          sess.address.toLowerCase() === parsed.address.toLowerCase()
        ) {
          setState({
            connected: true,
            address: sess.address,
            method: 'xportal',
            sessionLive: true,
          })
          setEmpireWallet({ connected: true, address: sess.address, method: 'xportal' })
        } else {
          // Dead session → full disconnect (no fake connected UI)
          clearXPortalSession()
          clearStorage()
          setState({ connected: false, address: '', method: null, sessionLive: false })
          setEmpireWallet({ connected: false, address: null, method: null })
        }
      } catch {
        if (!cancelled) {
          clearXPortalSession()
          clearStorage()
          setState({ connected: false, address: '', method: null, sessionLive: false })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      if (state.connected && state.address && state.method) {
        // Only persist xportal when session is live
        if (state.method === 'xportal' && !state.sessionLive) {
          clearStorage()
          return
        }
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            connected: true,
            address: state.address,
            method: state.method,
          }),
        )
      } else if (!state.connected) {
        clearStorage()
      }
    } catch {
      /* ignore */
    }
  }, [state.connected, state.address, state.method, state.sessionLive])

  const connect = (address: string, method: WalletState['method']) => {
    const addr = address.trim()
    if (!isValidErd(addr)) return { ok: false, error: 'Adresse erd1… invalide' }
    if (addr.toLowerCase() === LIA_WALLET.toLowerCase()) {
      return { ok: false, error: 'Wallet protocole LIA interdit comme wallet utilisateur.' }
    }
    if (method === 'xportal' && !getXPortalSession()) {
      return {
        ok: false,
        error: 'Session xPortal absente — scanne le QR / ouvre l’app puis réessaie.',
      }
    }
    const sessionLive =
      method === 'xportal'
        ? getXPortalSession() != null
        : method !== 'paste_readonly' && method !== null
    setState({ connected: true, address: addr, method, sessionLive })
    setEmpireWallet({ connected: true, address: addr, method })
    return { ok: true }
  }

  const disconnect = () => {
    clearXPortalSession()
    clearStorage()
    setState({ connected: false, address: '', method: null, sessionLive: false })
    setEmpireWallet({ connected: false, address: null, method: null })
  }

  const shortAddress = state.address
    ? `${state.address.slice(0, 8)}…${state.address.slice(-6)}`
    : ''

  const isLiaAddress = state.address.toLowerCase() === LIA_WALLET.toLowerCase()
  const canAttemptSign =
    state.connected &&
    !isLiaAddress &&
    state.method !== 'paste_readonly' &&
    state.method !== null &&
    (state.method !== 'xportal' || state.sessionLive === true)

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        shortAddress,
        isLiaAddress,
        canAttemptSign,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
