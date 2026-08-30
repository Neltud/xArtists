/**
 * Asset hub data — MultiversX account tokens + NFTs for connected wallet.
 * No mock success; empty when disconnected.
 */
import { useMemo } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount, type UserNft, type UserToken } from './useUserAccount'

export type AssetsSnapshot = {
  connected: boolean
  address: string | null
  loading: boolean
  error: string | null
  tokens: UserToken[]
  nfts: UserNft[]
  egld: number
  refresh: () => void
}

export function useAssets(): AssetsSnapshot {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)

  return useMemo(
    () => ({
      connected: !!connected && !!address,
      address: address || null,
      loading: account.loading,
      error: account.error,
      tokens: account.tokens || [],
      nfts: account.nfts || [],
      egld: account.balanceEgld || 0,
      refresh: account.refresh,
    }),
    [
      connected,
      address,
      account.loading,
      account.error,
      account.tokens,
      account.nfts,
      account.balanceEgld,
      account.refresh,
    ]
  )
}
