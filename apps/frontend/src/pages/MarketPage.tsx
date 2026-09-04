/**
 * Analyse — A–E : F&G · assets · corr · funding · Vellum · events · LIA ≥10 USDC · Soul.
 */
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts'
import InfoTip from '../components/InfoTip'
import {
  loadMarketSnapshot,
  formatUsd,
  corrColor,
  type MarketSnapshot,
} from '../lib/marketData'
import {
  MIN_USDC_DEPLOY,
  LIA_CHAIN_PRIORITY,
  liaDeployStatus,
} from '../config/liaTreasuryPolicy'
import { SOUL_PROTOCOL } from '../config/soulProtocol'
import { LIA_WALLET, LINKS } from '../config/links'

function FngGauge({ value, label }: { value: number; label: string }) {
  const color =
    value <= 24
      ? '#f87171'
      : value <= 44
        ? '#fb923c'
        : value <= 55
          ? '#a1a1aa'
          : value <= 74
            ? '#34d399'
            : '#22d3ee'
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div
        className="relative h-28 w-28 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${value * 3.6}deg, rgba(255,255,255,0.06) 0)`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-zinc-950 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums text-white">{value}</span>
          <span className="text-[10px] text-zinc-500 mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-zinc-200">{label}</p>
    </div>
  )
}

async function fetchLiaUsdc(): Promise<number> {
  try {
    const r = await fetch(
      `https://api.multiversx.com/accounts/${LIA_WALLET}/tokens/${encodeURIComponent('USDC-c76f1f')}`,
      { cache: 'no-store' }
    )
    if (!r.ok) return 0
    const j = (await r.json()) as { balance?: string; decimals?: number }
    const bal = Number(j.balance || 0)
    const dec = j.decimals ?? 6
    return bal / 10 ** dec
  } catch {
    return 0
  }
}

