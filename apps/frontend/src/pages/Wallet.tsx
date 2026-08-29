/**
 * Wallet utilisateur — connect live + soldes lecture API.
 */
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import WalletConnectPanel from '../components/WalletConnectPanel'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'

export default function Wallet() {
  const { connected, address, shortAddress, method, canAttemptSign } = useWallet()
  const account = useUserAccount(connected ? address : null)

  return (
    <div className="animate-fade-in space-y-6 pb-10 max-w-xl">
      <PageGuide page="wallet" />

      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/80 font-semibold">
          Compte
        </p>
        <h1 className="display text-3xl sm:text-4xl">Wallet</h1>
        <p className="muted">Ton compte MultiversX · jamais le wallet protocole LIA</p>
      </header>

      {!connected ? (
        <div className="card space-y-4">
          <p className="text-sm text-zinc-400">
            Connecte Web Wallet, xPortal ou extension pour voir les soldes et signer.
          </p>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => requestOpenConnect()}>
            Connecter
          </button>
          <WalletConnectPanel />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mono text-sm text-white">{shortAddress}</span>
              <span
                className={
                  method === 'paste_readonly' ? 'badge-orange' : 'badge-green'
                }
              >
                {method === 'paste_readonly' ? 'lecture seule' : method || 'connecté'}
              </span>
            </div>
            <p className="mono text-[10px] text-zinc-600 break-all">{address}</p>
            {canAttemptSign === false && (
              <p className="text-xs text-amber-400/90">
                Mode lecture seule — reconnecte via Web Wallet pour signer.
              </p>
            )}
          </div>

          <div className="card">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Solde EGLD</p>
            {account.loading ? (
              <p className="text-zinc-500 text-sm">Chargement…</p>
            ) : account.error ? (
              <p className="text-rose-400 text-sm">{account.error}</p>
            ) : (
              <p className="display text-2xl text-white">
                {account.egldHuman ?? '—'}
                <span className="text-sm font-normal text-zinc-500 ml-2">EGLD</span>
              </p>
            )}
          </div>

          <WalletConnectPanel />

          <div className="flex flex-wrap gap-2">
            <Link to="/marketplace" className="btn-secondary text-xs">
              Marketplace
            </Link>
            <Link to="/agents" className="btn-secondary text-xs">
              Packs
            </Link>
            <Link to="/tip" className="btn-secondary text-xs">
              Tip
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
