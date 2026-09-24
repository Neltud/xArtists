/**
 * Pulse → paramètres musée 3D (CrossScore / sentiment → fog, particules, lumière).
 * Paper-first : cycle démo + optional fetch public/data/pulse_state.json
 */
import { PULSE_DEMO_CYCLE, type PulseEnvironment } from './pulseDemo'

export type MuseumPulseParams = {
  fogDensity: number
  exposure: number
  ambient: number
  particleSpeed: number
  particleSize: number
  accentHex: string
  sentiment: number
  vibe: string
  label: string
}

/** sentiment -1..1 → fog / light / particles */
export function mapPulseToMuseum(env: PulseEnvironment, room: string): MuseumPulseParams {
  const s = Math.max(-1, Math.min(1, env.sentiment))
  const baseFog = room === 'cyber' ? 0.026 : room === 'dark' ? 0.022 : 0.016
  const fogDensity = baseFog * (1.35 - s * 0.45)
  const exposure = (room === 'white' ? 1.15 : room === 'dark' ? 0.85 : 1.05) * (1 + s * 0.18)
  const ambient = (room === 'dark' ? 0.25 : 0.45) * (1 + s * 0.35)
  const particleSpeed = 0.6 + Math.max(0, s) * 1.4 + (env.intensity === 'high' ? 0.5 : 0)
  const particleSize = 0.85 + Math.abs(s) * 0.4
  return {
    fogDensity: Math.max(0.008, Math.min(0.05, fogDensity)),
    exposure: Math.max(0.7, Math.min(1.4, exposure)),
    ambient: Math.max(0.15, Math.min(0.75, ambient)),
    particleSpeed,
    particleSize,
    accentHex: env.color_target || '#a78bfa',
    sentiment: s,
    vibe: env.vibe,
    label: `${env.category} · ${env.context || env.vibe}`,
  }
}

export function pulseFromIndex(i: number, room = 'stone'): MuseumPulseParams {
  const env = PULSE_DEMO_CYCLE[i % PULSE_DEMO_CYCLE.length]
  return mapPulseToMuseum(env, room)
}

/** Optional live JSON from Pages */
export async function fetchPulseState(): Promise<PulseEnvironment | null> {
  try {
    const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/'
    const url = `${base}data/pulse_state.json?t=${Date.now()}`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json()
    if (typeof j.sentiment === 'number') return j as PulseEnvironment
  } catch {
    /* static demo */
  }
  return null
}
