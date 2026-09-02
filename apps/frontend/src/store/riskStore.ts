/**
 * Global Guardian / risk slice — Vite equivalent of Zustand useRiskStore.
 * useSyncExternalStore + bindRiskFromStatus (FAST path JSON).
 */
import { useSyncExternalStore } from 'react'

export type GuardianUiStatus = 'SAFE' | 'WARNING' | 'TRIPPED' | 'KILLED' | 'UNKNOWN'

export type RiskState = {
  status: GuardianUiStatus
  killState: string
  allow: boolean
  reason: string
  currentDrawdown: number | null
  spiralScore: number | null
  effectiveLeverage: number | null
  maxNotional: number | null
  alertMessage: string
  liveTrading: boolean
  mode: string | null
  updatedAt: string | null
}

const initial: RiskState = {
  status: 'UNKNOWN',
  killState: 'ARMED',
  allow: true,
  reason: '—',
  currentDrawdown: null,
  spiralScore: null,
  effectiveLeverage: null,
  maxNotional: null,
  alertMessage: '',
  liveTrading: false,
  mode: null,
  updatedAt: null,
}

let state: RiskState = { ...initial }
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function getRiskState(): RiskState {
  return state
}

export function subscribeRisk(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setRiskState(partial: Partial<RiskState>): void {
  const next = { ...state, ...partial }
  const ks = (next.killState || 'ARMED').toUpperCase()
  if (ks === 'KILLED') next.status = 'KILLED'
  else if (ks === 'TRIPPED') next.status = 'TRIPPED'
  else if (!next.allow) next.status = 'WARNING'
  else next.status = 'SAFE'
  if (next.status === 'KILLED' && !next.alertMessage) {
    next.alertMessage = 'Kill-switch active — production run halted (ops reset only)'
  } else if (next.status === 'TRIPPED' && !next.alertMessage) {
    next.alertMessage = 'Guardian tripped — no new risk'
  } else if (next.status === 'WARNING' && !next.alertMessage) {
    next.alertMessage = next.reason || 'Guardian block'
  } else if (next.status === 'SAFE') {
    next.alertMessage = ''
  }
  state = next
  emit()
}

export function useRiskStore(): RiskState {
  return useSyncExternalStore(subscribeRisk, getRiskState, getRiskState)
}

export function bindRiskFromStatus(doc: {
  updated?: string
  LIA_LIVE_TRADING?: number | string
  orchestrator?: {
    live_trading?: boolean
    mode?: string
    guardian?: {
      allow?: boolean
      reason?: string
      kill_state?: string
      spiral_score?: number
      effective_leverage?: number
      max_notional?: number
    }
    drawdown?: number
  }
} | null): void {
  if (!doc) {
    setRiskState({ status: 'UNKNOWN', alertMessage: 'status unavailable' })
    return
  }
  const g = doc.orchestrator?.guardian
  const live =
    doc.orchestrator?.live_trading === true || String(doc.LIA_LIVE_TRADING ?? '0') === '1'
  setRiskState({
    killState: (g?.kill_state || 'ARMED').toUpperCase(),
    allow: g?.allow !== false,
    reason: g?.reason || 'ok',
    spiralScore: g?.spiral_score ?? null,
    effectiveLeverage: g?.effective_leverage ?? null,
    maxNotional: g?.max_notional ?? null,
    currentDrawdown: doc.orchestrator?.drawdown ?? null,
    liveTrading: live,
    mode: doc.orchestrator?.mode ?? null,
    updatedAt: doc.updated ?? null,
    alertMessage: '',
  })
}
