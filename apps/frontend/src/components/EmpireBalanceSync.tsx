/**
 * Vertical slice — Couche Perception.
 * Sync connected user EGLD + TRO balances into empireStore (single source for 3D / UI).
 * No PEM. Read-only MultiversX API.
 */
import { useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { setEmpireWallet, setEmpirePulse } from '../store/empireStore'
import { TRO_TOKEN_ID } from '../config/scStatus'

export default function EmpireBalanceSync() {
  const { connected, address, method } = useWallet()
  const account = useUserAccount(connected ? address : null)

  useEffect(() => {
    setEmpireWallet({
      connected,
      address: connected ? address : null,
      method: method ?? null,
    })
  }, [connected, address, method])

  useEffect(() => {
    if (!connected || !address) {
      setEmpireWallet({ egldBalance: null, troBalance: null })
      return
    }
    const tro = account.tokens.find(
      t => t.identifier === TRO_TOKEN_ID || t.ticker === 'TRO',
    )
    setEmpireWallet({
      egldBalance: Number.isFinite(account.balanceEgld)
        ? String(account.balanceEgld)
        : account.balanceAtomic,
      troBalance: tro != null ? String(tro.balance) : '0',
    })
    if (account.refreshedAt) {
      setEmpirePulse({ apiOk: !account.error, lastPingAt: account.refreshedAt })
    }
  }, [
    connected,
    address,
    account.balanceEgld,
    account.balanceAtomic,
    account.tokens,
    account.refreshedAt,
    account.error,
  ])

  return null
}
