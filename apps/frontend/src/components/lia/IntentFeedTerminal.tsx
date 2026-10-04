/**
 * Intent Feed — cyberpunk terminal of SHADOW / SIMULATED decisions (MOD-V1.2).
 * Never implies live execution.
 */
import { useEffect, useMemo, useState } from 'react'
import { loadIntentFeed, type FeedItem } from '../../lia/intentFeed'
import { asText } from '../../lib/safeRender'

type ShadowLine = {
  id: string
  text: string
  at: number
  side?: string
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
          } USD · SHADOW`,
        }),
      )
    } catch {
      /* */
    }
  }
  return []
}

function formatLocal(f: FeedItem): ShadowLine {
  const conf = Number(f.confidence)
  return {
    id: f.id,
    at: f.at,
    side: f.action,
    text: `[SIMULATED] ${f.action} ${f.assetId} @ size ${asText(f.amount)} | Conf: ${
      Number.isFinite(conf) ? conf.toFixed(2) : '—'
    } · ${asText(f.strategy)} · SHADOW`,
  }
}

export default function IntentFeedTerminal() {
  const [lines, setLines] = useState<ShadowLine[]>([])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      const local = loadIntentFeed(24).map(formatLocal)
      const remote = await loadShadowLines()
      const merged = [...remote, ...local].sort((a, b) => a.at - b.at).slice(-36)
      if (!cancelled) setLines(merged)
    }
    void tick()
    const id = window.setInterval(() => void tick(), 15_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const scrollText = useMemo(() => {
    if (!lines.length) {
      return '> SHADOW IDLE · waiting for decision cycle · LIA_LIVE_TRADING=0'
    }
    return lines.map(l => l.text).join('   ‖   ')
  }, [lines])

  return (
    <section className="card overflow-hidden border border-emerald-500/25 bg-black/80">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-emerald-500/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
          Intent Feed · SHADOW
        </p>
        <span className="text-[10px] text-emerald-600 mono">SIMULATED ONLY</span>
      </div>
      <div className="relative h-28 overflow-hidden font-mono text-[11px] leading-relaxed">
        <div
          className="absolute whitespace-nowrap text-emerald-300/90 px-3 py-2"
          style={{ animation: 'intent-ticker 48s linear infinite' }}
        >
          {scrollText}&nbsp;&nbsp;&nbsp;{scrollText}
        </div>
        <ul className="absolute inset-0 overflow-y-auto px-3 py-2 space-y-1 text-emerald-200/80 bg-gradient-to-b from-black/20 to-black/80">
          {lines
            .slice()
            .reverse()
            .slice(0, 12)
            .map(l => (
              <li key={l.id + l.at} className="border-b border-emerald-500/10 pb-0.5">
                <span className="text-emerald-600">{'>'}</span> {asText(l.text)}
              </li>
            ))}
          {!lines.length && (
            <li className="text-emerald-700">
              <span className="text-emerald-600">{'>'}</span> no shadow intents yet — refresh hub
            </li>
          )}
        </ul>
      </div>
      <style>{`
        @keyframes intent-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
