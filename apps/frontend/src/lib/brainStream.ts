/**
 * Pipeline Cerveau → Corps (diagramme Neltud)
 *
 * [Monde réel / Grok] → [LIA décision] → [orchestrateur] → flux → [UI / shaders CSS]
 *
 * Sans FastAPI/Akash : bus local + poll optionnel VITE_BRAIN_WS / VITE_BRAIN_HTTP.
 * Avec backend : WebSocket JSON { mood, score, source, note }.
 */

export type BrainMood = 'neutral' | 'hype' | 'crash' | 'calm' | 'alert'

export type BrainPulse = {
  mood: BrainMood
  /** -1..1 sentiment */
  score: number
  source: 'local' | 'grok' | 'lia' | 'ws' | 'http'
  note: string
  at: number
}

const listeners = new Set<(p: BrainPulse) => void>()
let current: BrainPulse = {
  mood: 'neutral',
  score: 0,
  source: 'local',
  note: 'boot',
  at: Date.now(),
}

export function getBrainPulse(): BrainPulse {
  return current
}

export function subscribeBrain(cb: (p: BrainPulse) => void): () => void {
  listeners.add(cb)
  cb(current)
  return () => listeners.delete(cb)
}

export function publishBrain(partial: Partial<BrainPulse> & { mood?: BrainMood }): void {
  current = {
    ...current,
    ...partial,
    mood: partial.mood ?? current.mood,
    score: partial.score ?? current.score,
    source: partial.source ?? current.source,
    note: partial.note ?? current.note,
    at: Date.now(),
  }
  listeners.forEach(l => l(current))
  try {
    window.dispatchEvent(new CustomEvent('xartists-brain', { detail: current }))
  } catch {
    /* ssr */
  }
}

/** Map score → mood */
export function scoreToMood(score: number): BrainMood {
  if (score >= 0.45) return 'hype'
  if (score <= -0.45) return 'crash'
  if (score >= 0.15) return 'calm'
  if (score <= -0.15) return 'alert'
  return 'neutral'
}

/** CSS vars for ArtAtelierBackdrop / room shaders-lite */
export function moodCssVars(p: BrainPulse): Record<string, string> {
  switch (p.mood) {
    case 'hype':
      return {
        '--brain-glow': 'rgba(52, 211, 153, 0.35)',
        '--brain-tint': 'rgba(16, 185, 129, 0.12)',
        '--brain-orb': '#34d399',
        '--brain-speed': '0.7s',
      }
    case 'crash':
      return {
        '--brain-glow': 'rgba(248, 113, 113, 0.4)',
        '--brain-tint': 'rgba(185, 28, 28, 0.14)',
        '--brain-orb': '#f87171',
        '--brain-speed': '1.4s',
      }
    case 'alert':
      return {
        '--brain-glow': 'rgba(251, 191, 36, 0.35)',
        '--brain-tint': 'rgba(180, 83, 9, 0.12)',
        '--brain-orb': '#fbbf24',
        '--brain-speed': '0.9s',
      }
    case 'calm':
      return {
        '--brain-glow': 'rgba(56, 189, 248, 0.28)',
        '--brain-tint': 'rgba(14, 116, 144, 0.1)',
        '--brain-orb': '#38bdf8',
        '--brain-speed': '2s',
      }
    default:
      return {
        '--brain-glow': 'rgba(167, 139, 250, 0.22)',
        '--brain-tint': 'rgba(76, 29, 149, 0.08)',
        '--brain-orb': '#a78bfa',
        '--brain-speed': '1.6s',
      }
  }
}

/** Paper brain tick — simule Grok sentiment jusqu au vrai orchestrateur */
export function startLocalBrainSimulator(intervalMs = 18_000): () => void {
  const tick = () => {
    // Walk random walk
    const next = Math.max(-1, Math.min(1, current.score + (Math.random() - 0.5) * 0.35))
    const mood = scoreToMood(next)
    publishBrain({
      mood,
      score: next,
      source: 'local',
      note: mood === 'hype' ? 'paper hype' : mood === 'crash' ? 'paper risk-off' : 'paper neutral',
    })
  }
  tick()
  const id = window.setInterval(tick, intervalMs)
  return () => window.clearInterval(id)
}

/** Optional: connect FastAPI / Akash WebSocket */
export function connectBrainWebSocket(url: string): () => void {
  let ws: WebSocket | null = null
  let closed = false
  try {
    ws = new WebSocket(url)
    ws.onmessage = ev => {
      try {
        const j = JSON.parse(String(ev.data)) as Partial<BrainPulse>
        const score = typeof j.score === 'number' ? j.score : current.score
        publishBrain({
          mood: j.mood || scoreToMood(score),
          score,
          source: 'ws',
          note: j.note || 'ws pulse',
        })
      } catch {
        /* ignore */
      }
    }
    ws.onerror = () => {
      /* fall back local */
    }
  } catch {
    /* no ws */
  }
  return () => {
    closed = true
    try {
      ws?.close()
    } catch {
      /* */
    }
    void closed
  }
}

export async function fetchBrainHttp(url: string): Promise<void> {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) return
    const j = (await r.json()) as Partial<BrainPulse>
    const score = typeof j.score === 'number' ? j.score : 0
    publishBrain({
      mood: j.mood || scoreToMood(score),
      score,
      source: 'http',
      note: j.note || 'http pulse',
    })
  } catch {
    /* offline */
  }
}
