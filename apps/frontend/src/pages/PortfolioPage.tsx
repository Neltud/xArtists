/**
 * Portfolio — tokens + NFT (chargement progressif, pas de dump technique).
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'

const NFT_PAGE = 12

function fmtBal(balance: number, decimals = 4): string {
  if (!Number.isFinite(balance)) return '—'
  if (balance >= 1000) return balance.toFixed(2)
  if (balance >= 1) return balance.toFixed(decimals)
  return balance.toPrecision(3)
}

export default function PortfolioPage() {
  const { connected, address, method } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = useMemo(() => (account.nfts || []).filter(n => n?.identifier), [account.nfts])
  const tokens = useMemo(() => (account.tokens || []).filter(t => t?.identifier), [account.tokens])
  const [nftVisible, setNftVisible] = useState(NFT_PAGE)

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Actifs</p>
        <h1 className="section-title display text-2xl">Portfolio</h1>
      </header>

      {!connected ? (
        <div className="card text-sm text-zinc-500">Connecte un wallet pour voir tes soldes et NFT.</div>
      ) : (
        <>
          <div className="card space-y-2 text-sm">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Compte</p>
            <p className="mono text-[12px] text-zinc-300 truncate">{address}</p>
            {method === 'paste_readonly' && (
              <p className="text-[11px] text-amber-200/90">Lecture seule — pas de signature.</p>
            )}
            {method === 'xportal' && (
              <p className="text-[11px] text-zinc-500">xPortal · reconnecte si une TX échoue</p>
            )}
            <p className="text-zinc-300">
              EGLD{' '}
              <strong className="text-white tabular-nums">
                {account.loading ? '…' : fmtBal(account.egld ?? 0, 4)}
              </strong>
            </p>
          </div>

          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">Tokens ({tokens.length})</h2>
            {account.loading && <p className="text-[12px] text-zinc-500">Chargement…</p>}
            {!account.loading && tokens.length === 0 && (
              <p className="text-[13px] text-zinc-500">Aucun token ESDT.</p>
            )}
            <ul className="space-y-1.5">
              {tokens.slice(0, 20).map(t => (
                <li
                  key={t.identifier}
                  className="flex justify-between gap-2 text-[13px] border-b border-white/[0.04] py-1.5"
                >
                  <span className="text-zinc-300 truncate">{t.ticker || t.identifier}</span>
                  <span className="tabular-nums text-white shrink-0">
                    {fmtBal(t.balance, 4)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">NFT ({nfts.length})</h2>
            <p className="text-[12px] text-zinc-500">
              Les packs IA ouvrent une salle dédiée.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {nfts.slice(0, nftVisible).map(n => {
                const thumb =
                  n.url ||
                  n.media?.[0]?.thumbnailUrl ||
                  n.media?.[0]?.url ||
                  undefined
                return (
                  <div
                    key={n.identifier}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-1.5"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-lg bg-zinc-900"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-zinc-900" />
                    )}
                    <p className="text-[10px] text-zinc-400 truncate mt-1">{n.name || n.identifier}</p>
                  </div>
                )
              })}
            </div>
            {nftVisible < nfts.length && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setNftVisible(v => v + NFT_PAGE)}
              >
                Voir plus
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/marketplace" className="btn-primary text-sm">
              Marketplace
            </Link>
            <Link to="/museum" className="btn-secondary text-sm">
              Musée
            </Link>
            <Link to="/my-packs" className="btn-secondary text-sm">
              My Packs
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
