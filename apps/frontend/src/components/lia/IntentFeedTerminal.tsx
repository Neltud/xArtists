/**
 * Intent Feed — institutional trade log (SHADOW / SIMULATED only).
 * BUY emerald · SELL crimson · INFO slate.
 */
import { useEffect, useState } from 'react'
import { loadIntentFeed, type FeedItem } from '../../lia/intentFeed'
import { asText } from '../../lib/safeRender'

type ShadowLine = {
  id: string
  text: string
  at: number
  side?: string
}

function sideClass(side?: string) {
  const s = (side || '').toUpperCase()
  if (s === 'BUY' || s === 'LONG' || s === 'STAKE' || s === 'COMPOUND') return 'text-emerald-400'
  if (s === 'SELL' || s === 'SHORT' || s === 'FLATTEN') return 'text-rose-400'
  return 'text-sky-400'
}

function sideBadge(side?: string) {
  const s = (side || 'INFO').toUpperCase()
  if (s === 'BUY' || s === 'LONG') return { label: 'BUY', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
  if (s === 'SELL' || s === 'SHORT') return { label: 'SELL', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
  if (s === 'STAKE' || s === 'COMPOUND') return { label: s, cls: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20' }
  return { label: s || 'INFO', cls: 'bg-sky-500/10 text-sky-300 border-sky-500/25' }
}

async function loadServerIntentFeed(): Promise<ShadowLine[]> {
  const bases = [
    `${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}lia_intent_feed.json`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json()
      const items = Array.isArray(j.items) ? j.items : Array.isArray(j) ? j : []
      return items.map(
        (
          x: {
            id?: string
            action?: string
            assetId?: string
            amount?: number
            confidence?: number
            at?: number
          },
          i: number,
        ) => ({
          id: String(x.id || i),
          side: x.action,
          at: typeof x.at === 'number' ? x.at : Date.now() - i * 1000,
          text: `[SIMULATED] ${String(x.action || 'HOLD')} ${String(x.assetId || '?')} · size ${
            x.amount != null ? Number(x.amount).toFixed(2) : '—'
          } · conf ${x.confidence != null ? Number(x.confidence).toFixed(2) : '—'}`,
        }),
      )
    } catch {
      /* */
    }
  }
  return []
}

async function loadShadowLines(): Promise<ShadowLine[]> {
  const bases = [
    `${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}lia_shadow_export.json`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json()
      const last = Array.isArray(j.last_shadow) ? j.last_shadow : []
      return last.map(
        (
          x: { id?: string; side?: string; asset?: string; pnl_usd?: number; ts?: string },
          i: number,
        ) => ({
          id: String(x.id || i),
          side: x.side,
          at: x.ts ? Date.parse(x.ts) || Date.now() : Date.now() - i * 1000,
          text: `[SIMULATED] ${String(x.side || 'HOLD')} ${String(x.asset || '?')} · pnl ${
            x.pnl_usd != null ? Number(x.pnl_usd).toFixed(4) : '—'
          }`,
        }),
      )
    } catch {
      /* */
    }
  }
  return []
}

function formatLocal(f: FeedItem): ShadowLine {
  return {
    id: f.id,
    at: f.at,
    side: f.action,
    text: `[SIMULATED] ${f.action} ${f.assetId} · size ${asText(f.amount)} · conf ${
      Number.isFinite(Number(f.confidence)) ? Number(f.confidence).toFixed(2) : '—'
    }`,
  }
}

export default function IntentFeedTerminal() {
  const [lines, setLines] = useState<ShadowLine[]>([])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      const local = loadIntentFeed(24).map(formatLocal)
      const [server, remote] = await Promise.all([loadServerIntentFeed(), loadShadowLines()])
      const merged = [...server, ...remote, ...local].sort((a, b) => a.at - b.at).slice(-48)
      if (!cancelled) setLines(merged)
    }
    void tick()
    const id = window.setInterval(() => void tick(), 15_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#07070a] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.05]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Intent log
        </p>
        <span className="text-[10px] mono text-zinc-600">[SIMULATED] · paper</span>
      </div>
      <ul className="max-h-48 overflow-y-auto divide-y divide-white/[0.04]">
        {lines
          .slice()
          .reverse()
          .slice(0, 16)
          .map(l => {
            const b = sideBadge(l.side)
            return (
              <li
                key={l.id + String(l.at)}
                className="flex items-start gap-2 px-4 py-2 text-[11px] font-mono"
              >
                <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold ${b.cls}`}>
                  {b.label}
                </span>
                <span className={sideClass(l.side)}>{asText(l.text)}</span>
              </li>
            )
          })}
        {!lines.length && (
          <li className="px-4 py-6 text-[12px] text-zinc-600 text-center">No shadow intents yet</li>
        )}
      </ul>
      <p className="text-[10px] text-zinc-600 px-4 py-2 border-t border-white/[0.04]">
        SHADOW MODE / SIMULATED DATA
      </p>
    </section>
  )
}
