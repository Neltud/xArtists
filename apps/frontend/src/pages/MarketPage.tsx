/**
 * Analyse marché — F&G · TRO hype · LIA · assets.
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
import {
  MIN_USDC_DEPLOY,
  LIA_CHAIN_PRIORITY,
  liaDeployStatus,
} from '../config/liaTreasuryPolicy'
import { SOUL_PROTOCOL } from '../config/soulProtocol'
import { LIA_WALLET, LINKS } from '../config/links'
import TroHypeCard from '../components/market/TroHypeCard'

function FngGauge({ value, label }: { value: number; label: string }) {
  const color =
    value <= 24 ? '#f87171' : value <= 44 ? '#fb923c' : value <= 55 ? '#a1a1aa' : value <= 74 ? '#34d399' : '#22d3ee'
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div
        className="relative h-28 w-28 rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(${color} ${value * 3.6}deg, rgba(255,255,255,0.06) 0)` }}
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
    return Number(j.balance || 0) / 10 ** (j.decimals ?? 6)
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
    snap?.assets.map(a => ({ symbol: a.symbol, change: Number(a.change24h.toFixed(2)) })) || []
  const deploy = liaDeployStatus(liaUsdc ?? 0)

  return (
    <div className="animate-fade-in pb-14 max-w-5xl mx-auto space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Marché</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Analyse</h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-xl inline-flex flex-wrap items-center gap-1">
          Indicateurs publics · TRO hype · LIA
          <InfoTip>
            <strong className="text-white block mb-1">Transparence</strong>
            <span className="text-zinc-400">Données ouvertes. Placement LIA si USDC ≥ {MIN_USDC_DEPLOY}.</span>
          </InfoTip>
        </p>
        {snap && (
          <p className="text-[11px] text-zinc-600">
            Maj {new Date(snap.updatedAt).toLocaleString('fr-FR')} · {snap.source}
          </p>
        )}
      </header>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 h-40 flex items-center justify-center text-sm text-zinc-500">
          Chargement…
        </div>
      )}
      {err && <p className="text-sm text-amber-200 border border-amber-500/30 rounded-xl px-4 py-3">{err}</p>}

      {snap && !loading && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">Fear &amp; Greed</p>
              <FngGauge value={snap.fearGreed.value} label={snap.fearGreed.classification} />
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Régime</p>
              <p className="text-2xl font-semibold text-white mt-2">{snap.regimeLabel}</p>
              <p className="text-[13px] text-zinc-500 mt-2">Composite sentiment + 24h. Pas un signal d&apos;entrée.</p>
            </div>
          </div>

          <TroHypeCard />

          <section
            className={`rounded-2xl border p-5 space-y-3 ${
              deploy.armed ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : 'border-amber-500/20 bg-amber-500/[0.03]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">LIA · trésorerie</p>
              <span
                className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${
                  deploy.armed ? 'border-emerald-500/40 text-emerald-300' : 'border-amber-500/40 text-amber-200'
                }`}
              >
                {deploy.armed ? 'Armée' : 'En attente'}
              </span>
            </div>
            <p className="text-[13px] text-zinc-300">{deploy.message}</p>
            <p className="text-[12px] tabular-nums text-white">
              USDC {liaUsdc != null ? liaUsdc.toFixed(2) : '—'} / {MIN_USDC_DEPLOY}
            </p>
            <ul className="space-y-1">
              {LIA_CHAIN_PRIORITY.map(c => (
                <li key={c.id} className="text-[12px] text-zinc-400">
                  <span className="text-zinc-200 font-medium">{c.label}</span> — {c.notes}
                </li>
              ))}
            </ul>
          </section>

          <div className="grid sm:grid-cols-2 gap-3">
            <section className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300/80">Synthèse LIA</p>
              <ul className="space-y-1.5">
                {snap.liaBrief.map((line, i) => (
                  <li key={i} className="text-[13px] text-zinc-300 flex gap-2">
                    <span className="text-violet-400/60">—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Board Vellum (public)</p>
              <ul className="space-y-1.5">
                {snap.vellumBrief.map((line, i) => (
                  <li key={i} className="text-[13px] text-zinc-300 flex gap-2">
                    <span className="text-zinc-600">—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Variation 24h</h2>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <XAxis dataKey="symbol" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
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

          <section className="rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Actifs</h2>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-zinc-600 border-b border-white/[0.05]">
                  <th className="px-4 py-2.5">Actif</th>
                  <th className="px-4 py-2.5 text-right">Prix</th>
                  <th className="px-4 py-2.5 text-right">24h</th>
                </tr>
              </thead>
              <tbody>
                {snap.assets.map(a => (
                  <tr key={a.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{a.symbol}</span>
                      <span className="text-zinc-600 ml-2 text-[12px]">{a.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{formatUsd(a.price)}</td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-medium ${
                        a.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {a.change24h >= 0 ? '+' : ''}
                      {a.change24h.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">{SOUL_PROTOCOL.label}</h2>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full">
                {SOUL_PROTOCOL.status}
              </span>
            </div>
            <p className="text-[13px] text-zinc-400">{SOUL_PROTOCOL.thesis}</p>
            <a
              href={SOUL_PROTOCOL.x}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] text-cyan-400/90 hover:underline"
            >
              @0xSoulProtocol ↗
            </a>
          </section>

          <p className="text-[11px] text-zinc-600 max-w-2xl">
            Pas un conseil en investissement. Pas d&apos;auto-exécution. Explorer LIA :{' '}
            <a
              href={LINKS.explorerAccount(LIA_WALLET)}
              className="text-zinc-400 hover:text-cyan-300"
              target="_blank"
              rel="noreferrer"
            >
              wallet
            </a>
            .
          </p>
        </>
      )}
    </div>
  )
}
