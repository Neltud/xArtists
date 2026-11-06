import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS } from '../../config/agentPacks'
import { LIA_BADGE, LIA_LIVE_TRADING } from '../../config/liaConfig'
import { fetchLiaHubStatus, type LiaHubStatus } from '../../lia/hubStatus'
import { fetchLiaStatus, type LiaStatusV1 } from '../../lia/liaStatus'
import { assessTelemetrySource } from '../../lia/telemetryTruth.mjs'

/** Public, touch-first overview: no WebGL, wallet, signature or transaction calls. */
export default function LiaMobileOverview() {
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [status, setStatus] = useState<LiaStatusV1 | null>(null)
  const [syncedAt, setSyncedAt] = useState<number | null>(null)
  const [pending, setPending] = useState(true)

  const refresh = useCallback(async () => {
    setPending(true)
    try {
      // Polling two published snapshots never implies a continuous source stream.
      const [hubData, statusData] = await Promise.all([fetchLiaHubStatus(), fetchLiaStatus()])
      setHub(hubData)
      setStatus(statusData)
    } catch {
      setHub(null)
      setStatus(null)
    } finally {
      setSyncedAt(Date.now())
      setPending(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 60_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  // A new aggregator publication never makes an old Vellum model or fill fresh.
  // Source timestamps are separate from the current browser check time.
  const now = Date.now()
  const aggregatorSource = assessTelemetrySource({
    source_ts: status?.ts ?? null, published_at: status?.ts ?? null,
    provider: 'lia_status.json', data_mode: status?.paper === true ? 'paper' : 'unknown',
  }, now)
  const hubSource = assessTelemetrySource({
    source_ts: hub?.ts ?? null, published_at: hub?.ts ?? null,
    provider: 'lia_hub_status.json (Vellum mirror)', data_mode: hub?.paper === true ? 'paper' : 'unknown',
  }, now)
  const modelSource = assessTelemetrySource({
    source_ts: status?.mindset?.vellum_ts ?? null, published_at: status?.ts ?? null,
    provider: 'Vellum reasoning (producer)', data_mode: 'paper',
  }, now)
  const paperSource = assessTelemetrySource({
    source_ts: status?.shadow?.last_shadow?.slice(-1)[0]?.ts ?? null,
    published_at: status?.ts ?? null, provider: 'shadow paper legs', data_mode: 'paper',
  }, now)
  const fresh = !aggregatorSource.is_stale && aggregatorSource.data_mode === 'paper'
  const hubFresh = !hubSource.is_stale && hubSource.data_mode === 'paper'
  const modelFresh = !modelSource.is_stale && fresh
  const shadowFresh = !paperSource.is_stale && fresh
  const mode = LIA_LIVE_TRADING || status?.LIA_LIVE_TRADING === 1
    ? 'Unverified execution flag — no independent trading proof; read-only'
    : 'Paper / shadow — no autonomous live execution'
  const pnl = shadowFresh ? status?.shadow?.shadow_pnl_usd : null
  const balance = fresh ? status?.onchain?.egld : null
  const reportedStrategy = modelFresh ? status?.mindset?.strategy : null

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
          <button type="button" onClick={() => { void refresh() }} disabled={pending} className="min-h-[44px] rounded-lg border border-cyan-500/30 px-3 text-sm text-cyan-200 disabled:opacity-50">Refresh signals</button>
        </div>
        <p className="mt-1 text-xs text-zinc-300">
          {pending ? 'Checking published snapshots…' : !status ? 'Aggregated status unavailable — no live-data claim' : fresh ? 'Paper aggregator published within 15 minutes (not a live stream)' : 'Aggregated paper snapshot delayed / unverified — not real-time'}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Aggregator: {aggregatorSource.source_ts || 'unavailable'} · {aggregatorSource.source_health} · {aggregatorSource.age_minutes ?? '?'} min old · {aggregatorSource.data_mode}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Hub/Vellum mirror: {hubSource.source_ts || 'unavailable'} · {hubFresh ? 'recent paper snapshot' : 'stale or unavailable'} · {hubSource.source_health}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {syncedAt === null ? 'Not checked yet' : 'Checked at ' + new Date(syncedAt).toLocaleTimeString()} · Checking a snapshot does not refresh its source.
        </p>
        <p className="mt-1 break-words text-xs text-amber-200" role="status">
          Vellum producer: {modelSource.source_ts || 'unavailable'} · {modelSource.source_health} · {modelSource.data_mode} · no fresh model claim
        </p>
        <p className="mt-1 break-words text-xs text-zinc-400">
          Paper fill: {paperSource.source_ts || 'unavailable'} · {paperSource.source_health} · TTL {paperSource.ttl_seconds}s
        </p>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Last published LIA telemetry">
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-zinc-400">Reported strategy</p>
          <p className="mt-1 break-words text-lg font-semibold text-white">{reportedStrategy || 'Unavailable — model delayed or unsourced'}</p>
          <p className="mt-1 text-xs text-zinc-500">Vellum producer timestamp required · not a trade</p>
        </div>
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-zinc-400">Shadow performance</p>
          <p className="mt-1 text-lg font-semibold text-white">{typeof pnl === 'number' ? '$' + pnl.toFixed(2) : 'Unavailable'}</p>
          <p className="mt-1 text-xs text-zinc-500">Simulation only · not realized P&amp;L · hidden when source delayed</p>
        </div>
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-zinc-400">Wallet snapshot</p>
          <p className="mt-1 text-lg font-semibold text-white">{typeof balance === 'number' ? balance.toFixed(4) + ' EGLD' : 'Unavailable'}</p>
          <p className="mt-1 text-xs text-zinc-500">Last published balance · not live · hidden when aggregator delayed</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Aggregator and hub are separate sources. Signal freshness uses the producer timestamp, not device time or feed animation. Published_at and received_at cannot refresh an old model.
      </p>
      <h3 className="text-sm font-semibold text-zinc-100">Explore the three agents</h3>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Agent modules">
        {AGENT_PACKS.map(pack => (
          <Link key={pack.id} to={'/packs/' + pack.id} className="min-w-0 rounded-xl border border-white/15 bg-white/[0.04] p-4 text-left transition-colors hover:border-cyan-400/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
            <span className="text-sm font-bold uppercase text-cyan-200">{pack.name}</span>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300">{pack.tagline}</p>
            <p className="mt-3 text-xs font-semibold text-cyan-300">Explore module →</p>
          </Link>
        ))}
      </div>
      <p className="text-xs text-zinc-500">The former immersive holographic view is suspended until every animated pack metric is backed by authenticated, source-timestamped data.</p>
    </section>
  )
}
