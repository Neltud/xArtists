import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setEmpireWallet } from '../store/empireStore'
import {
  clearXPortalSession,
  ensureXPortalSession,
  getXPortalSession,
  installXPortalVisibilityHooks,
  pingXPortalSession,
} from '../lib/xportalWc'

const STORAGE_KEY = 'xartists_wallet'
export const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export interface WalletState {
  connected: boolean
  address: string
  method: 'xportal' | 'defi_wallet' | 'web_wallet' | 'wallet_connect' | 'paste_readonly' | 'pem' | null
  sessionLive?: boolean
}

interface WalletContextValue extends WalletState {
  connect: (address: string, method: WalletState['method']) => { ok: boolean; error?: string }
  disconnect: () => void
  shortAddress: string
  isLiaAddress: boolean
  canAttemptSign: boolean
  /** Force WC restore (après retour xPortal) */
  refreshSession: () => Promise<boolean>
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
    /* */
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as WalletState
        if (parsed.address?.toLowerCase() === LIA_WALLET.toLowerCase()) {
          clearStorage()
          return { connected: false, address: '', method: null, sessionLive: false }
        }
        // Never show xportal as connected until WC verify
        if (parsed.method === 'xportal') {
          return { connected: false, address: '', method: null, sessionLive: false }
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
      /* */
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

  const applyLiveSession = (address: string) => {
    setState({
      connected: true,
      address,
      method: 'xportal',
      sessionLive: true,
    })
    setEmpireWallet({ connected: true, address, method: 'xportal' })
  }

  const clearAll = () => {
    clearXPortalSession()
    clearStorage()
    setState({ connected: false, address: '', method: null, sessionLive: false })
    setEmpireWallet({ connected: false, address: null, method: null })
  }

  // Boot restore xPortal
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? (JSON.parse(raw) as WalletState) : null
        const ok = await ensureXPortalSession()
        if (cancelled) return
        const sess = getXPortalSession()
        if (ok && sess) {
          if (
            parsed?.method === 'xportal' &&
            parsed.address &&
            parsed.address.toLowerCase() !== sess.address.toLowerCase()
          ) {
            // pairing for different account — use live session address
          }
          applyLiveSession(sess.address)
          return
        }
        if (parsed?.method === 'xportal') {
          clearAll()
        }
      } catch {
        if (!cancelled) clearAll()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Visibility / focus — restore after xPortal app switch
  useEffect(() => {
    const unsub = installXPortalVisibilityHooks()
    const onLogout = () => {
      // Soft: mark not live, keep UI until user reconnects
      setState(s =>
        s.method === 'xportal' ? { ...s, sessionLive: false, connected: false, address: '' } : s,
      )
      clearStorage()
      setEmpireWallet({ connected: false, address: null, method: null })
    }
    window.addEventListener('xartists-wc-logout', onLogout)
    return () => {
      unsub()
      window.removeEventListener('xartists-wc-logout', onLogout)
    }
  }, [])

  useEffect(() => {
    try {
      if (state.connected && state.address && state.method) {
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
      /* */
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
    clearAll()
  }

  const refreshSession = async () => {
    const ok = await pingXPortalSession()
    const sess = getXPortalSession()
    if (ok && sess) {
      applyLiveSession(sess.address)
      return true
    }
    if (state.method === 'xportal') {
      setState(s => ({ ...s, sessionLive: false }))
    }
    return false
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
        refreshSession,
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
