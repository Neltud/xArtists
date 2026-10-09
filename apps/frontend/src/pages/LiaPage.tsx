/**
 * LIA Hub — live multi-asset + Shadow + Holder terminal.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePulse } from '../context/PulseContext'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import { toAmbientSnapshot } from '../lia/ambient'
import { matrixFromPulse, runDecisionCycle } from '../lia/decisionCycle'
import { fetchEgldPrice } from '../lia/priceTick'
import { fetchProtocolProfile } from '../lia/protocolProfile'
import { persistShadowExport } from '../lia/shadowExport'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumStatus'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import { fetchLiaStatus, auraFromStatus, type LiaStatusV1 } from '../lia/liaStatus'
import { fetchMarketAura } from '../lia/marketAura'
import { asText } from '../lib/safeRender'
import AuraBadge from '../components/lia/AuraBadge'
import MatrixBoard from '../components/lia/MatrixBoard'
import ShadowPerformance from '../components/lia/ShadowPerformance'
import MarketMetricsCharts from '../components/lia/MarketMetricsCharts'
import IntentFeedTerminal from '../components/lia/IntentFeedTerminal'
import HolderTerminal from '../components/lia/HolderTerminal'
import LiveAssetTape from '../components/LiveAssetTape'
import RceStrip from '../components/RceStrip'

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
  const ambient = useMemo(
    () => toAmbientSnapshot(lia.uniforms, lia.confidence, false),
    [lia.uniforms, lia.confidence],
  )

  const [vellum, setVellum] = useState<VellumLastRun | null>(null)
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [agg, setAgg] = useState<LiaStatusV1 | null>(null)
  const [txs, setTxs] = useState<ExplorerTx[]>([])
  const [tick, setTick] = useState<{
    strategy: string
    reason: string
    action: string
    aura: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mAura, setMAura] = useState<string>('stable')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [p, v, px, txList, hubSt, st] = await Promise.all([
        fetchProtocolProfile(),
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

      const m = matrixFromPulse({
        assetId: 'EGLD',
        price: px.priceUsd,
        sentiment: typeof env?.sentiment === 'number' ? env.sentiment : 0,
        volatility: 0.35,
        confidence: lia.confidence ?? 0.5,
        rce: p.egldUsd || 0,
      })
      const cycle = runDecisionCycle(m, { executeShadow: true })
      setTick({
        strategy: cycle.strategy,
        reason: cycle.reason,
        action: cycle.intent.action,
        aura: cycle.aura,
      })
    } finally {
      setLoading(false)
    }
  }, [env?.sentiment, lia.confidence])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 15_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const fromAgg = auraFromStatus(agg)
  const auraMode = tick?.aura || fromAgg.mode || mAura || ambient.mode

  const statusLabel =
    vellum?.live === true
      ? 'Vellum live flag'
      : agg
        ? 'Aggregator lia_status'
        : hub
          ? 'Hub status'
          : 'Local pulse'

  const shadowPnlText =
    agg?.shadow?.shadow_pnl_usd != null ? `${asText(agg.shadow.shadow_pnl_usd)} USD` : '—'

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto pb-16">
      <header className="space-y-2">
        <p className="section-label">LIA Hub</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="section-title display text-2xl">Intelligence</h1>
          <AuraBadge mode={String(auraMode)} trend={fromAgg.trend || ambient.trend} />
        </div>
        <p className="text-sm text-zinc-400">SHADOW / SIMULATED · live tape · poll 15s</p>
        <RceStrip compact />
      </header>

      <LiveAssetTape />

      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="card border-cyan-500/20">
          <p className="text-[10px] uppercase text-zinc-500">Source</p>
          <p className="font-semibold text-white">{asText(statusLabel)}</p>
        </div>
        <div className="card border-cyan-500/20">
          <p className="text-[10px] uppercase text-zinc-500">Aura</p>
          <p className="font-semibold text-white">{asText(auraMode)}</p>
          <p className="text-[10px] text-zinc-500">
            {asText(fromAgg.source)} · market {asText(mAura)}
          </p>
        </div>
        <div className="card border-cyan-500/20">
          <p className="text-[10px] uppercase text-zinc-500">Shadow PnL</p>
          <p className="font-semibold tabular-nums">{shadowPnlText}</p>
        </div>
      </div>

      <HolderTerminal />
      <ShadowPerformance />
      <IntentFeedTerminal />
      <MarketMetricsCharts />
      <MatrixBoard />

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold text-white">TX explorer (wallet LIA)</h2>
        {txs.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Aucune TX récente.</p>
        ) : (
          <ul className="text-[11px] space-y-1">
            {txs.map(t => (
              <li key={asText(t.txHash)}>
                <a
                  className="text-cyan-400 underline"
                  href={`https://explorer.multiversx.com/transactions/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {asText(t.function || t.txHash?.slice(0, 12))}
                </a>{' '}
                <span className="text-zinc-500">{asText(t.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? '…' : 'Actualiser'}
        </button>
        <Link to="/command-center" className="btn-secondary text-sm">
          Command Center
        </Link>
        <Link to="/portfolio" className="btn-secondary text-sm">
          Portfolio
        </Link>
      </div>

      <ul className="text-[11px] text-zinc-600 space-y-1">
        <li>Performance LIA = SHADOW / SIMULATED — pas d&apos;alpha live.</li>
        <li>LIA_LIVE_TRADING=0 · prix tape = sources publiques.</li>
      </ul>
    </div>
  )
}
