import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const STORAGE_KEY = 'xartists_wallet'
/** Protocol LIA wallet — never as connected user */
export const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export interface WalletState {
  connected: boolean
  address: string
  /** paste_readonly never signs TX */
  method: 'xportal' | 'defi_wallet' | 'web_wallet' | 'wallet_connect' | 'paste_readonly' | 'pem' | null
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

/** Web-wallet / WC redirect: query before hash, or address in hash */
function addressFromUrl(): { address: string; method: WalletState['method'] } | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  const candidates = [
    q.get('address'),
    q.get('addr'),
    q.get('loginAddress'),
    q.get('loginToken'),
  ]
  for (const c of candidates) {
    if (c && isValidErd(c)) {
      return { address: c.trim(), method: 'web_wallet' }
    }
  }
  // HashRouter: sometimes ?address= lands as #/?address=
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
      url.searchParams.delete(k)
    )
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  } catch {
    /* ignore */
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as WalletState
        if (parsed.address?.toLowerCase() === LIA_WALLET.toLowerCase()) {
          return { connected: false, address: '', method: null }
        }
        return parsed
      }
    } catch {
      /* ignore */
    }
    return { connected: false, address: '', method: null }
  })

  useEffect(() => {
    const fromUrl = addressFromUrl()
    if (!fromUrl) return
    if (fromUrl.address.toLowerCase() === LIA_WALLET.toLowerCase()) return
    setState({ connected: true, address: fromUrl.address, method: fromUrl.method })
    cleanUrlParams()
  }, [])

  useEffect(() => {
    try {
      if (state.connected && state.address) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      /* ignore */
    }
  }, [state])

  const connect = (address: string, method: WalletState['method']) => {
    const addr = address.trim()
    if (!isValidErd(addr)) return { ok: false, error: 'Adresse erd1… invalide' }
    if (addr.toLowerCase() === LIA_WALLET.toLowerCase()) {
      return { ok: false, error: 'Wallet protocole LIA interdit comme wallet utilisateur.' }
    }
    setState({ connected: true, address: addr, method })
    return { ok: true }
  }

  const disconnect = () => {
    setState({ connected: false, address: '', method: null })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  const shortAddress = state.address
    ? `${state.address.slice(0, 8)}…${state.address.slice(-6)}`
    : ''

  const isLiaAddress = state.address.toLowerCase() === LIA_WALLET.toLowerCase()
  const canAttemptSign =
    state.connected &&
    !isLiaAddress &&
    state.method !== 'paste_readonly' &&
    state.method !== null

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
