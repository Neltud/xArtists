import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const STORAGE_KEY = 'xartists_wallet'

export interface WalletState {
  connected: boolean
  address: string
  method: 'xportal' | 'defi_wallet' | 'pem' | null
}

interface WalletContextValue extends WalletState {
  connect: (address: string, method: WalletState['method']) => void
  disconnect: () => void
  shortAddress: string
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as WalletState
    } catch {
      // ignore
    }
    return { connected: false, address: '', method: null }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  const connect = (address: string, method: WalletState['method']) => {
    setState({ connected: true, address, method })
  }

  const disconnect = () => {
    setState({ connected: false, address: '', method: null })
  }

  const shortAddress = state.address
    ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
    : ''

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, shortAddress }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
