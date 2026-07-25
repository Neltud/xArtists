import { useState, useEffect } from 'react'
import { useWeb3 } from './useWeb3'

const MVX_API = 'https://api.multiversx.com'

interface PortfolioData {
  egldBalance: string
  tokens: Array<{ identifier: string; balance: string; price?: number }>
  nfts: Array<{ identifier: string; name?: string }>
  totalValue: number
  loading: boolean
  error: string | null
}

export const usePortfolioData = () => {
  const { address, isLoggedIn } = useWeb3()
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    egldBalance: '0',
    tokens: [],
    nfts: [],
    totalValue: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!isLoggedIn || !address) {
      setPortfolio(prev => ({ ...prev, loading: false, error: 'Wallet non connecté' }))
      return
    }

    const fetchPortfolio = async () => {
      try {
        const [accountRes, tokensRes] = await Promise.allSettled([
          fetch(`${MVX_API}/accounts/${address}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
          fetch(`${MVX_API}/accounts/${address}/tokens?size=20`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
        ])
        const account = accountRes.status === 'fulfilled' ? accountRes.value : null
        const tokens = tokensRes.status === 'fulfilled' && Array.isArray(tokensRes.value) ? tokensRes.value : []
        const egldBalance = account?.balance ? (parseFloat(account.balance) / 1e18).toFixed(6) : '0'
        const egldPrice = account?.egldPrice ?? 0
        const totalValue = parseFloat(egldBalance) * egldPrice
        setPortfolio({ egldBalance, tokens, nfts: [], totalValue, loading: false, error: null })
      } catch {
        setPortfolio(prev => ({ ...prev, loading: false, error: 'Erreur de chargement du portfolio' }))
      }
    }

    fetchPortfolio()
    const interval = setInterval(fetchPortfolio, 60_000)
    return () => clearInterval(interval)
  }, [isLoggedIn, address])

  return portfolio
}
