/**
 * LIA Hub — live multi-asset + Shadow + Holder terminal + Agent Control.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePulse } from '../hooks/usePulse'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import { toAmbientSnapshot } from '../lib/ambientAura'
import { fetchProtocolProfile } from '../lib/protocolProfile'
import { fetchEgldPrice } from '../lib/egldPrice'
import { persistShadowExport } from '../lib/shadowExport'
import { matrixFromPulse } from '../lia/matrix'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumStatus'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import { fetchLiaStatus, auraFromStatus, type LiaStatusV1 } from '../lia/liaStatus'
import { fetchMarketAura } from '../lia/marketAura'
import LiaCommandTerminal from '../components/LiaCommandTerminal'
import DailySignalWidget from '../components/DailySignalWidget'
import EconomicPulse from '../components/lia/EconomicPulse'
import IntentFeedTerminal from '../components/lia/IntentFeedTerminal'
import HolderTerminal from '../components/lia/HolderTerminal'
import LiveAssetTape from '../components/LiveAssetTape'
import RceStrip from '../components/RceStrip'
import LiaAgentControl from '../components/LiaAgentControl'

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
      matrixFromPulse({
        assetId: 'EGLD',
        price: px.priceUsd,
        sentiment: typeof env?.sentiment === 'number' ? env.sentiment : 0,
        volatility: 0.35,
        confidence: lia.confidence ?? 0.5,
        rce: p.egldUsd || 0,
      })
    } finally {
      setLoading(false)
    }
  }, [env, lia.confidence])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  return (
    <div className="animate-fade-in space-y-6 pb-20 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">LIA Hub</p>
        <h1 className="section-title display text-2xl">Agent autonome & signaux</h1>
        <p className="text-[13px] text-zinc-500 leading-relaxed">
          Multi-IA (Vellum / Gemini / Grok) · wallet dédié · paper first. Aura marché :{' '}
          <span className="text-zinc-300">{mAura}</span>
          {loading ? ' · sync…' : ''}
        </p>
      </header>

      <LiaAgentControl />
      <HolderTerminal />
      <LiveAssetTape />
      <RceStrip compact />
      <DailySignalWidget />
      <EconomicPulse />
      <IntentFeedTerminal />

      <section className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Vellum & hub
        </p>
        <p className="text-[12px] text-zinc-400">
          Vellum · {vellum?.live ? 'LIVE' : 'paper'} {vellum?.summary?.mode ? `· ${vellum.summary.mode}` : ''}
        </p>
        <p className="text-[12px] text-zinc-400">
          Hub · {hub?.strategy || hub?.note || '—'} · shadow PnL {hub?.shadow_pnl_usd ?? '—'}
        </p>
        {agg?.mindset?.strategy && (
          <p className="text-[11px] mono text-zinc-500">strategy · {agg.mindset.strategy}</p>
        )}
        {txs.length > 0 && (
          <ul className="text-[11px] mono text-zinc-500 space-y-1 max-h-28 overflow-y-auto">
            {txs.slice(0, 5).map((tx, i) => (
              <li key={tx.txHash || i}>
                {tx.function || 'tx'} · {tx.status || '—'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <LiaCommandTerminal
        phrase={lia.phrase}
        mood={lia.uniforms.mood}
        confidence={lia.confidence}
        source={lia.source}
        pending={lia.shadow.liaPending}
        fallback={lia.shadow.fallbackActive}
        onAsk={ctx => lia.requestComment(ctx)}
        contextHint="lia-hub"
        defaultOpen={false}
      />

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/command-center" className="hover:text-zinc-300">
          Command Center
        </Link>
        <Link to="/studio" className="hover:text-zinc-300">
          Studio Phygital
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          Packs
        </Link>
      </div>
    </div>
  )
}
