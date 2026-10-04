/**
 * LIA Hub public — Model C research agent face.
 * On-chain profile + mindset (pulse/vellum/shadow) + shadow proof.
 * No guaranteed yield. No auto TX.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'
import { fetchProtocolProfile, type ProtocolProfile } from '../lia/protocolProfile'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumBridge'
import { matrixFromPulse, runDecisionCycle } from '../lia/decisionCycle'
import { loadShadowBalances, loadShadowLog, type ShadowFill } from '../lia/shadowLedger'
import { fetchEgldPrice } from '../lia/priceTick'
import { usePulse } from '../hooks/usePulse'
import { toAmbientSnapshot } from '../lib/ambientAura'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'

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

export default function LiaPage() {
  const { env, source } = usePulse()
  const lia = useLIAInterpreter(env)
  const ambient = useMemo(
    () => toAmbientSnapshot(lia.uniforms, lia.confidence, false),
    [lia.uniforms, lia.confidence],
  )

  const [profile, setProfile] = useState<ProtocolProfile | null>(null)
  const [vellum, setVellum] = useState<VellumLastRun | null>(null)
  const [shadowBal, setShadowBal] = useState(() => loadShadowBalances())
  const [shadowLog, setShadowLog] = useState<ShadowFill[]>(() => loadShadowLog(8))
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
      const [p, v, px] = await Promise.all([
        fetchProtocolProfile(),
        fetchVellumLastRun(),
        fetchEgldPrice(true),
      ])
      setProfile(p)
      setVellum(v)
      setShadowBal(loadShadowBalances())
      setShadowLog(loadShadowLog(8))

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

  const shadowEquityHint = useMemo(() => {
    // rough: EGLD virtual * last known + USDC (TRO not priced here)
    return shadowBal.USDC + shadowBal.EGLD // EGLD units not USD — show raw in UI
  }, [shadowBal])

  const wins = shadowLog.filter(f => f.side === 'BUY' || f.side === 'SELL').length
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
          Agent de recherche on-chain (Model C). Solde protocole public, mindset paper, preuve
          shadow — <strong className="text-zinc-300">pas un fond d’investissement</strong>, pas de
          rendement garanti.
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
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* MODULE A — Protocol profile */}
        <section className="card space-y-3 lg:col-span-1 border-purple-500/20">
          <p className="text-[10px] uppercase tracking-[0.18em] text-purple-300/90 font-semibold">
            A · Profil protocole
          </p>
          <p className="text-xs mono text-zinc-500 break-all">{shortAddr(LIA_WALLET)}</p>
          {profile?.error && (
            <p className="text-[12px] text-amber-200">{profile.error}</p>
          )}
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <p className="text-[10px] text-zinc-500 uppercase">EGLD</p>
            <p className="text-2xl font-bold text-white tabular-nums">{fmt(profile?.egld, 4)}</p>
            <p className="text-[12px] text-zinc-500">{fmtUsd(profile?.egldUsd)}</p>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
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
          <p className="text-[11px] text-zinc-600">
            TX count : {profile?.txCount ?? '—'} · données API MultiversX
          </p>
          <Link to="/lp" className="text-[12px] text-cyan-400 underline">
            Voir pools & LP protocole →
          </Link>
        </section>

        {/* MODULE B — Mindset */}
        <section className="card space-y-3 lg:col-span-1 border-cyan-500/20">
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/90 font-semibold">
            B · Mindset
          </p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase">Stratégie (paper tick)</p>
            <p className="text-lg font-semibold text-white">{tick?.strategy || '—'}</p>
            <p className="text-[12px] text-zinc-500">{tick?.reason || 'En attente de tick'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Confiance</p>
              <p className="font-semibold text-white tabular-nums">
                {((lia.confidence ?? 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-2 border border-white/5">
              <p className="text-zinc-500">Intent</p>
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
                {vellum.ts || '—'} · mode {vellum.summary?.mode || '—'} ·{' '}
                {vellum.summary?.ok === false ? 'steps failed' : 'ok'}
              </p>
            </div>
          )}
          <p className="text-[11px] text-zinc-500">Statut : {statusLabel}</p>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            {lia.phrase || 'Scan marché · aucun ordre automatique depuis ce hub.'}
          </p>
        </section>

        {/* MODULE C — Shadow proof */}
        <section className="card space-y-3 lg:col-span-1 border-emerald-500/15">
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/90 font-semibold">
            C · Preuve shadow
          </p>
          <p className="text-[12px] text-zinc-500 leading-relaxed">
            Performance basée sur le trading <strong className="text-zinc-400">simulé</strong>{' '}
            (navigateur / pipeline paper) — recherche uniquement.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl bg-black/30 p-2">
              <p className="text-zinc-500">EGLD virtuel</p>
              <p className="font-semibold tabular-nums">{fmt(shadowBal.EGLD, 4)}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2">
              <p className="text-zinc-500">USDC virtuel</p>
              <p className="font-semibold tabular-nums">{fmt(shadowBal.USDC, 2)}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2">
              <p className="text-zinc-500">TRO virtuel</p>
              <p className="font-semibold tabular-nums">{fmt(shadowBal.TRO, 0)}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-2">
              <p className="text-zinc-500">Fills log</p>
              <p className="font-semibold tabular-nums">{shadowLog.length}</p>
            </div>
          </div>
          <ul className="max-h-36 overflow-y-auto space-y-1 text-[11px] mono text-zinc-500">
            {shadowLog.length === 0 && <li>Aucun fill local — ouvre Command → Tick.</li>}
            {[...shadowLog].reverse().map(f => (
              <li key={f.id}>
                {new Date(f.at).toLocaleString()} · {f.strategy} · {f.side} {fmt(f.amount, 3)}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-zinc-600">
            Événements shadow (session) : {wins} · equity brute local ≈ {fmt(shadowEquityHint, 2)}
          </p>
          <Link to="/command-center" className="text-[12px] text-cyan-400 underline">
            War room shadow →
          </Link>
        </section>
      </div>

      <section className="card text-sm text-zinc-400 space-y-2">
        <p className="font-semibold text-zinc-200">Cadre honnête</p>
        <ul className="text-[13px] space-y-1 list-disc pl-4">
          <li>Wallet protocole public — historique TX complet sur l’explorer.</li>
          <li>Décisions affichées = paper / shadow tant que LIA_LIVE_TRADING = 0.</li>
          <li>Tu signes toi-même toute TX réelle (xPortal) — ce hub n’envoie rien.</li>
          <li>Packs Pulse · Yield · Sentinel = accès produit / salles, pas un dépôt géré.</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link to="/agents" className="btn-secondary text-sm">
            Packs
          </Link>
          <Link to="/trading" className="btn-secondary text-sm">
            Desk
          </Link>
          <Link to="/go-live" className="btn-secondary text-sm">
            Statut go-live
          </Link>
        </div>
      </section>
    </div>
  )
}
