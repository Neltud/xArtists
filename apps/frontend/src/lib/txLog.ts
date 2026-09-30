/**
 * Transaction failure log — Phase 5 Dust Test diagnostics.
 * In-memory + sessionStorage ring buffer for immediate analysis.
 */

export type TxFailKind =
  | 'gas'
  | 'signature'
  | 'user_reject'
  | 'network'
  | 'contract'
  | 'wallet'
  | 'timeout'
  | 'unknown'

export type TxLogEntry = {
  id: string
  ts: number
  action: string
  kind: TxFailKind
  message: string
  sessionId?: string | null
  explorerHint?: string | null
}

const KEY = 'xartists_tx_log'
const MAX = 40

function classify(message: string): TxFailKind {
  const m = message.toLowerCase()
  if (/gas|insufficient funds|not enough|balance/.test(m)) return 'gas'
  if (/sign|signature|cancelled|canceled|rejected|user denied|abort/.test(m)) return 'signature'
  if (/reject|denied by user/.test(m)) return 'user_reject'
  if (/timeout|45s|network|fetch|cors|failed to fetch/.test(m)) return 'network'
  if (/contract|smart.?contract|execution failed|function not found|payable/.test(m)) return 'contract'
  if (/wallet|xportal|session|connect/.test(m)) return 'wallet'
  if (/timeout/.test(m)) return 'timeout'
  return 'unknown'
}

/** Failures that should trigger Safety Switch → paper */
export function shouldForcePaper(kind: TxFailKind, message: string): boolean {
  if (kind === 'contract' || kind === 'gas') return true
  if (/non.?payable|codehash|wrong chain|invalid receiver/.test(message.toLowerCase())) return true
  return false
}

export function logTxFailure(
  action: string,
  message: string,
  sessionId?: string | null,
): TxLogEntry {
  const kind = classify(message)
  const entry: TxLogEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    action,
    kind,
    message: message.slice(0, 500),
    sessionId: sessionId ?? null,
  }
  try {
    const prev = readTxLog()
    const next = [entry, ...prev].slice(0, MAX)
    sessionStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('xartists:tx-log', { detail: entry }))
  } catch {
    /* */
  }
  return entry
}

export function readTxLog(): TxLogEntry[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export function clearTxLog(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* */
  }
}
