import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * LIA Hub — Control Room 3D + Cockpit LIVE intents xPortal (v0.110).
 */
import { useCallback, useEffect, useState } from 'react'
import LiaHubControlRoomLazy from '../components/lia/LiaHubControlRoomLazy'
import { Link } from 'react-router-dom'
import { usePulse } from '../hooks/usePulse'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import { fetchEgldPrice } from '../lia/priceTick'
import { persistShadowExport } from '../lia/shadowExport'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumStatus'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import { fetchLiaStatus, type LiaStatusV1 } from '../lia/liaStatus'
import { assessTelemetrySource } from '../lia/telemetryTruth.mjs'
import { fetchMarketAura } from '../lia/marketAura'
import LiaCommandTerminal from '../components/LiaCommandTerminal'
import DailySignalWidget from '../components/DailySignalWidget'
import EconomicPulse from '../components/lia/EconomicPulse'
import IntentFeedTerminal from '../components/lia/IntentFeedTerminal'
import HolderTerminal from '../components/lia/HolderTerminal'
import LiveAssetTape from '../components/LiveAssetTape'
import RceStrip from '../components/RceStrip'
import LiaAgentControl from '../components/LiaAgentControl'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { LIA_LIVE_TRADING, LIA_BADGE } from '../config/liaConfig'

const API = 'https://api.multiversx.com'
const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

type ExplorerTx = {
  txHash?: string
  function?: string
  status?: string
  value?: string
}

