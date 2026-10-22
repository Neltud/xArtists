import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Dashboard utilisateur — rewards (points) + packs paper/on-chain.
 * Session xPortal optionnelle.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useDailyPoints } from '../hooks/useDailyPoints'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { loadOwnedPacks } from '../lib/nftPacks'

export default function UserDashboardPanel() {
  const { connected, address } = useWallet()
  const { totalPoints, streak, canClaimToday, claim } = useDailyPoints()
  const [tick, setTick] = useState(0)
  const owned = useMemo(() => loadOwnedPacks(), [tick, connected, address])

  useEffect(() => {
    const onStorage = () => setTick(t => t + 1)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const packRows = AGENT_PACKS.map(p => {
    const has = owned.includes(p.id as PackId)
    return { ...p, has }
  })

  return (
    <div className="card space-y-4 border border-white/10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">{xaRender("Dashboard user")}</p>
          <p className="text-[15px] font-semibold text-white">{xaRender("Rewards · Packs")}</p>
        </div>
        {xaRender(connected && address ? (
          <span className="mono text-[10px] text-emerald-300/90">
            {xaRender(address.slice(0, 6))}…{xaRender(address.slice(-4))}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-600">{xaRender("guest / paper")}</span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-black/30 border border-white/5 py-2">
          <p className="text-lg font-semibold text-white tabular-nums">{xaRender(totalPoints)}</p>
          <p className="text-[10px] text-zinc-500">{xaRender("points")}</p>
        </div>
        <div className="rounded-xl bg-black/30 border border-white/5 py-2">
          <p className="text-lg font-semibold text-white tabular-nums">{xaRender(streak)}</p>
          <p className="text-[10px] text-zinc-500">{xaRender("série (j)")}</p>
        </div>
        <div className="rounded-xl bg-black/30 border border-white/5 py-2">
          <p className="text-lg font-semibold text-white tabular-nums">{xaRender(owned.length)}</p>
          <p className="text-[10px] text-zinc-500">{xaRender("packs")}</p>
        </div>
      </div>

      <button
        type="button"
        disabled={!canClaimToday}
        onClick={() => {
          claim()
          setTick(t => t + 1)
        }}
        className="btn-primary w-full text-[12px] py-2 disabled:opacity-40"
      >
        {xaRender(canClaimToday ? 'Claim +1 pt (série 7j → +3)' : 'Claim déjà fait aujourd’hui')}
      </button>

      <div className="space-y-2">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{xaRender("Vue packs")}</p>
        {xaRender(packRows.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-[13px] text-white">
                {xaRender(p.icon)} {xaRender(p.name)}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {xaRender(p.priceEgld?.list ?? p.priceEur.list)} {xaRender(" EGLD · ")}{xaRender(p.tagline)}
              </p>
            </div>
            <span
              className={`text-[10px] uppercase shrink-0 px-2 py-0.5 rounded-full border ${
                p.has
                  ? 'border-emerald-400/40 text-emerald-300'
                  : 'border-white/10 text-zinc-500'
              }`}
            >
              {xaRender(p.has ? 'owned' : '—')}
            </span>
          </div>
        )))}
      </div>

      <div className="flex flex-wrap gap-3 text-[11px]">
        <Link to="/agents" className="text-cyan-400 hover:underline">
          {xaRender("Acheter pack ")}</Link>
        <Link to="/my-packs" className="text-cyan-400 hover:underline">
          {xaRender("My Packs ")}</Link>
        <Link to="/museum?tab=mine" className="text-cyan-400 hover:underline">
          {xaRender("Musée · mine ")}</Link>
      </div>
    </div>
  )
}
