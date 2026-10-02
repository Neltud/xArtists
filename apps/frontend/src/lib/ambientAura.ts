/**
 * Ambient Intelligence — state → aura (no new Redux).
 * Source: Pulse + LIA uniforms already compiled.
 */
import type { ShaderUniformsTarget, SemanticMood } from './semanticCompiler'

export type AuraMode = 'bull' | 'bear' | 'reward' | 'stable'

export type AmbientSnapshot = {
  mode: AuraMode
  trend: 'UP' | 'DOWN' | 'STABLE'
  volatility: number
  confidence: number
  label: string
  paper: true
}

/** Map semantic uniforms → 4 aura modes */
export function resolveAuraMode(
  u: Pick<ShaderUniformsTarget, 'uSentiment' | 'uVolatility' | 'mood'>,
  opts?: { rewardFlash?: boolean },
): AuraMode {
  if (opts?.rewardFlash) return 'reward'
  if (u.mood === 'aggressive' || u.uSentiment > 0.28) return 'bull'
  if (u.mood === 'nervous' || u.uSentiment < -0.2) return 'bear'
  if (u.mood === 'stable' || Math.abs(u.uSentiment) < 0.12) return 'stable'
  return u.uSentiment >= 0 ? 'bull' : 'bear'
}

export function trendFromSentiment(s: number): 'UP' | 'DOWN' | 'STABLE' {
  if (s > 0.2) return 'UP'
  if (s < -0.2) return 'DOWN'
  return 'STABLE'
}

export function toAmbientSnapshot(
  u: ShaderUniformsTarget,
  confidence = 0.5,
  rewardFlash = false,
): AmbientSnapshot {
  const mode = resolveAuraMode(u, { rewardFlash })
  return {
    mode,
    trend: trendFromSentiment(u.uSentiment),
    volatility: u.uVolatility,
    confidence,
    label: u.label,
    paper: true,
  }
}

/** CSS class tokens for AgentNftOrb */
export const AURA_ORB: Record<
  AuraMode,
  { ring: string; glow: string; pulse: string; label: string }
> = {
  bull: {
    ring: 'border-emerald-400/55 shadow-[0_0_48px_-6px_rgba(52,211,153,0.7)]',
    glow: 'from-emerald-400/50 via-emerald-300/15 to-transparent',
    pulse: 'xartists-aura-bull',
    label: 'BULL',
  },
  bear: {
    ring: 'border-rose-500/55 shadow-[0_0_36px_-6px_rgba(244,63,94,0.65)]',
    glow: 'from-rose-600/45 via-rose-400/10 to-transparent',
    pulse: 'xartists-aura-bear',
    label: 'BEAR',
  },
  reward: {
    ring: 'border-amber-300/70 shadow-[0_0_56px_-4px_rgba(251,191,36,0.85)]',
    glow: 'from-amber-300/60 via-yellow-200/20 to-transparent',
    pulse: 'xartists-aura-reward',
    label: 'REWARD',
  },
  stable: {
    ring: 'border-cyan-400/40 shadow-[0_0_32px_-8px_rgba(34,211,238,0.45)]',
    glow: 'from-cyan-500/30 via-sky-300/10 to-transparent',
    pulse: 'xartists-aura-stable',
    label: 'STABLE',
  },
}

export function shortTrendToast(mode: AuraMode, agent = 'Agent'): string {
  switch (mode) {
    case 'bull':
      return `🟢 ${agent} · bullish`
    case 'bear':
      return `🔴 ${agent} · risk-off`
    case 'reward':
      return `🟡 ${agent} · flash paper`
    default:
      return `🔵 ${agent} · stable`
  }
}

export type TapeLine = {
  id: string
  ts: number
  kind: 'arb' | 'signal' | 'claim' | 'pulse'
  text: string
  paper: true
}

/** Synthetic paper tape from ambient (no fake profit claims) */
export function paperTapeLine(snap: AmbientSnapshot, seq: number): TapeLine {
  const kinds: TapeLine['kind'][] = ['arb', 'signal', 'pulse']
  const kind = kinds[seq % kinds.length]
  const texts: Record<TapeLine['kind'], string> = {
    arb: `scan · ${snap.trend} · vol ${(snap.volatility * 100).toFixed(0)}%`,
    signal: `signal · ${snap.mode} · conf ${(snap.confidence * 100).toFixed(0)}%`,
    claim: `claim window · paper only`,
    pulse: `pulse · ${snap.label.slice(0, 40)}`,
  }
  return {
    id: `t${seq}-${snap.mode}`,
    ts: Date.now(),
    kind,
    text: texts[kind],
    paper: true,
  }
}

export type { SemanticMood }
