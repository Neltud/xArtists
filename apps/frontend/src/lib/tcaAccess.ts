/**
 * TCA Pulse Pack gatekeeper — FULL | SAMPLE | NONE
 * Air-gap: read-only ownership; never mints or writes ledger.
 */

export type TcaAccessStatus = 'FULL' | 'SAMPLE' | 'NONE'

export type TcaAccessResult = {
  hasAccess: boolean
  status: TcaAccessStatus
  reason: string
  expiryDate: string | null
  features: string[]
  sampleLessonId: string
  packId: string
}

const PULSE_ALIASES = new Set([
  'pulse',
  'pack_pulse',
  'pulse_pack',
  'pulse_pack_v1',
  'pulse-pack',
  'PULSE',
])

const MS_DAY = 24 * 60 * 60 * 1000
const DURATION_DAYS = 365
const SAMPLE_LESSON_ID = 'sample_01'
const PACK_ID = 'pulse_pack_v1'

function isPulseId(id: string): boolean {
  const x = id.trim()
  if (PULSE_ALIASES.has(x) || PULSE_ALIASES.has(x.toLowerCase())) return true
  return x.toLowerCase().includes('pulse')
}

/**
 * Resolve access from pack holdings (from index / NFT inventory — not from TCA writes).
 */
export function resolveTcaAccess(
  packIds: string[],
  opts?: { activatedAtMs?: number | null; nowMs?: number; forceLobby?: boolean },
): TcaAccessResult {
  const now = opts?.nowMs ?? Date.now()
  const base = {
    sampleLessonId: SAMPLE_LESSON_ID,
    packId: PACK_ID,
  }

  if (opts?.forceLobby) {
    return {
      ...base,
      hasAccess: false,
      status: 'NONE',
      reason: 'lobby_only',
      expiryDate: null,
      features: ['gallery_info'],
    }
  }

  const held = (packIds || []).some(isPulseId)
  if (!held) {
    return {
      ...base,
      hasAccess: false,
      status: 'SAMPLE',
      reason: 'no_pulse_pack',
      expiryDate: null,
      features: ['sample_lesson'],
    }
  }

  const activated = opts?.activatedAtMs
  if (activated != null && activated > 0) {
    const expires = activated + DURATION_DAYS * MS_DAY
    if (now > expires) {
      return {
        ...base,
        hasAccess: false,
        status: 'SAMPLE',
        reason: 'pulse_expired',
        expiryDate: new Date(expires).toISOString(),
        features: ['sample_lesson'],
      }
    }
    return {
      ...base,
      hasAccess: true,
      status: 'FULL',
      reason: 'pulse_active',
      expiryDate: new Date(expires).toISOString(),
      features: ['classroom', 'qa_rag', 'hd', 'agenda', 'unlimited_qa'],
    }
  }

  // Held, activation timestamp not yet indexed → treat as FULL (tighten when mint index ready)
  return {
    ...base,
    hasAccess: true,
    status: 'FULL',
    reason: 'pulse_held',
    expiryDate: null,
    features: ['classroom', 'qa_rag', 'hd', 'agenda', 'unlimited_qa'],
  }
}

/**
 * Async helper: given a wallet bech32, resolve packs from public index when available.
 * Currently uses optional prefetched packIds; chain query is plugged by callers (WalletContext).
 * Never triggers mint.
 */
export async function resolveTcaAccessForWallet(
  _walletAddress: string | null | undefined,
  prefetched?: { packIds?: string[]; activatedAtMs?: number | null },
): Promise<TcaAccessResult> {
  if (!_walletAddress) {
    return resolveTcaAccess([], { forceLobby: false })
  }
  return resolveTcaAccess(prefetched?.packIds || [], {
    activatedAtMs: prefetched?.activatedAtMs,
  })
}
