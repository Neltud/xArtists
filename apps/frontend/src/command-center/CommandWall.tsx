import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Hub LIA — panneau de contrôle (sérieux).
 * Indicateurs nommés · data live (prix) · mode paper explicite.
 * Plus de mur « hologramme gadget » : grille sobre aux tokens du site.
 */
import { useEffect, useMemo, useState } from 'react'
import LivePriceRail from './LivePriceRail'

type Props = {
  sentiment?: number
  volatility?: number
  interactive?: boolean
  pulseSpeed?: number
  color?: [number, number, number]
  colorRgb?: [number, number, number]
  room?: 'hub' | 'pulse' | 'yield' | 'sentinel'
  paper?: boolean
}

type LiaSnap = {
  ts?: string
  paper?: boolean
  LIA_LIVE_TRADING?: number | string
  onchain?: {
    egld?: number
    egld_usd?: number
    tokens?: Array<{ ticker?: string; balance?: number }>
  }
  risk?: { halt?: boolean; regime?: string }
  signal?: { mode?: string; confidence?: number }
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function fmtNum(n: number | undefined, d = 2) {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { maximumFractionDigits: d })
}

/** Indicateurs techniques affichés — mapping explicite produit. */
const INDICATORS = {
  pulse: {
    title: 'PULSE · Flux',
    items: [
      { key: 'intent_rate', label: 'Débit intentions', unit: 'evt/cycle', hint: 'Volume d’intents paper traités sur le dernier cycle LIA' },
      { key: 'latency', label: 'Latence signal', unit: 'ms', hint: 'Délai agrégation pulse (WS/HTTP/démo)' },
      { key: 'sentiment', label: 'Sentiment', unit: '−1…+1', hint: 'Score directionnel normalisé (pas un conseil)' },
    ],
  },
  yield: {
    title: 'YIELD · Rendement',
    items: [
      { key: 'vol', label: 'Volatilité', unit: 'σ', hint: 'Amplitude relative proxy (0–1) du moteur pulse' },
      { key: 'apr_est', label: 'APR est.', unit: '%', hint: 'Estimation illustrative — non garantie' },
      { key: 'depth', label: 'Profondeur', unit: 'idx', hint: 'Proxy liquidité relative (paper)' },
    ],
  },
  sentinel: {
    title: 'SENTINEL · Risque',
    items: [
      { key: 'halt', label: 'Circuit breaker', unit: 'on/off', hint: 'Halt risque si état corrompu ou règle Guardian' },
      { key: 'regime', label: 'Régime', unit: '', hint: 'Régime marché déclaré (paper/live status)' },
      { key: 'confidence', label: 'Confiance', unit: '%', hint: 'Confiance signal agrégé LIA' },
    ],
  },
} as const

