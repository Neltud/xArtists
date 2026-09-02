/**
 * Packs NFT détenus — source principale = on-chain (NFTs user).
 * localStorage = session paper uniquement (mint SC pending).
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import {
  loadOwnedPacks,
  matchOnChainPacks,
  ownedPackIdsFromChain,
  agentPackCollectionIds,
} from '../lib/nftPacks'
import { LINKS } from '../config/links'

export default function MyNftPacksStrip() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)

  const chainHits = useMemo(() => matchOnChainPacks(account.nfts), [account.nfts])
  const chainIds = useMemo(() => ownedPackIdsFromChain(chainHits), [chainHits])
  const sessionIds = useMemo(() => loadOwnedPacks(), [account.refreshedAt, connected])

  const configuredCols = agentPackCollectionIds()

  if (!connected) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-500">
        Connecte ton wallet pour lire les packs NFT on-chain.{' '}
        <Link to="/agents" className="text-violet-300 underline">
          Voir les séries
        </Link>
      </div>
    )
  }

  if (account.loading && chainHits.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-500">
        Lecture packs on-chain…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-[10px] uppercase tracking-wider text-violet-300/80">
            My Packs · on-chain
          </p>
          <span className="text-[10px] text-zinc-500 mono">{chainHits.length} NFT</span>
        </div>

        {chainHits.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Aucun pack Pulse / Yield / Sentinel détecté sur cette adresse.
            {configuredCols.length === 0 && (
              <span className="block text-[11px] text-zinc-600 mt-1">
                Collection mint SC encore pending (ticker XAPACK). Dès le codeHash live, le filtre
                collection s’applique via VITE_AGENT_PACK_COLLECTIONS.
              </span>
            )}
          </p>
        ) : (
          <ul className="space-y-2">
            {chainHits.map(h => {
              const p = AGENT_PACKS.find(x => x.id === h.packId)
              const href =
                typeof LINKS?.explorerNft === 'function'
                  ? LINKS.explorerNft(h.identifier)
                  : `https://explorer.multiversx.com/nfts/${h.identifier}`
              return (
                <li
                  key={h.identifier}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                >
                  <span className="text-lg">{p?.icon || '🎟️'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">
                      {p?.name || h.packId} · {h.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 mono truncate">
                      {h.collection || h.identifier}
                    </p>
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-cyan-400/90 shrink-0"
                  >
                    Explorer ↗
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        {chainIds.length > 0 && (
          <p className="text-[10px] text-zinc-600 mt-2">
            Séries : {chainIds.map(id => id).join(' · ')}
          </p>
        )}
      </div>

      {sessionIds.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-300/80 mb-2">
            Session paper (localStorage)
          </p>
          <ul className="flex flex-wrap gap-2">
            {sessionIds.map((id: PackId) => {
              const p = AGENT_PACKS.find(x => x.id === id)
              return (
                <li
                  key={id}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-zinc-300"
                >
                  {p?.icon} {p?.name || id}
                </li>
              )
            })}
          </ul>
          <p className="text-[10px] text-zinc-600 mt-2">
            Indice local jusqu’au mint SC — pas une preuve on-chain.
          </p>
        </div>
      )}

      <p className="text-[11px] text-zinc-600">
        <Link to="/my-packs" className="text-violet-300 underline">
          My Packs
        </Link>
        {' · '}
        <Link to="/agents" className="text-violet-300 underline">
          Catalog
        </Link>
      </p>
    </div>
  )
}