export default function MarketPage() {
  const [snap, setSnap] = useState<MarketSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [liaUsdc, setLiaUsdc] = useState<number | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const [s, usdc] = await Promise.all([loadMarketSnapshot(), fetchLiaUsdc()])
        if (!c) {
          setSnap(s)
          setLiaUsdc(usdc)
        }
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Erreur chargement')
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const chartData =
    snap?.assets.map(a => ({
      symbol: a.symbol,
      change: Number(a.change24h.toFixed(2)),
    })) || []

  const deploy = liaDeployStatus(liaUsdc ?? 0)

  return (
    <div className="animate-fade-in pb-14 max-w-5xl mx-auto space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Marché
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Analyse
        </h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-xl inline-flex flex-wrap items-center gap-1">
          Indicateurs publics · corr · funding · events · politique LIA
          <InfoTip>
            <strong className="text-white block mb-1">Transparence</strong>
            <span className="text-zinc-400">
              Données ouvertes + agrégats. Vellum secret hors front. Placement LIA si USDC ≥{' '}
              {MIN_USDC_DEPLOY} (exécution Guardian).
            </span>
          </InfoTip>
        </p>
        {snap && (
          <p className="text-[11px] text-zinc-600">
            Maj {new Date(snap.updatedAt).toLocaleString('fr-FR')} · source {snap.source}
          </p>
        )}
      </header>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 h-40 flex items-center justify-center text-sm text-zinc-500">
          Chargement des indicateurs…
        </div>
      )}

      {err && (
        <p className="text-sm text-amber-200 border border-amber-500/30 rounded-xl px-4 py-3">
          {err}
        </p>
      )}

      {snap && !loading && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
                Fear &amp; Greed
              </p>
              <FngGauge value={snap.fearGreed.value} label={snap.fearGreed.classification} />
            </div>

            <div className="sm:col-span-2 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 flex flex-col justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Régime</p>
                <p className="text-2xl font-semibold text-white mt-2 tracking-tight">
                  {snap.regimeLabel}
                </p>
                <p className="text-[13px] text-zinc-500 mt-2 leading-relaxed">
                  Composite sentiment + variation 24h. Pas un signal d’entrée.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-[13px]">
                {snap.btcDominance != null && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">BTC dom.</p>
                    <p className="text-white font-medium tabular-nums">
                      {snap.btcDominance.toFixed(1)}%
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Actifs</p>
                  <p className="text-white font-medium tabular-nums">{snap.assets.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Events</p>
                  <p className="text-white font-medium tabular-nums">{snap.events.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* LIA treasury policy */}
          <section
            className={`rounded-2xl border p-5 space-y-3 ${
              deploy.armed
                ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
                : 'border-amber-500/20 bg-amber-500/[0.03]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                LIA · trésorerie
              </p>
              <span
                className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${
                  deploy.armed
                    ? 'border-emerald-500/40 text-emerald-300'
                    : 'border-amber-500/40 text-amber-200'
                }`}
              >
                {deploy.armed ? 'Armée' : 'En attente'}
              </span>
            </div>
            <p className="text-[13px] text-zinc-300 leading-relaxed">{deploy.message}</p>
            <div className="flex flex-wrap gap-4 text-[12px]">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase">USDC wallet</p>
                <p className="tabular-nums text-white font-medium">
                  {liaUsdc != null ? liaUsdc.toFixed(2) : '—'} / {MIN_USDC_DEPLOY}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-600 uppercase">Adresse</p>
                <a
                  href={LINKS.explorerAccount(LIA_WALLET)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-cyan-300 truncate block max-w-[14rem] text-[11px]"
                >
                  {LIA_WALLET.slice(0, 12)}…
                </a>
              </div>
            </div>
            <ul className="space-y-1.5 pt-1">
              {LIA_CHAIN_PRIORITY.map(c => (
                <li key={c.id} className="text-[12px] text-zinc-400 flex gap-2">
                  <span className="text-zinc-600 shrink-0 w-16 uppercase text-[10px] tracking-wide pt-0.5">
                    {c.status === 'active_policy' ? '1' : c.status === 'next' ? '2' : '3'}
                  </span>
                  <span>
                    <span className="text-zinc-200 font-medium">{c.label}</span>
                    <span className="text-zinc-600"> — {c.notes}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* D Vellum + LIA briefs */}
          <div className="grid sm:grid-cols-2 gap-3">
            <section className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300/80">
                Synthèse LIA
              </p>
              <ul className="space-y-1.5">
                {snap.liaBrief.map((line, i) => (
                  <li key={i} className="text-[13px] text-zinc-300 leading-relaxed flex gap-2">
                    <span className="text-violet-400/60 shrink-0">—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Board Vellum (public)
              </p>
              <ul className="space-y-1.5">
                {snap.vellumBrief.map((line, i) => (
                  <li key={i} className="text-[13px] text-zinc-300 leading-relaxed flex gap-2">
                    <span className="text-zinc-600 shrink-0">—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* B Correlation heatmap */}
          <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-white">Corrélation 7j</h2>
              <p className="text-[11px] text-zinc-600">Pearson · retours journaliers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="text-[12px] mx-auto">
                <thead>
                  <tr>
                    <th className="p-1.5" />
                    {snap.correlation.symbols.map(s => (
                      <th key={s} className="p-1.5 text-zinc-500 font-medium text-center">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snap.correlation.matrix.map((row, i) => (
                    <tr key={snap.correlation.symbols[i]}>
                      <td className="p-1.5 text-zinc-500 font-medium">{snap.correlation.symbols[i]}</td>
                      {row.map((v, j) => (
                        <td key={j} className="p-1">
                          <div
                            className="w-12 h-10 sm:w-14 sm:h-11 rounded-lg flex items-center justify-center tabular-nums text-[11px] font-medium text-zinc-950"
                            style={{ background: corrColor(v) }}
                            title={`${snap.correlation.symbols[i]} / ${snap.correlation.symbols[j]}`}
                          >
                            {v.toFixed(2)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-600 mt-3">
              Corrélation ≠ causalité. Utilisé pour le contexte de régime, pas pour auto-trade.
            </p>
          </section>

          {/* C Funding */}
          <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Funding perp</h2>
              <p className="text-[11px] text-zinc-600">Dernier taux · %</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {snap.funding.map(f => (
                <div
                  key={f.symbol}
                  className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-3 text-center"
                >
                  <p className="text-[11px] text-zinc-500">{f.symbol}</p>
                  <p
                    className={`text-lg font-semibold tabular-nums mt-1 ${
                      f.rate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {f.rate >= 0 ? '+' : ''}
                    {f.rate.toFixed(4)}%
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">{f.source}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 24h chart */}
          <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-white">Variation 24h</h2>
              <p className="text-[11px] text-zinc-600">Majors</p>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <XAxis
                    dataKey="symbol"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#52525b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      background: '#0c0c14',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, '24h']}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
                  <Bar dataKey="change" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={e.change >= 0 ? '#34d399' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Assets */}
          <section className="rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex justify-between">
              <h2 className="text-sm font-semibold text-white">Actifs</h2>
              <span className="text-[11px] text-zinc-600">USD</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-zinc-600 border-b border-white/[0.05]">
                    <th className="px-4 py-2.5 font-medium">Actif</th>
                    <th className="px-4 py-2.5 font-medium text-right">Prix</th>
                    <th className="px-4 py-2.5 font-medium text-right">24h</th>
                    <th className="px-4 py-2.5 font-medium text-right hidden sm:table-cell">Mcap</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.assets.map(a => (
                    <tr
                      key={a.id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-white">{a.symbol}</span>
                        <span className="text-zinc-600 ml-2 text-[12px]">{a.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-200">
                        {formatUsd(a.price)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-medium ${
                          a.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {a.change24h >= 0 ? '+' : ''}
                        {a.change24h.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-500 hidden sm:table-cell">
                        {a.marketCap != null ? formatUsd(a.marketCap) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* E Events */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Events taggés</h2>
            {snap.events.length === 0 ? (
              <p className="text-[13px] text-zinc-500">Aucun événement légal / halt / delist dans le fil.</p>
            ) : (
              <ul className="space-y-2">
                {snap.events.map(ev => (
                  <li key={ev.id}>
                    <a
                      href={ev.url || '#'}
                      target={ev.url ? '_blank' : undefined}
                      rel="noreferrer"
                      className="block rounded-xl border border-white/[0.07] bg-zinc-950/40 px-4 py-3 hover:border-white/15"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                          {ev.kind}
                        </span>
                        <span
                          className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                            ev.severity === 'high'
                              ? 'bg-rose-500/20 text-rose-300'
                              : ev.severity === 'med'
                                ? 'bg-amber-500/20 text-amber-200'
                                : 'bg-zinc-500/20 text-zinc-400'
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-200 leading-snug">{ev.title}</p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* News */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Fil d’actualité</h2>
            <ul className="space-y-2">
              {snap.news.map(n => (
                <li key={n.id}>
                  {n.url ? (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-white/[0.07] bg-zinc-950/40 px-4 py-3 hover:border-white/15 transition-colors"
                    >
                      <p className="text-[13px] text-zinc-200 leading-snug">{n.title}</p>
                      <p className="text-[11px] text-zinc-600 mt-1">
                        {n.source}
                        {n.publishedAt
                          ? ` · ${new Date(n.publishedAt).toLocaleDateString('fr-FR')}`
                          : ''}
                      </p>
                    </a>
                  ) : (
                    <div className="rounded-xl border border-white/[0.07] bg-zinc-950/40 px-4 py-3">
                      <p className="text-[13px] text-zinc-200">{n.title}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Soul Protocol prep */}
          <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">{SOUL_PROTOCOL.label}</h2>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full">
                {SOUL_PROTOCOL.status}
              </span>
            </div>
            <p className="text-[13px] text-zinc-400 leading-relaxed">{SOUL_PROTOCOL.thesis}</p>
            <p className="text-[12px] text-zinc-500">
              LIA : intentions paper <strong className="text-zinc-400">lend / stake $SO</strong> après
              MultiversX et mainnet public. Supply {SOUL_PROTOCOL.tokenomicsPublic.totalSupply.toLocaleString()}{' '}
              · ~{SOUL_PROTOCOL.tokenomicsPublic.circulatingAtTgePct}% au TGE (sources publiques).
            </p>
            <a
              href={SOUL_PROTOCOL.x}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] text-cyan-400/90 hover:underline"
            >
              @0xSoulProtocol ↗
            </a>
          </section>

          <p className="text-[11px] text-zinc-600 leading-relaxed max-w-2xl">
            Pas un conseil en investissement. Pas d’auto-exécution depuis cette page. Placement LIA
            conditionné au seuil USDC et à Guardian / Vellum.
          </p>
        </>
      )}
    </div>
  )
}
