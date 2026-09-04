/**
 * Analyse de marché — sprint A : F&G · assets · régime · news · brief LIA public.
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
  type MarketSnapshot,
} from '../lib/marketData'

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

export default function MarketPage() {
  const [snap, setSnap] = useState<MarketSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const s = await loadMarketSnapshot()
        if (!c) setSnap(s)
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
          Indicateurs publics · synthèse LIA limitée
          <InfoTip>
            <strong className="text-white block mb-1">Transparence</strong>
            <span className="text-zinc-400">
              Fear &amp; Greed, prix et news viennent d’APIs ouvertes. Les modèles Vellum restent
              côté serveur — ici uniquement des agrégats.
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
          {/* Top row: F&G + regime */}
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
                  Lecture composite (sentiment + variation moyenne 24h des actifs suivis). Pas un
                  signal d’entrée.
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
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">News</p>
                  <p className="text-white font-medium tabular-nums">{snap.news.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Brief LIA */}
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

          {/* 24h changes chart */}
          <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-white">Variation 24h</h2>
              <p className="text-[11px] text-zinc-600">Majors suivis</p>
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

          {/* Assets table */}
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
                      <p className="text-[11px] text-zinc-600 mt-1">{n.source}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[11px] text-zinc-600 leading-relaxed max-w-2xl">
            Pas un conseil en investissement. Données tierces susceptibles d’être retardées ou
            incomplètes. Corrélation ≠ causalité — sprints suivants : matrice, funding, events.
          </p>
        </>
      )}
    </div>
  )
}
