import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { loadOwnedPacks } from '../lib/nftPacks'

/** Liste packs NFT « owned » (localStorage paper jusqu’au mint SC). */
export default function MyNftPacksStrip() {
  const [owned, setOwned] = useState<PackId[]>([])

  useEffect(() => {
    setOwned(loadOwnedPacks())
    const id = window.setInterval(() => setOwned(loadOwnedPacks()), 3000)
    return () => clearInterval(id)
  }, [])

  if (owned.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-500">
        Aucun pack NFT en session locale.{' '}
        <Link to="/agents" className="text-violet-300 underline">
          Voir les séries
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-violet-300/80 mb-2">Tes packs NFT</p>
      <ul className="flex flex-wrap gap-2">
        {owned.map(id => {
          const p = AGENT_PACKS.find(x => x.id === id)
          return (
            <li
              key={id}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            >
              {p?.icon} {p?.name || id}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
