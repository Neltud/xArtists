import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const STORAGE_KEY = 'xartists_wallet'
/** Protocol LIA wallet — must never be used as "connected user" via mock */
export const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export interface WalletState {
  connected: boolean
  address: string
  /** paste_readonly = manual erd1 — never signs TX */
  method: 'xportal' | 'defi_wallet' | 'web_wallet' | 'paste_readonly' | 'pem' | null
}

interface WalletContextValue extends WalletState {
  connect: (address: string, method: WalletState['method']) => { ok: boolean; error?: string }
  disconnect: () => void
  shortAddress: string
  isLiaAddress: boolean
  /** True only for non-paste sessions (still need __xartistsSendTx for real sign) */
  canAttemptSign: boolean
}

const WalletContext = createContext<WalletContextValue | null>(null)

function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/i.test(addr.trim())
}

/** Parse MultiversX web-wallet / hook callback query */
function addressFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  const candidates = [q.get('address'), q.get('addr'), q.get('loginAddress')]
  for (const c of candidates) {
    if (c && isValidErd(c)) return c.trim()
  }
  const hash = window.location.hash || ''
  const m = hash.match(/erd1[a-z0-9]{58}/i)
  return m ? m[0] : null
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
        // migrate legacy: web_wallet without real login → treat as paste if no session flag
        return parsed
      }
    } catch {
      // ignore
    }
    return { connected: false, address: '', method: null }
  })

  useEffect(() => {
    const fromUrl = addressFromUrl()
    if (!fromUrl) return
    if (fromUrl.toLowerCase() === LIA_WALLET.toLowerCase()) return
    // Real web-wallet redirect callback
    setState({ connected: true, address: fromUrl, method: 'web_wallet' })
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('address')
      url.searchParams.delete('addr')
      url.searchParams.delete('loginAddress')
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  const connect = (address: string, method: WalletState['method']) => {
    const a = address.trim()
    if (!isValidErd(a)) {
      return { ok: false, error: 'Invalid MultiversX address' }
    }
    if (a.toLowerCase() === LIA_WALLET.toLowerCase()) {
      return {
        ok: false,
        error:
          'LIA protocol wallet cannot be used as user connection. Use your own xPortal / DeFi / Web wallet.',
      }
    }
    setState({ connected: true, address: a, method })
    return { ok: true }
  }

  const disconnect = () => {
    setState({ connected: false, address: '', method: null })
  }

  const shortAddress = state.address
    ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
    : ''

  const isLiaAddress = state.address.toLowerCase() === LIA_WALLET.toLowerCase()
  const canAttemptSign =
    state.connected &&
    !!state.method &&
    state.method !== 'paste_readonly' &&
    state.method !== 'pem'

  return (
    <WalletContext.Provider
      value={{ ...state, connect, disconnect, shortAddress, isLiaAddress, canAttemptSign }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