export default function CommandWall({
  sentiment = 0,
  volatility = 0.35,
  room = 'hub',
  paper = true,
}: Props) {
  xaUsePhraseLocale()
  const [snap, setSnap] = useState<LiaSnap | null>(null)
  const [src, setSrc] = useState<'lia_status' | 'fallback'>('fallback')

  useEffect(() => {
    let cancelled = false
    const base = import.meta.env.BASE_URL || '/'
    ;(async () => {
      try {
        const r = await fetch(`${base}data/lia_status.json`, { cache: 'no-store' })
        if (!r.ok) return
        const j = (await r.json()) as LiaSnap
        if (cancelled) return
        setSnap(j)
        setSrc('lia_status')
      } catch {
        /* keep fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const s = clamp01((sentiment + 1) / 2)
  const v = clamp01(volatility)
  const isPaper = paper || snap?.paper !== false || String(snap?.LIA_LIVE_TRADING ?? '0') === '0'

  const egld = snap?.onchain?.egld
  const egldUsd = snap?.onchain?.egld_usd
  const tro = snap?.onchain?.tokens?.find(t => (t.ticker || '').toUpperCase() === 'TRO')?.balance
  const halt = Boolean(snap?.risk?.halt)
  const regime = snap?.risk?.regime || snap?.signal?.mode || (isPaper ? 'paper' : '—')
  const conf = snap?.signal?.confidence

  const bars = useMemo(() => {
    const base = [0.35, 0.42, 0.28, 0.55, 0.48, 0.38, 0.62, 0.44, 0.31, 0.5, 0.4, 0.36]
    return base.map((b, i) => clamp01(b * (0.7 + v * 0.6) * (0.85 + (i % 3) * 0.05 * s)))
  }, [s, v])

  const focus =
    room === 'pulse' ? INDICATORS.pulse : room === 'yield' ? INDICATORS.yield : room === 'sentinel' ? INDICATORS.sentinel : null

  return (
    <div className="xa-command-wall overflow-hidden rounded-2xl border border-[color:var(--xa-border,#27272a)] bg-[color:var(--xa-bg-elevated,#0c0c0e)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--xa-accent,#bef264)]">
            {xaLocalize('Hub LIA · salle de contrôle')}
          </p>
          <p className="text-[11px] text-zinc-500">
            {xaLocalize('Indicateurs techniques labellisés · pas un hologramme décoratif')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              isPaper
                ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {xaRender(isPaper ? 'paper' : 'live')}
          </span>
          <span className="text-[10px] tabular-nums text-zinc-600">
            {xaRender(src === 'lia_status' ? 'lia_status' : 'fallback')}
            {xaRender(snap?.ts ? ` · ${snap.ts}` : '')}
          </span>
        </div>
      </div>

      <div className="border-b border-white/5 px-2 py-1.5">
        <LivePriceRail />
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <Kpi label="EGLD wallet" value={fmtNum(egld, 4)} sub={egldUsd != null ? `≈ ${fmtNum(egldUsd, 2)} $` : '—'} />
        <Kpi label="TRO" value={fmtNum(tro, 2)} sub="balance on-chain" />
        <Kpi label="Sentiment" value={fmtNum(sentiment, 2)} sub="−1 … +1" />
        <Kpi label="Volatilité σ" value={fmtNum(volatility, 2)} sub="proxy pulse 0–1" />
      </div>

      <div className="px-3 pb-2">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            {xaLocalize('Profil volume (proxy)')}
          </p>
          <p className="text-[10px] text-zinc-600">{xaLocalize('dérivé sentiment × σ — non aléatoire')}</p>
        </div>
        <div className="flex h-16 items-end gap-1 rounded-xl border border-white/5 bg-black/40 px-2 py-1.5">
          {xaRender(
            bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-[color:var(--xa-accent,#bef264)]/80"
                style={{ height: `${Math.max(8, h * 100)}%`, opacity: 0.45 + h * 0.55 }}
                title={`bin ${i + 1}`}
              />
            )),
          )}
        </div>
      </div>

      <div className="grid gap-2 p-3 pt-0 sm:grid-cols-3">
        {xaRender(
          (Object.keys(INDICATORS) as Array<keyof typeof INDICATORS>).map(id => {
            const block = INDICATORS[id]
            const active = room === 'hub' || room === id
            return (
              <div
                key={id}
                className={`rounded-xl border px-3 py-2.5 ${
                  active
                    ? 'border-[color:var(--xa-border-strong,#3f3f46)] bg-white/[0.03]'
                    : 'border-white/5 bg-black/20 opacity-70'
                }`}
              >
                <p className="text-[11px] font-semibold tracking-wide text-zinc-200">{xaRender(block.title)}</p>
                <ul className="mt-2 space-y-1.5">
                  {xaRender(
                    block.items.map(it => (
                      <li key={it.key} className="text-[11px] leading-snug">
                        <span className="text-zinc-300">{xaRender(it.label)}</span>
                        <span className="text-zinc-600"> · {xaRender(it.unit)}</span>
                        <span className="mt-0.5 block text-[10px] text-zinc-500">{xaRender(it.hint)}</span>
                      </li>
                    )),
                  )}
                </ul>
                {id === 'sentinel' && (
                  <p className="mt-2 text-[11px] tabular-nums text-zinc-400">
                    halt={xaRender(halt ? 'ON' : 'off')} · régime={xaRender(regime)}
                    {conf != null ? ` · conf ${Math.round(clamp01(conf) * 100)}%` : ''}
                  </p>
                )}
                {id === 'pulse' && (
                  <p className="mt-2 text-[11px] tabular-nums text-zinc-400">
                    sentiment={xaRender(fmtNum(sentiment, 2))} · σ={xaRender(fmtNum(volatility, 2))}
                  </p>
                )}
                {id === 'yield' && (
                  <p className="mt-2 text-[11px] tabular-nums text-zinc-400">
                    profondeur idx={xaRender(fmtNum(0.4 + v * 0.5, 2))} · APR est. n/a paper
                  </p>
                )}
              </div>
            )
          }),
        )}
      </div>

      {focus && (
        <div className="border-t border-white/5 px-3 py-2 text-[11px] text-zinc-500">
          {xaLocalize('Salle active :')} <span className="text-zinc-300">{xaRender(focus.title)}</span>
          {' — '}
          {xaLocalize('les valeurs chiffrées viennent de lia_status + pulse ; le profil volume est un proxy déterministe, pas un ordre.')}
        </div>
      )}

      {!focus && (
        <div className="border-t border-white/5 px-3 py-2 text-[11px] text-zinc-500">
          {xaLocalize('Ouvre Pulse · Yield · Sentinel pour le détail salle. Aucune TX automatique (LIA live = 0).')}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{xaRender(label)}</p>
      <p className="mt-0.5 font-mono text-[15px] tabular-nums text-[color:var(--xa-text,#fafafa)]">{xaRender(value)}</p>
      <p className="text-[10px] text-zinc-600">{xaRender(sub)}</p>
    </div>
  )
}
