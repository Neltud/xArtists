import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Cockpit holographique packs / LIA — signaux + intents LIVE xPortal (v0.110).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LIA_BADGE, LIA_LIVE_TRADING } from '../../config/liaConfig'
import { LIA_WALLET } from '../../context/WalletContext'
import IntentXPortalPanel from '../../command-center/IntentXPortalPanel'

type SignalSide = 'BUY' | 'SELL' | 'HOLD'
type LiaSignal = {
  asset: string
  side: SignalSide
  target?: number
  confidence: number
  model: 'Grok' | 'Gemini' | 'LIA'
  note: string
}

type Tick = { symbol: string; price: number; changePct: number }
type NewsItem = { title: string; impact: number; source: string; ts: number }

const GOV_SPLIT = [
  { label: 'Artistes', pct: 45, color: 'bg-amber-400' },
  { label: 'Protocole', pct: 25, color: 'bg-violet-400' },
  { label: 'Trésorerie', pct: 15, color: 'bg-cyan-400' },
  { label: 'Signaux', pct: 10, color: 'bg-emerald-400' },
  { label: 'Buffer', pct: 5, color: 'bg-zinc-400' },
] as const

const API =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_MVX_API?: string } }).env?.VITE_MVX_API) ||
  'https://api.multiversx.com'

async function fetchEgldUsd(): Promise<number> {
  try {
    const r = await fetch(`${String(API).replace(/\/$/, '')}/economics`, { cache: 'no-store' })
    if (!r.ok) return 0
    const j = await r.json()
    return Number(j.price || j.egldPrice || 0) || 0
  } catch {
    return 0
  }
}

async function fetchJsonData<T>(name: string): Promise<T | null> {
  const bases = [
    `${(typeof import.meta !== 'undefined' && (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL) || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}${name}`, { cache: 'no-store' })
      if (!r.ok) continue
      return (await r.json()) as T
    } catch {
      /* */
    }
  }
  return null
}

function sideColor(s: SignalSide): string {
  if (s === 'BUY') return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
  if (s === 'SELL') return 'text-rose-300 border-rose-500/40 bg-rose-500/10'
  return 'text-zinc-300 border-white/15 bg-white/5'
}

function impactColor(n: number): string {
  if (n >= 40) return 'text-emerald-300'
  if (n <= -40) return 'text-rose-300'
  return 'text-zinc-400'
}

type Props = {
  packId?: string
  compact?: boolean
  className?: string
  /** Affiche le panel intents xPortal (défaut true) */
  showIntents?: boolean
}

