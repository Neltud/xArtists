/**
 * Empire store — wallet, SC flags, TX overlay, Agent IA access, mode lock, TX watchdog.
 * Pattern: useSyncExternalStore (no Zustand).
 */
import { useSyncExternalStore } from 'react'
import {
  getAllScSnapshots,
  type ScSnapshot,
  TRO_TOKEN_ID,
  TRO_STAKING_ADDRESS,
  MARKETPLACE_ADDRESS,
  VENUE_SC_ADDRESS,
  TRO_GOVERNANCE_ADDRESS,
  canStakeTro,
  canListBuyNft,
  canRentVenueOnChain,
  canVoteDao,
} from '../config/scStatus'

export type TxPhase = 'idle' | 'preparing' | 'signing' | 'broadcast' | 'success' | 'error'

export type EmpireTx = {
  phase: TxPhase
  label: string
  sessionId: string | null
  explorerUrl: string | null
  error: string | null
  startedAt: number | null
}

export type EmpireWallet = {
  address: string | null
  connected: boolean
  method: string | null
  egldBalance: string | null
  troBalance: string | null
}

export type EmpireZone = 'museum' | 'command' | 'transition'

export type AgentAccessState = {
  hasAgentAccess: boolean
  packs: Array<'pulse' | 'yield' | 'sentinel'>
  source: 'chain' | 'paper' | 'none'
  updatedAt: number | null
}

/** Audit: lock UI during paper↔live transitions or mid-TX */
export type ModeLock = {
  locked: boolean
  reason: string | null
  until: number | null
}

export type EmpireState = {
  scs: ScSnapshot[]
  wallet: EmpireWallet
  tx: EmpireTx
  pulse: {
    chainId: string
    apiOk: boolean
    lastPingAt: number | null
  }
  flags: {
    canStakeTro: boolean
    canListBuyNft: boolean
    canRentVenue: boolean
    canVoteDao: boolean
  }
  agentAccess: AgentAccessState
  zone: EmpireZone
  audioVolume: number
  modeLock: ModeLock
  troTokenId: string
  addresses: {
    troStaking: string
    marketplace: string
    venue: string
    dao: string
  }
}

const TX_WATCHDOG_MS = 45_000

const initialTx: EmpireTx = {
  phase: 'idle',
  label: '',
  sessionId: null,
  explorerUrl: null,
  error: null,
  startedAt: null,
}

const initialAgent: AgentAccessState = {
  hasAgentAccess: false,
  packs: [],
  source: 'none',
  updatedAt: null,
}

const initial: EmpireState = {
  scs: getAllScSnapshots(),
  wallet: {
    address: null,
    connected: false,
    method: null,
    egldBalance: null,
    troBalance: null,
  },
  tx: { ...initialTx },
  pulse: {
    chainId: '1',
    apiOk: true,
    lastPingAt: null,
  },
  flags: {
    canStakeTro: canStakeTro(),
    canListBuyNft: canListBuyNft(),
    canRentVenue: canRentVenueOnChain(),
    canVoteDao: canVoteDao(),
  },
  agentAccess: { ...initialAgent },
  zone: 'museum',
  audioVolume: 1,
  modeLock: { locked: false, reason: null, until: null },
  troTokenId: TRO_TOKEN_ID,
  addresses: {
    troStaking: TRO_STAKING_ADDRESS,
    marketplace: MARKETPLACE_ADDRESS,
    venue: VENUE_SC_ADDRESS,
    dao: TRO_GOVERNANCE_ADDRESS,
  },
}

let state: EmpireState = { ...initial, scs: getAllScSnapshots() }
const listeners = new Set<() => void>()
let watchdogTimer: ReturnType<typeof setTimeout> | null = null

function emit() {
  listeners.forEach(l => l())
}

function clearWatchdog() {
  if (watchdogTimer != null) {
    clearTimeout(watchdogTimer)
    watchdogTimer = null
  }
}

function armWatchdog() {
  clearWatchdog()
  watchdogTimer = setTimeout(() => {
    const p = state.tx.phase
    if (p === 'preparing' || p === 'signing' || p === 'broadcast') {
      state = {
        ...state,
        tx: {
          ...state.tx,
          phase: 'error',
          error:
            'Timeout 45s — aucune confirmation réseau. Réessaie ou vérifie xPortal / Explorer.',
        },
      }
      emit()
    }
  }, TX_WATCHDOG_MS)
}

export function getEmpireState(): EmpireState {
  return state
}

