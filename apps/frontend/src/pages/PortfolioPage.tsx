import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
        <p className="section-label">{xaRender("Actifs")}</p>
        <h1 className="section-title display text-2xl">{xaRender("Portfolio")}</h1>
      </header>

      {xaRender(!connected ? (
        <div className="card text-sm text-zinc-500">{xaRender("Connecte un wallet pour voir tes soldes et NFT.")}</div>
      ) : (
        <>
          <div className="card space-y-2 text-sm">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{xaRender("Compte")}</p>
            <p className="mono text-[12px] text-zinc-300 truncate">{xaRender(address)}</p>
            {xaRender(method === 'paste_readonly' && (
              <p className="text-[11px] text-amber-200/90">{xaRender("Lecture seule — pas de signature.")}</p>
            ))}
            {xaRender(method === 'xportal' && !account.loading && (
              <p className="text-[11px] text-zinc-500">{xaRender("xPortal · reconnecte si une signature échoue")}</p>
            ))}
            <p className="text-zinc-300">
              {xaRender("EGLD")}{xaRender(' ')}
              <strong className="text-white tabular-nums">
                {xaRender(account.loading ? '…' : fmtBal(account.balanceEgld ?? 0, 4))}
              </strong>
            </p>
          </div>

          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">{xaRender("Tokens (")}{xaRender(tokens.length)})</h2>
            {xaRender(account.loading && <p className="text-[12px] text-zinc-500">{xaRender("Chargement…")}</p>)}
            {xaRender(!account.loading && tokens.length === 0 && (
              <p className="text-[13px] text-zinc-500">{xaRender("Aucun token ESDT.")}</p>
            ))}
            <ul className="space-y-1.5">
              {xaRender(tokens.slice(0, 20).map(t => (
                <li
                  key={t.identifier}
                  className="flex justify-between gap-2 text-[13px] border-b border-white/[0.04] py-1.5"
                >
                  <span className="text-zinc-300 truncate">{xaRender(t.ticker || t.identifier)}</span>
                  <span className="tabular-nums text-white shrink-0">{xaRender(fmtBal(t.balance, 4))}</span>
                </li>
              )))}
            </ul>
          </div>

          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">{xaRender("NFT (")}{xaRender(nfts.length)})</h2>
            <p className="text-[12px] text-zinc-500">{xaRender("Les packs IA ouvrent une salle dédiée.")}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {xaRender(nfts.slice(0, nftVisible).map(n => {
                const media0 = n.media?.[0] as { thumbnailUrl?: string; url?: string } | undefined
                const thumb = n.url || media0?.thumbnailUrl || media0?.url || undefined
                return (
                  <div
                    key={n.identifier}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-1.5"
                  >
                    {xaRender(thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-lg bg-zinc-900"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-zinc-900" />
                    ))}
                    <p className="text-[10px] text-zinc-400 truncate mt-1">{xaRender(n.name || n.identifier)}</p>
                  </div>
                )
              }))}
            </div>
            {xaRender(nftVisible < nfts.length && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setNftVisible(v => v + NFT_PAGE)}
              >
                {xaRender("Voir plus ")}</button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/marketplace" className="btn-primary text-sm">
              {xaRender("Marketplace ")}</Link>
            <Link to="/museum" className="btn-secondary text-sm">
              {xaRender("Musée ")}</Link>
            <Link to="/my-packs" className="btn-secondary text-sm">
              {xaRender("My Packs ")}</Link>
          </div>
        </>
      ))}
    </div>
  )
}
