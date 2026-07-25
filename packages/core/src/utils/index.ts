/**
 * @xartists/core — Shared utility functions
 */

// ─── Address helpers ─────────────────────────────────────────────────────────

/** Shorten a bech32 MultiversX address for display. Returns '—' if the address is too short. */
export function shortAddress(addr: string, prefixLen = 6, suffixLen = 4): string {
  if (!addr || addr.length < prefixLen + suffixLen + 3) return '—'
  return `${addr.slice(0, prefixLen)}...${addr.slice(-suffixLen)}`
}

/** Return the MultiversX explorer URL for an account. */
export function explorerAccountUrl(addr: string): string {
  return `https://explorer.multiversx.com/accounts/${addr}`
}

/** Return the MultiversX explorer URL for a token. */
export function explorerTokenUrl(tokenId: string): string {
  return `https://explorer.multiversx.com/tokens/${tokenId}`
}

// ─── Token formatting ────────────────────────────────────────────────────────

/** Convert raw ESDT balance (18 decimals) to a human-readable decimal string. */
export function fromWei(raw: string | number, decimals = 18): string {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || isNaN(raw)) return '0'
    const result = raw / Math.pow(10, decimals)
    // toFixed(6) on 0 produces "0.000000" → replace strips to "" → || '0' catches the empty string case
    return result.toFixed(6).replace(/\.?0+$/, '') || '0'
  }
  const str = raw.trim()
  if (!str || str === '0') return '0'
  try {
    const bigVal = BigInt(str)
    const divisor = BigInt(10) ** BigInt(decimals)
    const intPart = bigVal / divisor
    const fracPart = bigVal % divisor
    if (fracPart === BigInt(0)) return intPart.toString()
    const fracStr = fracPart.toString().padStart(decimals, '0').replace(/0+$/, '')
    return fracStr ? `${intPart}.${fracStr}` : intPart.toString()
  } catch {
    return '0'
  }
}

/** Format a USD value with a dollar sign and max 2 decimal places. */
export function formatUsd(value: number, maxDecimals = 2): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals })}`
}

/** Format a small price (like $TRO) with up to 8 significant decimal places. */
export function formatTokenPrice(value: number): string {
  if (value === 0) return '$0'
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(8)}`
}

// ─── Health factor ───────────────────────────────────────────────────────────

export type HFLevel = 'safe' | 'warning' | 'danger' | 'na'

/** Classify a Hatom Health Factor value. */
export function classifyHF(hf: number): HFLevel {
  if (hf >= 999) return 'na'
  if (hf > 2) return 'safe'
  if (hf > 1.5) return 'warning'
  return 'danger'
}

/** Tailwind color class for a health factor level. */
export function hfColor(hf: number): string {
  const level = classifyHF(hf)
  return level === 'safe' ? 'text-green-400' : level === 'warning' ? 'text-orange-400' : level === 'danger' ? 'text-red-400' : 'text-gray-400'
}

// ─── Guard status ────────────────────────────────────────────────────────────

export type GuardStatus = 'OK' | 'WARNING' | 'BLOCKED'

/** Tailwind color class for a BalanceGuard status string. */
export function guardColor(status: string): string {
  if (status === 'OK') return 'text-green-400'
  if (status === 'WARNING') return 'text-orange-400'
  return 'text-red-400'
}

// ─── Fear & Greed ────────────────────────────────────────────────────────────

/** Tailwind color class for a Fear & Greed index value (0–100). */
export function fgColor(value: number): string {
  if (value <= 25) return 'text-red-400'
  if (value <= 50) return 'text-orange-400'
  if (value <= 75) return 'text-yellow-400'
  return 'text-green-400'
}

// ─── Data freshness ──────────────────────────────────────────────────────────

/** How old (ms) remote data can be before showing a stale warning (2 hours). */
export const STALE_DATA_THRESHOLD_MS = 2 * 60 * 60 * 1000

/** Return true if `timestamp` ISO string is older than `maxAgeMs` milliseconds. */
export function isDataStale(timestamp: string | null | undefined, maxAgeMs = STALE_DATA_THRESHOLD_MS): boolean {
  if (!timestamp) return true
  try {
    const age = Date.now() - new Date(timestamp).getTime()
    return age > maxAgeMs
  } catch {
    return true
  }
}

// ─── Progress ────────────────────────────────────────────────────────────────

/** Logarithmic progress from a startValue toward a targetValue (returns 0–100). */
export function logProgress(current: number, start: number, target: number): number {
  if (current <= start) return 0
  return Math.min(100, (Math.log(current / start) / Math.log(target / start)) * 100)
}