export default function Pack3DCockpit({ packId, compact, className = '', showIntents = true }: Props) {
  const [ticks, setTicks] = useState<Tick[]>([])
  const [signals, setSignals] = useState<LiaSignal[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [fearGreed, setFearGreed] = useState(50)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [egld, daily, liveNews, fusion] = await Promise.all([
        fetchEgldUsd(),
        fetchJsonData<{ signal?: string; confidence?: number; asset?: string }>('signals/daily_signal.json'),
        fetchJsonData<
          | { items?: { title?: string; source?: string; impact?: number; ts?: number }[] }
          | { title?: string }[]
        >('live_news.json'),
        fetchJsonData<{ score?: number; mood?: string }>('lia_signal_fusion.json'),
      ])

      const troApprox = egld > 0 ? egld * 0.002 : 0
      setTicks([
        { symbol: 'EGLD', price: egld, changePct: 0 },
        { symbol: 'TRO*', price: troApprox, changePct: 0 },
        { symbol: 'USDC', price: 1, changePct: 0 },
      ])

      const conf = typeof daily?.confidence === 'number' ? daily.confidence : 0.55
      const sideRaw = String(daily?.signal || 'HOLD').toUpperCase()
      const side: SignalSide =
        sideRaw.includes('BUY') || sideRaw.includes('LONG')
          ? 'BUY'
          : sideRaw.includes('SELL') || sideRaw.includes('SHORT')
            ? 'SELL'
            : 'HOLD'
      const asset = daily?.asset || 'EGLD'
      setSignals([
        {
          asset,
          side,
          confidence: conf,
          model: 'LIA',
          note: LIA_LIVE_TRADING ? 'Signal journalier · live user-sign' : 'Signal journalier · paper',
          target: egld > 0 ? egld * (side === 'BUY' ? 1.04 : side === 'SELL' ? 0.96 : 1) : undefined,
        },
        {
          asset: 'EGLD',
          side: conf > 0.6 ? 'BUY' : conf < 0.4 ? 'SELL' : 'HOLD',
          confidence: Math.min(0.92, conf + 0.08),
          model: 'Grok',
          note: 'Consensus shadow · non-custodial',
        },
        {
          asset: 'EGLD',
          side: 'HOLD',
          confidence: 0.5,
          model: 'Gemini',
          note: 'Audit architecture · pas d\'ordre auto',
        },
      ])

      const fg =
        typeof fusion?.score === 'number'
          ? Math.round(fusion.score)
          : 48 + Math.round((conf - 0.5) * 40)
      setFearGreed(Math.max(0, Math.min(100, fg)))

      let items: NewsItem[] = []
      if (Array.isArray(liveNews)) {
        items = liveNews.slice(0, 6).map((n, i) => ({
          title:
            typeof n === 'object' && n && 'title' in n
              ? String((n as { title?: string }).title || 'News')
              : 'News',
          impact:
            typeof n === 'object' && n && 'impact' in n
              ? Number((n as { impact?: number }).impact) || 0
              : 0,
          source:
            typeof n === 'object' && n && 'source' in n
              ? String((n as { source?: string }).source || 'feed')
              : 'feed',
          ts: Date.now() - i * 60_000,
        }))
      } else if (liveNews && Array.isArray((liveNews as { items?: unknown[] }).items)) {
        items = (
          liveNews as { items: { title?: string; impact?: number; source?: string; ts?: number }[] }
        ).items.slice(0, 6).map((n, i) => ({
          title: String(n.title || 'News'),
          impact: Number(n.impact) || 0,
          source: String(n.source || 'feed'),
          ts: Number(n.ts) || Date.now() - i * 60_000,
        }))
      }
      if (!items.length) {
        items = [
          {
            title: 'MultiversX network stable · Supernova cadence',
            impact: 12,
            source: 'mvx',
            ts: Date.now(),
          },
          {
            title: LIA_LIVE_TRADING
              ? 'xArtists LIVE bootstrap · 0.001 EGLD xPortal'
              : 'xArtists packs · paper-first agent desk',
            impact: 8,
            source: 'xartists',
            ts: Date.now(),
          },
        ]
      }
      setNews(items)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 45_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const consensus = useMemo(() => {
    if (!signals.length) return 'HOLD' as SignalSide
    const score = signals.reduce(
      (a, s) => a + (s.side === 'BUY' ? 1 : s.side === 'SELL' ? -1 : 0) * s.confidence,
      0,
    )
    if (score > 0.35) return 'BUY' as SignalSide
    if (score < -0.35) return 'SELL' as SignalSide
    return 'HOLD' as SignalSide
  }, [signals])

  return (
    <div className={`space-y-4 ${className}`}>
      <section className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#06080f] via-[#0a0c18] to-[#0c101c] shadow-[0_0_48px_-12px_rgba(34,211,238,0.35)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />
        <div className="relative space-y-4 p-4 sm:p-5">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
                {xaRender("Cockpit · signaux LIA ")}</p>
              <h3 className="text-sm font-semibold text-white">
                {xaRender(packId ? `Pack ${packId}` : 'Console centrale')} ·{xaRender(' ')}
                {xaRender(LIA_LIVE_TRADING ? 'LIVE user-sign' : 'paper-first')}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-100 max-w-[14rem] leading-snug">
                {xaRender(LIA_BADGE)}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${sideColor(consensus)}`}
              >
                {xaRender("Consensus ")}{xaRender(consensus)}
              </span>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-zinc-400 hover:text-white min-h-[36px]"
              >
                {xaRender(loading ? 'Sync…' : 'Refresh')}
              </button>
            </div>
          </header>

          {xaRender(LIA_LIVE_TRADING && (
            <p className="text-[10px] mono text-zinc-500 break-all">
              {xaRender("LIA ops · ")}{xaRender(LIA_WALLET.slice(0, 18))}…{xaRender(LIA_WALLET.slice(-6))} {xaRender(" · bootstrap 0.001 EGLD → treasury ")}</p>
          ))}

          <div className="grid grid-cols-3 gap-2">
            {xaRender(ticks.map(t => (
              <div
                key={t.symbol}
                className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-2 backdrop-blur-sm"
              >
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">{xaRender(t.symbol)}</p>
                <p className="font-mono text-sm text-white tabular-nums">
                  {xaRender(t.price > 0 ? (t.price >= 1 ? t.price.toFixed(2) : t.price.toFixed(5)) : '—')}
                </p>
              </div>
            )))}
          </div>

          {xaRender(!compact && (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-white/10 bg-black/35 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {xaRender("Moteur multi-modèles ")}</p>
                <ul className="space-y-2">
                  {xaRender(signals.map((s, i) => (
                    <li
                      key={`${s.model}-${i}`}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2 text-[12px]"
                    >
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${sideColor(s.side)}`}
                      >
                        {xaRender(s.side)}
                      </span>
                      <span className="font-medium text-zinc-200">{xaRender(s.asset)}</span>
                      <span className="text-[10px] text-violet-300/90">{xaRender(s.model)}</span>
                      <span className="ml-auto font-mono text-[11px] text-zinc-400">
                        {xaRender((s.confidence * 100).toFixed(0))}%
                        {xaRender(s.target != null ? ` · tgt ${s.target.toFixed(2)}` : '')}
                      </span>
                      <p className="w-full text-[11px] text-zinc-500">{xaRender(s.note)}</p>
                    </li>
                  )))}
                </ul>
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {xaRender("Sentiment · Fear & Greed ")}</p>
                <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                    style={{ width: `${fearGreed}%` }}
                  />
                </div>
                <p className="font-mono text-lg text-white tabular-nums">
                  {xaRender(fearGreed)}
                  <span className="text-xs text-zinc-500"> / 100</span>
                </p>
                <p className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {xaRender("News · impact NLP ")}</p>
                <ul className="max-h-36 space-y-1.5 overflow-y-auto">
                  {xaRender(news.map((n, i) => (
                    <li key={i} className="flex gap-2 text-[11px] leading-snug">
                      <span className={`shrink-0 font-mono tabular-nums ${impactColor(n.impact)}`}>
                        {xaRender(n.impact > 0 ? '+' : '')}
                        {xaRender(n.impact)}
                      </span>
                      <span className="text-zinc-300">{xaRender(n.title)}</span>
                    </li>
                  )))}
                </ul>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {xaRender("Répartition gouvernance DAO (cible) ")}</p>
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {xaRender(GOV_SPLIT.map(g => (
                <div
                  key={g.label}
                  className={g.color}
                  style={{ width: `${g.pct}%` }}
                  title={`${g.label} ${g.pct}%`}
                />
              )))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
              {xaRender(GOV_SPLIT.map(g => (
                <span key={g.label}>
                  <span className="text-zinc-300">{xaRender(g.pct)}%</span> {xaRender(g.label)}
                </span>
              )))}
            </div>
          </div>
        </div>
      </section>

      {xaRender(showIntents && <IntentXPortalPanel />)}
    </div>
  )
}
