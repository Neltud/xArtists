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

      <header>
        <h1 className="text-3xl font-black">Wallet</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Ton compte MultiversX · pas le wallet LIA protocole
        </p>
      </header>

      <WalletConnectPanel />

      {connected && (
        <div className="card space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Compte</p>
          <p className="font-mono text-xs break-all text-zinc-300">{address}</p>
          <p className="text-sm">
            EGLD ≈{' '}
            <span className="font-mono text-white">
              {account.loading ? '…' : account.balanceEgld.toFixed(4)}
            </span>
          </p>
          {account.error && <p className="text-xs text-amber-400">{account.error}</p>}
          <p className="text-[11px] text-zinc-500">
            Session {method} · {shortAddress}
            {!canAttemptSign && ' · mode lecture seule'}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link to="/tip" className="btn-primary py-1.5 px-3">
              Tip
            </Link>
            <Link to="/agents" className="btn-secondary py-1.5 px-3">
              Packs
            </Link>
            <a
              href={`https://explorer.multiversx.com/accounts/${address}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary py-1.5 px-3"
            >
              Explorer
            </a>
          </div>
        </div>
      )}

      {!connected && (
        <button type="button" className="text-xs text-cyan-400 underline" onClick={requestOpenConnect}>
          Ouvrir aussi le modal header
        </button>
      )}

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Après Web Wallet, retour sur neltud.github.io avec adresse en query — session stockée.
        Signature TX selon provider (web / extension).
      </p>
    </div>
  )
}
