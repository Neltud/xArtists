import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setEmpireWallet } from '../store/empireStore'
import {readonlyWalletObservation,restoreWalletObservation,walletSignEligibility} from '../lib/walletObservation.mjs'
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
      return { address: c.trim(), method: 'paste_readonly' }
    }
  }
  const hash = window.location.hash || ''
  const hq = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  if (hq) {
    const hqParams = new URLSearchParams(hq)
    const a = hqParams.get('address') || hqParams.get('addr')
    if (a && isValidErd(a)) return { address: a.trim(), method: 'paste_readonly' }
  }
  const m = hash.match(/erd1[a-z0-9]{58}/i)
  if (m) return { address: m[0], method: 'paste_readonly' }
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
      // localStorage is controlled by the browser user, not the signer.
      // Restore visible holdings in read-only mode, never a signing session.
      const observed = restoreWalletObservation(raw, LIA_WALLET)
      if (observed) return observed
      if (raw) clearStorage()
    } catch {
      /* blocked storage: anonymous by default */
    }
    return { connected: false, address: '', method: null, sessionLive: false }
  })

  useEffect(() => {
    const fromUrl = addressFromUrl()
    if (!fromUrl) return
    // An URL callback address is an unauthenticated public hint. A signed
    // native-auth / live provider handshake is required for signing.
    const observed = readonlyWalletObservation(fromUrl.address, LIA_WALLET)
    cleanUrlParams()
    if (!observed) return
    setState(observed)
    setEmpireWallet({ connected: true, address: observed.address, method: 'paste_readonly' })
  }, [])

  const applyLiveSession = (address: string) => {
    // Restoring a WalletConnect session must not bypass the explicit LIA-ops
    // wallet ban enforced for manual/user Connect. Ops keys stay outside dApp.
    if (!isValidErd(address) || address.toLowerCase() === LIA_WALLET.toLowerCase()) {
      clearXPortalSession()
      clearStorage()
      setState({ connected: false, address: '', method: null, sessionLive: false })
      setEmpireWallet({ connected: false, address: null, method: null })
      return
    }
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
    const pairing = method === 'xportal' ? getXPortalSession() : null
    if (method === 'xportal' &&
        (!pairing || pairing.address.toLowerCase() !== addr.toLowerCase())) {
      return {
        ok: false,
        error: 'Session xPortal absente ou adresse différente — reconnecte le wallet.',
      }
    }
    // Unauthenticated direct Web Wallet callbacks, pasted addresses, PEM and
    // legacy wallet_connect calls remain read-only until independently proven.
    const safeMethod:WalletState['method'] =
      method === 'xportal' || method === 'defi_wallet' ? method : 'paste_readonly'
    const sessionLive = safeMethod === 'xportal' || safeMethod === 'defi_wallet'
    setState({ connected: true, address: addr, method: safeMethod, sessionLive })
    setEmpireWallet({ connected: true, address: addr, method: safeMethod })
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
  const canAttemptSign = !isLiaAddress && walletSignEligibility({
    connected:state.connected,address:state.address,method:state.method,
    sessionLive:state.sessionLive,
    pairedAddress:state.method==='xportal' ? getXPortalSession()?.address : null,
  })

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
      {xaRender(children)}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
