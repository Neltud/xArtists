/** Wallet — session, soldes, raccourcis cœur. */
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { clearXPortalSession } from '../lib/xportalWc'
import { useToast } from '../components/ui/Toast'

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

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Portefeuille</p>
        <h1 className="section-title display text-2xl">Wallet</h1>
        <p className="text-sm text-zinc-400">Session MultiversX · signature xPortal pour les TX.</p>
      </header>

      {!connected ? (
        <div className="card space-y-3">
          <p className="text-sm text-zinc-400">Aucune session active.</p>
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter xPortal
          </button>
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
