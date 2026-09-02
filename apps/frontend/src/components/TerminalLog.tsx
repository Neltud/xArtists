/**
 * TerminalLog — flux d'événements LIP / Guardian (paper).
 * Écoute CustomEvent `lia-intent` émis par IntentBar.
 */
import { useEffect, useState } from 'react'

type LogLine = {
  ts: string
  level: 'info' | 'ok' | 'warn' | 'err'
  text: string
}

const MAX = 12

export default function TerminalLog({ compact = false }: { compact?: boolean }) {
  const [lines, setLines] = useState<LogLine[]>([
    {
      ts: new Date().toISOString().slice(11, 19),
      level: 'info',
      text: 'LIA Terminal · paper · en attente d’intention (⌘K)',
    },
  ])

  useEffect(() => {
    const onIntent = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as {
        route?: { action?: string; summary?: string }
        lip?: {
          intent_type?: string
          chain?: string
          decimals?: number
          amount_atomic?: string
          reason?: string
        }
        guardian?: { code?: string; allowed?: boolean; message?: string }
      }
      const ts = new Date().toISOString().slice(11, 19)
      const next: LogLine[] = []
      if (detail?.lip) {
        next.push({
          ts,
          level: 'info',
          text: `LIP ${detail.lip.intent_type} · ${detail.lip.chain} · ${detail.lip.decimals}dec · ${detail.lip.reason || ''}`,
        })
      }
      if (detail?.guardian) {
        next.push({
          ts,
          level: detail.guardian.allowed ? 'ok' : 'err',
          text: `Guardian ${detail.guardian.code} — ${detail.guardian.message || ''}`,
        })
      }
      if (detail?.route?.action) {
        next.push({
          ts,
          level: 'ok',
          text: `Route ${detail.route.action} · ${detail.route.summary || ''}`,
        })
      }
      if (next.length) {
        setLines(prev => [...next, ...prev].slice(0, MAX))
      }
    }
    window.addEventListener('lia-intent', onIntent)
    return () => window.removeEventListener('lia-intent', onIntent)
  }, [])

  const color = (l: LogLine['level']) =>
    l === 'ok'
      ? 'text-emerald-400/90'
      : l === 'err'
        ? 'text-rose-400/90'
        : l === 'warn'
          ? 'text-amber-300/90'
          : 'text-zinc-400'

  return (
    <div
      className={`rounded-xl border border-cyan-500/20 bg-black/50 font-mono text-[10px] ${compact ? 'p-2' : 'p-3'}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.15em] text-cyan-500/80">Terminal LIP</span>
        <span className="text-zinc-600">{lines.length} lines</span>
      </div>
      <ul className="space-y-1 max-h-36 overflow-y-auto">
        {lines.map((line, i) => (
          <li key={`${line.ts}-${i}`} className={color(line.level)}>
            <span className="text-zinc-600 mr-2">{line.ts}</span>
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
