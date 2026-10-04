/**
 * LIA Hub — aggregator · shadow · intent feed · aura (paper).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'
import { fetchProtocolProfile, type ProtocolProfile } from '../lia/protocolProfile'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumBridge'
import { matrixFromPulse, runDecisionCycle } from '../lia/decisionCycle'
import { loadShadowBalances, loadShadowLog, type ShadowFill } from '../lia/shadowLedger'
import { persistShadowExport } from '../lia/shadowExport'
import { loadIntentFeed, type FeedItem } from '../lia/intentFeed'
import { fetchEgldPrice } from '../lia/priceTick'
import { fetchRecentTx, type ExplorerTx } from '../lia/explorerTx'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import { fetchLiaStatus, type LiaStatusV1 } from '../lia/liaStatus'
import ShadowEquityChart from '../components/lia/ShadowEquityChart'
import IntentFeed from '../components/lia/IntentFeed'
import AuraBadge from '../components/lia/AuraBadge'
import { usePulse } from '../hooks/usePulse'
import { toAmbientSnapshot } from '../lib/ambientAura'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import RceStrip from '../components/RceStrip'
import MatrixBoard from '../components/lia/MatrixBoard'

function fmt(n: number | null | undefined, d = 4): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  return n.toLocaleString('fr-FR', { maximumFractionDigits: d })
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function shortAddr(a: string): string {
  if (!a || a.length < 16) return a || '—'
  return `${a.slice(0, 8)}…${a.slice(-6)}`
}

function shortHash(h: string): string {
  if (!h || h.length < 12) return h || '—'
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

export default function LiaPage() {
  const { env, source } = usePulse()
  const lia = useLIAInterpreter(env)
  const ambient = useMemo(
    () => toAmbientSnapshot(lia.uniforms, lia.confidence, false),
    [lia.uniforms, lia.confidence],
  )

  const [profile, setProfile] = useState<ProtocolProfile | null>(null)
  const [vellum, setVellum] = useState<VellumLastRun | null>(null)
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [agg, setAgg] = useState<LiaStatusV1 | null>(null)
  const [txs, setTxs] = useState<ExplorerTx[]>([])
  const [shadowBal, setShadowBal] = useState(() => loadShadowBalances())
  const [shadowLog, setShadowLog] = useState<ShadowFill[]>(() => loadShadowLog(24))
  const [feed, setFeed] = useState<FeedItem[]>(() => loadIntentFeed(20))
  const [tick, setTick] = useState<{
    strategy: string
    reason: string
    action: string
    aura: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

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
      setProfile(p)
      setVellum(v)
      setTxs(txList)
      setHub(hubSt)
      setAgg(st)
      setShadowBal(loadShadowBalances())
      setShadowLog(loadShadowLog(24))
      persistShadowExport(px.priceUsd || 0)

      const m = matrixFromPulse({
        assetId: 'EGLD',
        price: px.priceUsd,
        sentiment: typeof env?.sentiment === 'number' ? env.sentiment : 0,
        volatility: 0.35,
        confidence: lia.confidence ?? 0.5,
        rce: p.egldUsd || 0,
      })
      // executeShadow true on manual refresh → friction fills + intent feed
      const cycle = runDecisionCycle(m, { executeShadow: true })
      setTick({
        strategy: cycle.strategy,
        reason: cycle.reason,
        action: cycle.intent.action,
        aura: cycle.aura,
      })
      setFeed(loadIntentFeed(20))
      setShadowBal(loadShadowBalances())
      setShadowLog(loadShadowLog(24))
    } finally {
      setLoading(false)
    }
  }, [env?.sentiment, lia.confidence])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const statusLabel =
    vellum?.live === true
      ? 'Vellum live flag on (ops)'
      : agg
        ? 'Aggregator lia_status'
        : vellum
          ? 'Pipeline paper publié'
          : 'Shadow navigateur + pulse'

  const stratLabel = tick?.strategy || agg?.mindset?.strategy || hub?.strategy || '—'
  const pnl = agg?.shadow?.shadow_pnl_usd ?? hub?.shadow_pnl_usd
  const fills = agg?.shadow?.fills ?? hub?.fills
  const winRate = agg?.shadow?.win_rate ?? hub?.win_rate
  const auraMode = tick?.aura || ambient.mode

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto pb-20">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="section-label">Intelligence</p>
          <span className="rounded-full border border-cyan-500/30 px-2 py-0.5 text-[10px] text-cyan-200">
            HUB PUBLIC
          </span>
          <AuraBadge mode={String(auraMode)} trend={ambient.trend} />
        </div>
        <h1 className="section-title display text-3xl">LIA</h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Agent de recherche on-chain (Model C). Solde protocole, mindset paper, preuve shadow —{' '}
          <strong className="text-zinc-300">pas un fond d’investissement</strong>.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-sm" onClick={() => void refresh()} disabled={loading}>
          {loading ? '…' : 'Actualiser'}
        </button>
        <a
          className="btn-primary text-sm"
          href={LINKS.explorerAccount(LIA_WALLET)}
          target="_blank"
          rel="noreferrer"
        >
          Explorer wallet LIA
        </a>
        <Link to="/command-center" className="btn-secondary text-sm">
          Command Center
        </Link>
        <Link to="/lp" className="btn-secondary text-sm">
          Pools / LP
        </Link>
        <Link to="/market" className="btn-secondary text-sm">
          Marché
        </Link>
      </div>

      <RceStrip compact />

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="card space-y-3 lg:col-span-1 border-purple-500/20">
          <p className="text-[10px] uppercase tracking-[0.18em] text-purple-300/90 font-semibold">
            A · Profil protocole
          </p>
          <p className="text-xs mono text-zinc-500 break-all">{shortAddr(LIA_WALLET)}</p>
          {profile?.error && <p className="text-[12px] text-amber-200">{profile.error}</p>}
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <p className="text-[10px] text-zinc-500 uppercase">EGLD</p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {fmt(agg?.onchain?.egld ?? profile?.egld, 4)}
            </p>
            <p className="text-[12px] text-zinc-500">
              {fmtUsd(agg?.onchain?.egld_usd ?? profile?.egldUsd)}
            </p>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {(profile?.tokens || []).length === 0 && (
              <p className="text-[12px] text-zinc-500">Aucun token ou chargement…</p>
            )}
            {(profile?.tokens || []).map(t => (
              <div
                key={t.identifier}
                className="flex justify-between gap-2 text-[12px] border-b border-white/5 py-1"
              >
                <span className="text-zinc-300 truncate">{t.ticker}</span>
                <span className="mono text-zinc-400 tabular-nums">{fmt(t.balance, 2)}</span>
              </div>
            ))}
          </div>
          <Link to="/lp" className="text-[12px] text-cyan-400 underline">
            Pools & LP protocole →
          </Link>
        </section>

        <section className="card space-y-3 lg:col-span-1 border-cyan-500/20">
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/90 font-semibold">
            B · Mindset
          </p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase">Stratégie (paper)</p>
            <p className="text-lg font-semibold text-white">{stratLabel}</p>
            <p className="text-[12px] text-zinc-500">{tick?.reason || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Confiance</p>
              <p className="font-semibold text-white tabular-nums">
                {((lia.confidence ?? agg?.mindset?.confidence ?? hub?.confidence ?? 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Intent</p>
              <p className="font-semibold text-cyan-200">{tick?.action || 'HOLD'}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Aura</p>
              <p className="font-semibold text-white">{String(auraMode)}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Pulse</p>
              <p className="font-semibold text-zinc-300">{source}</p>
            </div>
          </div>
          {vellum && (
            <div className="rounded-xl border border-white/10 px-3 py-2 text-[11px] text-zinc-400">
              <p className="text-zinc-500">Vellum last run</p>
              <p className="text-zinc-200">
                {vellum.ts || '—'} · {vellum.summary?.mode || '—'} ·{' '}
                {vellum.summary?.ok === false ? 'steps failed' : 'ok'}
              </p>
            </div>
          )}
          <p className="text-[11px] text-zinc-500">Statut : {statusLabel}</p>
        </section>

        <section className="card space-y-3 lg:col-span-1 border-emerald-500/15">
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/90 font-semibold">
            C · Preuve shadow
          </p>
          <p className="text-[12px] text-zinc-500">
            Friction : gas 0.0008 EGLD + slippage liquidité (paper).
          </p>
          {(hub || agg?.shadow) && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[12px]">
              <p className="text-zinc-500">Status agrégé</p>
              <p className="text-zinc-200">
                PnL {fmtUsd(pnl)} · fills {fills ?? '—'} · win{' '}
                {winRate != null ? `${(winRate * 100).toFixed(0)}%` : '—'}
              </p>
              {(agg?.ts || hub?.ts) && (
                <p className="text-[10px] text-zinc-600 mt-0.5">{agg?.ts || hub?.ts}</p>
              )}
            </div>
          )}
          <ShadowEquityChart fills={shadowLog} startEquity={110} />
          <div className="grid grid-cols-3 gap-2 text-[12px]">
            <div className="rounded-xl bg-black/30 p-2">
              <p className="text-zinc-500">EGLD virt.</p>
              <p className="font-semibold tabular-nums">{fmt(shadowBal.EGLD, 3)}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2">
              <p className="text-zinc-500">USDC virt.</p>
              <p className="font-semibold tabular-nums">{fmt(shadowBal.USDC, 1)}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2">
              <p className="text-zinc-500">Log</p>
              <p className="font-semibold tabular-nums">{shadowLog.length}</p>
            </div>
          </div>
          <Link to="/command-center" className="text-[12px] text-cyan-400 underline">
            War room →
          </Link>
        </section>
      </div>

      <IntentFeed items={feed} />

      <MatrixBoard />

      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">
            Dernières TX · wallet LIA
          </p>
          <a
            href={LINKS.explorerAccount(LIA_WALLET)}
            className="text-[12px] text-cyan-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            Tout voir sur l’explorer
          </a>
        </div>
        {txs.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune TX chargée.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-[12px]">
            {txs.map(tx => (
              <li key={tx.hash} className="py-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <a
                    href={LINKS.explorerTx(tx.hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-cyan-300/90 hover:underline"
                  >
                    {shortHash(tx.hash)}
                  </a>
                  <p className="text-zinc-500">
                    {tx.function || 'transfer'} · {tx.status}
                    {tx.timestamp
                      ? ` · ${new Date(tx.timestamp * 1000).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                <span className="mono text-zinc-300 tabular-nums">{fmt(tx.valueEgld, 4)} EGLD</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card text-sm text-zinc-400 space-y-2">
        <p className="font-semibold text-zinc-200">Cadre honnête</p>
        <ul className="text-[13px] space-y-1 list-disc pl-4">
          <li>Paper only — feed d’intents + aura ne signent rien.</li>
          <li>Shadow local avec friction (gas + slippage) ; export navigateur à chaque refresh.</li>
          <li>Micro-preuve live = PEM Vellum + runbook Beta (humain).</li>
        </ul>
      </section>
    </div>
  )
}