export function subscribeEmpire(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function patch(partial: Partial<EmpireState>): void {
  state = { ...state, ...partial }
  emit()
}

export function refreshEmpireScs(): void {
  patch({
    scs: getAllScSnapshots(),
    flags: {
      canStakeTro: canStakeTro(),
      canListBuyNft: canListBuyNft(),
      canRentVenue: canRentVenueOnChain(),
      canVoteDao: canVoteDao(),
    },
    addresses: {
      troStaking: TRO_STAKING_ADDRESS,
      marketplace: MARKETPLACE_ADDRESS,
      venue: VENUE_SC_ADDRESS,
      dao: TRO_GOVERNANCE_ADDRESS,
    },
  })
}

export function setEmpireWallet(w: Partial<EmpireWallet>): void {
  state = { ...state, wallet: { ...state.wallet, ...w } }
  emit()
}

export function setEmpirePulse(p: Partial<EmpireState['pulse']>): void {
  state = { ...state, pulse: { ...state.pulse, ...p } }
  emit()
}

export function setAgentAccess(a: Partial<AgentAccessState>): void {
  state = {
    ...state,
    agentAccess: {
      ...state.agentAccess,
      ...a,
      updatedAt: Date.now(),
    },
  }
  emit()
}

export function setEmpireZone(zone: EmpireZone): void {
  const audioVolume = zone === 'command' ? 0.2 : zone === 'transition' ? 0.5 : 1
  state = { ...state, zone, audioVolume }
  emit()
}

export function setEmpireAudioVolume(v: number): void {
  state = { ...state, audioVolume: Math.max(0, Math.min(1, v)) }
  emit()
}

/** Lock mode switches during TX or explicit paper↔live transition */
export function setModeLock(locked: boolean, reason?: string, ms = 8_000): void {
  const until = locked ? Date.now() + ms : null
  state = {
    ...state,
    modeLock: {
      locked,
      reason: locked ? reason || 'Transition en cours' : null,
      until,
    },
  }
  emit()
  if (locked && until) {
    setTimeout(() => {
      if (state.modeLock.until && Date.now() >= state.modeLock.until) {
        state = {
          ...state,
          modeLock: { locked: false, reason: null, until: null },
        }
        emit()
      }
    }, ms + 50)
  }
}

export function isModeLocked(): boolean {
  if (!state.modeLock.locked) return false
  if (state.modeLock.until && Date.now() > state.modeLock.until) {
    state = {
      ...state,
      modeLock: { locked: false, reason: null, until: null },
    }
    return false
  }
  return true
}

export function empireTxStart(label: string): void {
  if (isModeLocked() && state.tx.phase !== 'idle') {
    /* still allow start if lock expired mid-way */
  }
  state = {
    ...state,
    tx: {
      phase: 'preparing',
      label,
      sessionId: null,
      explorerUrl: null,
      error: null,
      startedAt: Date.now(),
    },
  }
  emit()
  armWatchdog()
}

export function empireTxSigning(): void {
  if (state.tx.phase === 'idle') return
  state = { ...state, tx: { ...state.tx, phase: 'signing' } }
  emit()
  armWatchdog()
}

export function empireTxBroadcast(sessionId?: string): void {
  state = {
    ...state,
    tx: {
      ...state.tx,
      phase: 'broadcast',
      sessionId: sessionId ?? state.tx.sessionId,
    },
  }
  emit()
  armWatchdog()
}

export function empireTxSuccess(sessionId?: string, explorerUrl?: string): void {
  clearWatchdog()
  state = {
    ...state,
    tx: {
      ...state.tx,
      phase: 'success',
      sessionId: sessionId ?? state.tx.sessionId,
      explorerUrl: explorerUrl ?? null,
    },
  }
  emit()
}

export function empireTxError(error: string): void {
  clearWatchdog()
  state = {
    ...state,
    tx: { ...state.tx, phase: 'error', error },
  }
  emit()
}

export function empireTxClear(): void {
  clearWatchdog()
  state = { ...state, tx: { ...initialTx } }
  emit()
}

export function useEmpireStore(): EmpireState {
  return useSyncExternalStore(subscribeEmpire, getEmpireState, getEmpireState)
}

export function useEmpireTx(): EmpireTx {
  return useSyncExternalStore(
    subscribeEmpire,
    () => getEmpireState().tx,
    () => getEmpireState().tx,
  )
}

export function useEmpireWallet(): EmpireWallet {
  return useSyncExternalStore(
    subscribeEmpire,
    () => getEmpireState().wallet,
    () => getEmpireState().wallet,
  )
}

export function useEmpireFlags() {
  return useSyncExternalStore(
    subscribeEmpire,
    () => getEmpireState().flags,
    () => getEmpireState().flags,
  )
}

export function useAgentAccess(): AgentAccessState {
  return useSyncExternalStore(
    subscribeEmpire,
    () => getEmpireState().agentAccess,
    () => getEmpireState().agentAccess,
  )
}

export function useModeLock(): ModeLock {
  return useSyncExternalStore(
    subscribeEmpire,
    () => getEmpireState().modeLock,
    () => getEmpireState().modeLock,
  )
}
