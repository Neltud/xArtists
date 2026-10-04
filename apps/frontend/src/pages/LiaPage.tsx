/**
 * LIA Hub public — profile · mindset · shadow proof · TX · equity curve · RCE.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'
import { fetchProtocolProfile, type ProtocolProfile } from '../lia/protocolProfile'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumBridge'
import { matrixFromPulse, runDecisionCycle } from '../lia/decisionCycle'
import { loadShadowBalances, loadShadowLog, type ShadowFill } from '../lia/shadowLedger'
import { fetchEgldPrice } from '../lia/priceTick'
import { fetchRecentTx, type ExplorerTx } from '../lia/explorerTx'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import ShadowEquityChart from '../components/lia/ShadowEquityChart'
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
  const [txs, setTxs] = useState<ExplorerTx[]>([])
  const [shadowBal, setShadowBal] = useState(() => loadShadowBalances())
  const [shadowLog, setShadowLog] = useState<ShadowFill[]>(() => loadShadowLog(24))
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
      const [p, v, px, txList, hubSt] = await Promise.all([
        fetchProtocolProfile(),
        fetchVellumLastRun(),
        fetchEgldPrice(true),
        fetchRecentTx(8),
        fetchLiaHubStatus(),
      ])
      setProfile(p)
      setVellum(v)
      setTxs(txList)
      setHub(hubSt)
      setShadowBal(loadShadowBalances())
      setShadowLog(loadShadowLog(24))

      const m = matrixFromPulse({
        assetId: 'EGLD',
        price: px.priceUsd,
        sentiment: typeof env?.sentiment === 'number' ? env.sentiment : 0,
        volatility: 0.35,
        confidence: lia.confidence ?? 0.5,
        rce: p.egldUsd || 0,
      })
      const cycle = runDecisionCycle(m, { executeShadow: false })
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
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const statusLabel =
    vellum?.live === true
      ? 'Vellum live flag on (ops)'
      : vellum
        ? 'Pipeline paper publié'
        : 'Shadow navigateur + pulse'

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto pb-20">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="section-label">Intelligence</p>
          <span className="rounded-full border border-cyan-500/30 px-2 py-0.5 text-[10px] text-cyan-200">
            HUB PUBLIC
          </span>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-zinc-400">
            {ambient.mode} · {ambient.trend}
          </span>
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

      {/* RCE = Real Capital Engaged : EGLD dans les smart contracts produit */}
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
            <p className="text-2xl font-bold text-white tabular-nums">{fmt(profile?.egld, 4)}</p>
            <p className="text-[12px] text-zinc-500">{fmtUsd(profile?.egldUsd)}</p>
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
            <p className="text-lg font-semibold text-white">{tick?.strategy || hub?.strategy || '—'}</p>
            <p className="text-[12px] text-zinc-500">{tick?.reason || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Confiance</p>
              <p className="font-semibold text-white tabular-nums">
                {((lia.confidence ?? hub?.confidence ?? 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="font-semibold text-cyan-200">{tick?.action || 'HOLD'}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Aura</p>
              <p className="font-semibold text-white">{tick?.aura || ambient.mode}</p>
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
            Simulé uniquement — recherche, pas un rendement promis.
          </p>
          {hub && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[12px]">
              <p className="text-zinc-500">Hub status (Vellum)</p>
              <p className="text-zinc-200">
                PnL shadow {fmtUsd(hub.shadow_pnl_usd)} · fills {hub.fills ?? '—'} · win rate{' '}
                {hub.win_rate != null ? `${(hub.win_rate * 100).toFixed(0)}%` : '—'}
              </p>
              {hub.ts && <p className="text-[10px] text-zinc-600 mt-0.5">{hub.ts}</p>}
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
          <li>Wallet protocole public — historique complet sur l’explorer.</li>
          <li>RCE = Real Capital Engaged (bandeau ci-dessus) — pas le paper.</li>
          <li>Courbe equity = reconstruction locale des fills shadow.</li>
          <li>Aucune TX signée depuis ce hub.</li>
        </ul>
      </section>
    </div>
  )
}
