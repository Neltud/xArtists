/** Wallet — session, soldes, MoonPay on-ramp, raccourcis. */
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { clearXPortalSession } from '../lib/xportalWc'
import { useToast } from '../components/ui/Toast'
import MoonPayBuyButton from '../components/MoonPayBuyButton'

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return n.toFixed(2)
  if (n >= 1) return n.toFixed(4)
  return n.toPrecision(3)
}

export default function WalletPage() {
  const { connected, address, method, sessionLive, canAttemptSign, disconnect } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const { push } = useToast()
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    if (params.get('moonpay') === 'done') {
      push('Retour MoonPay — vérifie ton solde EGLD (quelques minutes).', 'ok')
      const n = new URLSearchParams(params)
      n.delete('moonpay')
      setParams(n, { replace: true })
    }
  }, [params, setParams, push])

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Portefeuille</p>
        <h1 className="section-title display text-2xl">Wallet</h1>
        <p className="text-sm text-zinc-400">Session MultiversX · recharge EGLD · signatures xPortal.</p>
      </header>

      {!connected ? (
        <div className="card space-y-3">
          <p className="text-sm text-zinc-400">Aucune session active.</p>
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter xPortal
          </button>
          <div className="pt-2 border-t border-white/5">
            <p className="text-[12px] text-zinc-500 mb-2">Pas encore d’EGLD ?</p>
            <MoonPayBuyButton amountEur={50} />
          </div>
        </div>
      ) : (
        <>
          <div className="card space-y-2 text-sm">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Session</p>
            <p className="mono text-[12px] text-emerald-200/90 break-all">{address}</p>
            <p className="text-[12px] text-zinc-500">
              {method === 'xportal'
                ? sessionLive
                  ? 'xPortal · prêt à signer'
                  : 'xPortal · reconnecte si signature refuse'
                : method === 'paste_readonly'
                  ? 'Lecture seule — pas de signature'
                  : method || 'wallet'}
            </p>
            {!canAttemptSign && (
              <p className="text-[12px] text-amber-200/90">Reconnecte xPortal pour signer les TX.</p>
            )}
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                clearXPortalSession()
                disconnect()
                push('Déconnecté', 'info')
              }}
            >
              Disconnect
            </button>
          </div>

          <div className="card space-y-3 text-sm">
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500">EGLD</span>
              <strong className="text-white tabular-nums text-lg">
                {account.loading ? '…' : fmt(account.balanceEgld)}
              </strong>
            </div>
            <p className="text-zinc-500 text-[12px]">
              Tokens {account.tokens?.length ?? 0} · NFT {account.nfts?.length ?? 0}
            </p>
            <MoonPayBuyButton amountEur={30} label="Recharger EGLD · MoonPay" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/marketplace" className="btn-primary text-sm">
                Marketplace
              </Link>
              <Link to="/staking" className="btn-secondary text-sm">
                Staking
              </Link>
              <Link to="/slot" className="btn-secondary text-sm">
                Slot
              </Link>
              <Link to="/portfolio" className="btn-secondary text-sm">
                Portfolio
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