async function fetchRecentTx(size = 8): Promise<ExplorerTx[]> {
  try {
    const r = await fetch(`${API}/accounts/${LIA_WALLET}/transactions?size=${size}&order=desc`, {
      cache: 'no-store',
    })
    if (!r.ok) return []
    const j = await r.json()
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export default function LiaPage() {
  const { env } = usePulse()
  const lia = useLIAInterpreter(env)
  const [vellum, setVellum] = useState<VellumLastRun | null>(null)
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [agg, setAgg] = useState<LiaStatusV1 | null>(null)
  const [txs, setTxs] = useState<ExplorerTx[]>([])
  const [loading, setLoading] = useState(true)
  const [mAura, setMAura] = useState<string>('stable')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const producerFreshness = assessTelemetrySource({
    source_ts: agg?.mindset?.vellum_ts ?? null,
    published_at: agg?.ts ?? null,
    provider: 'Vellum producer', data_mode: 'paper',
  })
  const hubFreshness = assessTelemetrySource({
    source_ts: hub?.ts ?? null, published_at: hub?.ts ?? null,
    provider: 'Vellum hub mirror', data_mode: 'paper',
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [v, px, txList, hubSt, st] = await Promise.all([
        fetchVellumLastRun(),
        fetchEgldPrice(true),
        fetchRecentTx(8),
        fetchLiaHubStatus(),
        fetchLiaStatus(),
      ])
      setVellum(v)
      setTxs(txList)
      setHub(hubSt)
      setAgg(st)
      try {
        const ma = await fetchMarketAura()
        setMAura(ma.mood)
      } catch {
        /* offline */
      }
      persistShadowExport(px.priceUsd || 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  return (
    <div className="animate-fade-in mx-auto max-w-5xl min-w-0 space-y-6 pb-28">
      <header className="space-y-3">
        <p className="section-label">LIA · PUBLIC CONTROL ROOM</p>
        <h1 className="section-title display text-2xl sm:text-3xl">Agent signals, clearly explained</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">
          Explore the published signals of the xArtists AI agents, read the source timestamps, and
          distinguish market observations from simulations. No wallet is needed to view this page.
        </p>
        <p className="inline-block max-w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100" role="status">
          {LIA_LIVE_TRADING
            ? 'Trading flag reported: enabled. This page does not independently verify execution readiness.'
            : 'PAPER / SHADOW · Automated live trading is disabled. Simulated P&L is not realized profit.'}
        </p>
        <p className="max-w-2xl text-xs text-zinc-500">
          Data comes from periodically published snapshots, not a continuous LIA trading stream.
          The published timestamp is different from the time at which you open this page.
        </p>
      </header>

      <LiaHubControlRoomLazy />

      <nav aria-label="Explore xArtists" className="flex flex-wrap gap-2">
        <Link to="/intelligence/agents" className="min-h-[44px] rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100">
          Explore Pulse, Yield &amp; Sentinel
        </Link>
        <Link to="/explore/market" className="min-h-[44px] rounded-xl border border-white/20 px-4 py-3 text-sm text-zinc-200">
          Marketplace
        </Link>
        <Link to="/explore/auction" className="min-h-[44px] rounded-xl border border-white/20 px-4 py-3 text-sm text-zinc-200">
          Auctions
        </Link>
      </nav>

      <section aria-labelledby="lia-advanced" className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-xl">
            <h2 id="lia-advanced" className="text-lg font-semibold text-white">Advanced intelligence &amp; diagnostics</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Optional technical dashboards, asset tickers, intent logs and simulations.
              These are not confirmations of trades, NFT deliveries or real-time LIA executions.
            </p>
          </div>
          <button type="button" onClick={() => setAdvancedOpen(open => !open)} aria-expanded={advancedOpen}
            aria-controls="lia-advanced-content"
            className="min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
            {advancedOpen ? 'Hide advanced dashboards' : 'Show advanced dashboards'}
          </button>
        </div>
        {advancedOpen && (
          <div id="lia-advanced-content" className="min-w-0 space-y-5">
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <LiaAgentControl />
                <HolderTerminal />
                <DailySignalWidget />
                <EconomicPulse />
              </div>
              <div className="min-w-0 space-y-4">
                <LiveAssetTape />
                <RceStrip compact />
                <IntentFeedTerminal />
              </div>
            </div>
            <div className="min-w-0 overflow-x-auto"><Pack3DCockpit showIntents /></div>
            <section className="min-w-0 space-y-2 rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Sources &amp; operator telemetry</h3>
              <p className="text-xs text-zinc-400">
                Vellum: paper/delayed snapshots only; no independently verified trading execution
                {' · '}Model aura: {mAura}
                {loading ? ' · synchronizing snapshots' : ''}
              </p>
              <p className="break-words text-xs text-zinc-400">Hub mirror: {hubFreshness.source_ts || 'unavailable'} · {hubFreshness.source_health} · no LIVE claim</p>
              {!producerFreshness.is_stale && agg?.paper === true && agg?.mindset?.strategy
                ? <p className="text-xs text-zinc-400">Paper strategy (producer fresh): {agg.mindset.strategy}</p>
                : <p className="break-words text-xs text-amber-200">Vellum strategy withheld — producer {producerFreshness.source_health}; source {producerFreshness.source_ts || 'unavailable'}</p>}
              {txs.length > 0 && (
                <div className="text-xs text-zinc-500">
                  <p>Recent public wallet transactions (not proof of autonomous agent trading):</p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                    {txs.slice(0, 5).map((tx, i) => (
                      <li key={tx.txHash || i} className="break-all">{tx.function || 'transaction'} · {tx.status || 'status unknown'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
            <LiaCommandTerminal
              phrase={lia.phrase}
              mood={lia.uniforms?.mood ?? 'stable'}
              confidence={lia.confidence ?? 0.5}
              source={lia.source}
              pending={lia.shadow?.liaPending}
              fallback={lia.shadow?.fallbackActive}
              onAsk={ctx => lia.requestComment(ctx)}
              contextHint="lia-hub"
              defaultOpen={false}
            />
            <p className="text-xs text-zinc-500">{LIA_BADGE} · On-chain actions require user authorization through xPortal.</p>
            <nav className="flex flex-wrap gap-3 text-xs text-zinc-400" aria-label="Additional tools">
              <Link to="/command-center" className="underline underline-offset-4 hover:text-white">Command Center (access restricted)</Link>
              <Link to="/studio" className="underline underline-offset-4 hover:text-white">Creative Studio</Link>
              <Link to="/agents" className="underline underline-offset-4 hover:text-white">Agent packs</Link>
            </nav>
          </div>
        )}
      </section>
    </div>
  )
}
