/**
 * Semantic Compiler — LIA / Pulse language → shader uniforms (low overhead).
 * Phase 6 Neural Bridge. Pure functions + lerp; no blocking I/O.
 */

import type { PulseEnvironment } from './pulseDemo'

export type SemanticMood = 'aggressive' | 'nervous' | 'stable' | 'unknown'

export type ShaderUniformsTarget = {
  uSentiment: number
  uVolatility: number
  uPulseSpeed: number
  /** 0xRRGGBB-ish as three floats 0–1 */
  uColor: [number, number, number]
  mood: SemanticMood
  label: string
}

const CYAN_GOLD: [number, number, number] = [0.05, 0.75, 0.85]
const GOLD: [number, number, number] = [0.95, 0.75, 0.25]
const AMBER: [number, number, number] = [0.9, 0.55, 0.12]
const DEEP_BLUE: [number, number, number] = [0.12, 0.22, 0.55]
const ROSE: [number, number, number] = [0.85, 0.18, 0.28]

function clamp(n: number, a = -1, b = 1) {
  return Math.max(a, Math.min(b, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/** Map free text / category heuristics → mood */
export function classifyMood(text: string, sentiment: number): SemanticMood {
  const s = text.toLowerCase()
  if (/aggress|bullish|hype|breakout|moon|surge/.test(s) || sentiment > 0.45) return 'aggressive'
  if (/nervous|uncertain|volatile|fear|crash|risk/.test(s) || sentiment < -0.25) return 'nervous'
  if (/stable|calm|steady|quiet|idle|neutral/.test(s) || Math.abs(sentiment) < 0.15) return 'stable'
  return sentiment >= 0 ? 'aggressive' : 'nervous'
}

/** Compile Pulse env (+ optional LIA phrase) → uniform targets */
export function compileSemantic(
  env: PulseEnvironment,
  liaPhrase?: string | null,
): ShaderUniformsTarget {
  const sentiment = clamp(env.sentiment)
  const intensity =
    env.intensity === 'high' ? 0.85 : env.intensity === 'medium' ? 0.55 : 0.28
  const blob = `${env.category} ${env.vibe} ${env.context || ''} ${liaPhrase || ''}`
  const mood = classifyMood(blob, sentiment)

  let uPulseSpeed = 1.0
  let uVolatility = intensity * 0.6 + Math.abs(sentiment) * 0.35
  let uColor: [number, number, number] = DEEP_BLUE
  let label = env.context || env.category

  switch (mood) {
    case 'aggressive':
      uPulseSpeed = 1.6 + intensity * 1.2
      uVolatility = 0.55 + intensity * 0.4
      uColor = lerp3(CYAN_GOLD, GOLD, Math.max(0, sentiment))
      label = liaPhrase || env.context || 'Bullish pulse'
      break
    case 'nervous':
      uPulseSpeed = 2.2 + intensity * 1.5 // erratic feel via high speed
      uVolatility = 0.7 + intensity * 0.3
      uColor = sentiment < 0 ? lerp3(ROSE, AMBER, intensity) : AMBER
      label = liaPhrase || env.context || 'Nervous market'
      break
    case 'stable':
      uPulseSpeed = 0.55 + intensity * 0.25
      uVolatility = 0.15 + intensity * 0.15
      uColor = DEEP_BLUE
      label = liaPhrase || env.context || 'Stable regime'
      break
    default:
      uColor = lerp3(DEEP_BLUE, CYAN_GOLD, (sentiment + 1) / 2)
  }

  return {
    uSentiment: sentiment,
    uVolatility: clamp(uVolatility, 0, 1),
    uPulseSpeed,
    uColor,
    mood,
    label,
  }
}

/** Organic transition 2–3s toward target (call each frame with dt) */
export function lerpUniforms(
  current: ShaderUniformsTarget,
  target: ShaderUniformsTarget,
  dt: number,
  settleSec = 2.5,
): ShaderUniformsTarget {
  const t = Math.min(1, dt / Math.max(0.05, settleSec / 60)) // per-frame approx when dt~1/60 → full settle ~2.5s
  // better: exponential smooth
  const k = 1 - Math.exp(-dt * (3 / settleSec))
  return {
    uSentiment: lerp(current.uSentiment, target.uSentiment, k),
    uVolatility: lerp(current.uVolatility, target.uVolatility, k),
    uPulseSpeed: lerp(current.uPulseSpeed, target.uPulseSpeed, k),
    uColor: lerp3(current.uColor, target.uColor, k),
    mood: target.mood,
    label: target.label,
  }
}

export function defaultUniforms(): ShaderUniformsTarget {
  return {
    uSentiment: 0,
    uVolatility: 0.25,
    uPulseSpeed: 1,
    uColor: DEEP_BLUE,
    mood: 'stable',
    label: 'Idle',
  }
}
