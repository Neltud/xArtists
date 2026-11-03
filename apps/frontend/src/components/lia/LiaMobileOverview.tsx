import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS } from '../../config/agentPacks'
import { LIA_BADGE, LIA_LIVE_TRADING } from '../../config/liaConfig'
import { fetchLiaHubStatus, type LiaHubStatus } from '../../lia/hubStatus'
import { fetchLiaStatus, type LiaStatusV1 } from '../../lia/liaStatus'

/** Public, touch-first overview: no WebGL, wallet, signature or transaction calls. */
export default function LiaMobileOverview() {
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [status, setStatus] = useState<LiaStatusV1 | null>(null)
  const [syncedAt, setSyncedAt] = useState<number | null>(null)
  const [pending, setPending] = useState(true)

  const refresh = useCallback(async () => {
    setPending(true)
    try {
      // Both endpoints publish snapshots; polling never implies a streaming feed.
      const [hubData, statusData] = await Promise.all([fetchLiaHubStatus(), fetchLiaStatus()])
      setHub(hubData)
      setStatus(statusData)
      setSyncedAt(Date.now())
    } catch {
      setHub(null)
      setStatus(null)
      setSyncedAt(Date.now())
    } finally {
      setPending(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const statusTime = status?.ts ? Date.parse(status.ts) : NaN
  const hubTime = hub?.ts ? Date.parse(hub.ts) : NaN
  const timestamp = Number.isFinite(statusTime) ? statusTime : null
  const hubTimestamp = Number.isFinite(hubTime) ? hubTime : null
  const ageMinutes = timestamp === null ? null : Math.floor(Math.max(0, Date.now() - timestamp) / 60_000)
  const fresh = ageMinutes !== null && ageMinutes < 15
  const hubAgeMinutes = hubTimestamp === null ? null : Math.floor(Math.max(0, Date.now() - hubTimestamp) / 60_000)
  const hubFresh = hubAgeMinutes !== null && hubAgeMinutes < 15
  const mode = LIA_LIVE_TRADING || status?.LIA_LIVE_TRADING === 1
    ? 'Live flag reported — execution gates not independently verified'
    : 'Paper / shadow — no autonomous live execution'

  return (
    <section aria-labelledby="lia-public-overview" className="min-w-0 space-y-4 rounded-2xl border border-cyan-500/25 bg-zinc-950/95 p-3 sm:p-5">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">LIA · Control Room</p>
        <h2 id="lia-public-overview" className="text-xl font-semibold text-white">Agent intelligence at a glance</h2>
        <p className="break-words text-xs text-emerald-200">{LIA_BADGE}</p>
        <p className="text-sm text-zinc-200"><strong>Execution mode:</strong> {mode}</p>
        <p className="text-xs text-zinc-400">Public signals are read-only. Viewing an agent never connects a wallet or executes a transaction.</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm text-zinc-100">Signal health</strong>
          <button type="button" onClick={() => void refresh()} disabled={pending} className="min-h-[44px] rounded-lg border border-cyan-500/30 px-3 text-sm text-cyan-200 disabled:opacity-50">Refresh signals</button>
        </div>
        <p className="mt-1 text-xs text-zinc-300">
          {pending ? 'Checking published snapshots…' : !status ? 'Aggregated status unavailable — no live-data claim' : fresh ? 'Aggregated snapshot updated within 15 minutes' : 'Aggregated snapshot is delayed — not real-time'}
        </p>
        <p className="mt-1 text-xs text-zinc-400">Aggregator: {timestamp !== null ? new Date(timestamp).toLocaleString() : 'unavailable'}{ageMinutes !== null ? ' · ' + ageMinutes + ' min old' : ''}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Hub/Vellum mirror: {hubTimestamp !== null ? new Date(hubTimestamp).toLocaleString() : 'unavailable'}
          {' · '}{hubFresh ? 'recent snapshot' : 'stale or unavailable'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{syncedAt !== null ? 'Checked at ' + new Date(syncedAt).toLocaleTimeString() : 'Not checked yet'} · Checking a snapshot does not refresh its source.</p>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Last published LIA telemetry">
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-zinc-400">Reported strategy</p>
          <p className="mt-1 break-words text-lg font-semibold text-white">{status?.mindset?.strategy || hub?.strategy || 'Unavailable'}</p>
          <p className="mt-1 text-xs text-zinc-500">Published signal, not a trade</p>
        </div>
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-zinc-400">Shadow performance</p>
          <p className="mt-1 text-lg font-semibold text-white">{typeof status?.shadow?.shadow_pnl_usd === 'number' ? '
        {AGENT_PACKS.map(pack => (
          <Link key={pack.id} to={`/packs/${pack.id}`} className="min-w-0 rounded-xl border border-white/15 bg-white/[0.04] p-4 text-left transition-colors hover:border-cyan-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
            <span className="text-sm font-bold uppercase text-cyan-200">{pack.name}</span>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300">{pack.tagline}</p>
            <p className="mt-3 text-xs font-semibold text-cyan-300">Explore module →</p>
          </Link>
        ))}
      </div>
      <p className="text-xs text-zinc-500">The immersive holographic view is optional; use the button above to open it.</p>
    </section>
  )
}
 + status.shadow.shadow_pnl_usd.toFixed(2) : 'Unavailable'}</p>
          <p className="mt-1 text-xs text-zinc-500">Simulation only · not realized P&amp;L</p>
        </div>
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-zinc-400">Wallet snapshot</p>
          <p className="mt-1 text-lg font-semibold text-white">{typeof status?.onchain?.egld === 'number' ? status.onchain.egld.toFixed(4) + ' EGLD' : 'Unavailable'}</p>
          <p className="mt-1 text-xs text-zinc-500">Last published balance · not live</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Aggregator and hub are separate sources. Signal freshness is evaluated from the source timestamp, not the device clock or feed animation.
      </p>
      <h3 className="text-sm font-semibold text-zinc-100">Explore the three agents</h3>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Agent modules">
        {AGENT_PACKS.map(pack => (
          <Link key={pack.id} to={`/packs/${pack.id}`} className="min-w-0 rounded-xl border border-white/15 bg-white/[0.04] p-4 text-left transition-colors hover:border-cyan-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
            <span className="text-sm font-bold uppercase text-cyan-200">{pack.name}</span>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300">{pack.tagline}</p>
            <p className="mt-3 text-xs font-semibold text-cyan-300">Explore module →</p>
          </Link>
        ))}
      </div>
      <p className="text-xs text-zinc-500">The immersive holographic view is optional; use the button above to open it.</p>
    </section>
  )
}
