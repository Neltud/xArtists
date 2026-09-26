/**
 * Pulse → paramètres musée 3D (plus lumineux par défaut pour lisibilité mobile).
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

/** sentiment -1..1 → fog / light / particles — plafonds relevés pour voir les tableaux */
export function mapPulseToMuseum(env: PulseEnvironment, room: string): MuseumPulseParams {
  const s = Math.max(-1, Math.min(1, env.sentiment))
  const baseFog = room === 'cyber' ? 0.014 : room === 'dark' ? 0.012 : 0.009
  const fogDensity = baseFog * (1.2 - s * 0.35)
  const exposure = (room === 'white' ? 1.25 : room === 'dark' ? 1.05 : 1.2) * (1 + s * 0.12)
  const ambient = (room === 'dark' ? 0.55 : 0.72) * (1 + s * 0.2)
  const particleSpeed = 0.6 + Math.max(0, s) * 1.4 + (env.intensity === 'high' ? 0.5 : 0)
  const particleSize = 0.85 + Math.abs(s) * 0.4
  return {
    fogDensity: Math.max(0.004, Math.min(0.028, fogDensity)),
    exposure: Math.max(0.95, Math.min(1.55, exposure)),
    ambient: Math.max(0.45, Math.min(1.05, ambient)),
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
