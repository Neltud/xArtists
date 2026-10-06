/**
 * TCA access — Pack Pulse = full classroom for 365 days.
 * Read-only; never writes ledger.
 */

export type TcaAccessLevel = 'lobby' | 'full'

export type TcaAccessResult = {
  level: TcaAccessLevel
  reason: string
  expiresAt?: string | null
  features: string[]
}

const PULSE_IDS = new Set(['pulse', 'pack_pulse', 'PULSE', 'pulse-pack'])

/**
 * @param packIds — collection/ticker ids the wallet holds
 * @param activatedAtMs — mint or activation time of the Pulse pack (ms); if omitted, treat as active if held
 */
export function resolveTcaAccess(
  packIds: string[],
  opts?: { activatedAtMs?: number; nowMs?: number },
): TcaAccessResult {
  const now = opts?.nowMs ?? Date.now()
  const held = packIds.some(id => PULSE_IDS.has(id) || id.toLowerCase().includes('pulse'))
  if (!held) {
    return {
      level: 'lobby',
      reason: 'no_pulse_pack',
      features: ['sample_lesson'],
      expiresAt: null,
    }
  }
  const activated = opts?.activatedAtMs
  if (activated != null) {
    const expires = activated + 365 * 24 * 60 * 60 * 1000
    if (now > expires) {
      return {
        level: 'lobby',
        reason: 'pulse_expired',
        features: ['sample_lesson'],
        expiresAt: new Date(expires).toISOString(),
      }
    }
    return {
      level: 'full',
      reason: 'pulse_active',
      features: ['classroom', 'qa_rag', 'hd', 'agenda'],
      expiresAt: new Date(expires).toISOString(),
    }
  }
  // Held but no activation timestamp yet — grant full (ops can tighten later)
  return {
    level: 'full',
    reason: 'pulse_held',
    features: ['classroom', 'qa_rag', 'hd', 'agenda'],
    expiresAt: null,
  }
}
