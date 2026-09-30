/**
 * Phase 4 readiness — agents marketplace + treasury splitter gates.
 * Honest: paper mint always; on-chain only with CODEHASH secrets.
 */
import { Link } from 'react-router-dom'
import {
  canBuyAgent,
  canUseTreasury,
  AGENTS_MARKETPLACE_ADDRESS,
  TREASURY_SPLITTER_ADDRESS,
} from '../config/scStatus'
import { formatBps, PACK_SALE_SPLIT } from '../config/revenueSplitter'

export default function Phase4ReadinessBanner() {
  const agentsOk = canBuyAgent()
  const treasuryOk = canUseTreasury()

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
        Phase 4 · Mint packs + revenue
      </p>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span
          className={`rounded-full border px-2 py-0.5 ${
            agentsOk
              ? 'border-emerald-400/40 text-emerald-200 bg-emerald-500/10'
              : 'border-amber-400/30 text-amber-100/90 bg-amber-500/10'
          }`}
        >
          Agents marketplace {agentsOk ? 'LIVE' : 'paper · CODEHASH'}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 ${
            treasuryOk
              ? 'border-emerald-400/40 text-emerald-200 bg-emerald-500/10'
              : 'border-white/15 text-zinc-400'
          }`}
        >
          Treasury splitter {treasuryOk ? 'LIVE' : 'paper ratios'}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Checkout paper → ownership locale + salle. On-chain mint nécessite{' '}
        <code className="text-zinc-400">VITE_AGENTS_CODEHASH_OK=1</code> (secrets Pages only).
        Split type :{' '}
        {PACK_SALE_SPLIT.map(l => `${l.label} ${formatBps(l.bps)}`).join(' · ')}.
      </p>
      <p className="text-[10px] mono text-zinc-600 truncate">
        agents {AGENTS_MARKETPLACE_ADDRESS.slice(0, 18)}… · treasury{' '}
        {TREASURY_SPLITTER_ADDRESS.slice(0, 18)}…
      </p>
      <p className="text-[11px]">
        <Link to="/my-packs" className="text-cyan-400/90 hover:underline">
          My Packs
        </Link>
        {' · '}
        <Link to="/sale" className="text-zinc-400 hover:underline">
          Sale / réserve
        </Link>
        {' · '}
        <Link to="/go-live" className="text-zinc-400 hover:underline">
          Go-live checklist
        </Link>
      </p>
    </div>
  )
}
