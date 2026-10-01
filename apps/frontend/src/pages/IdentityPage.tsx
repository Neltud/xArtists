/** Identité — herotag + MX-8004 paper jusqu’au registre public. */
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import useMx8004Registration from '../hooks/useMx8004Registration'
import { requestOpenConnect } from '../lib/walletEvents'

export default function IdentityPage() {
  const { connected, address } = useWallet()
  const mx = useMx8004Registration()

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Identité</p>
        <h1 className="section-title display text-2xl">MX Identity</h1>
        <p className="text-sm text-zinc-400">
          Herotag MultiversX + critères MX-8004. On-chain seulement quand le registre est public.
        </p>
      </header>

      <div className="card space-y-2 text-sm">
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        ) : (
          <>
            <p className="mono text-[12px] text-zinc-300 break-all">{address}</p>
            <a
              className="text-cyan-400 text-[12px] underline"
              href={`https://explorer.multiversx.com/accounts/${address}`}
              target="_blank"
              rel="noreferrer"
            >
              Explorer / herotag →
            </a>
          </>
        )}
      </div>

      <div className="card space-y-2">
        <h2 className="text-sm font-semibold text-white">Critères</h2>
        {!mx.loaded && <p className="text-[12px] text-zinc-500">Chargement…</p>}
        <ul className="space-y-1.5 text-[13px]">
          {mx.criteria.map(c => (
            <li key={c.id} className="flex justify-between gap-2">
              <span className="text-zinc-400">{c.label}</span>
              <span className={c.ok ? 'text-emerald-300' : 'text-zinc-500'}>{c.ok ? 'OK' : 'paper'}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-zinc-500">Pas d’inscription on-chain tant que le registry n’est pas public.</p>
      </div>

      <Link to="/wallet" className="btn-secondary text-sm inline-block">
        Wallet
      </Link>
    </div>
  )
}
