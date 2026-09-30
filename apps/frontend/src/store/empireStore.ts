/**
 * Empire store — wallet, SC flags, TX overlay, Agent IA access (Command Center gate).
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

/** Zone audio / immersion — Museum public vs Command Center holder */
export type EmpireZone = 'museum' | 'command' | 'transition'

export type AgentAccessState = {
  /** True if ≥1 Agent IA pack (on-chain or paper device) */
  hasAgentAccess: boolean
  packs: Array<'pulse' | 'yield' | 'sentinel'>
  source: 'chain' | 'paper' | 'none'
  updatedAt: number | null
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
  troTokenId: string
  addresses: {
    troStaking: string
    marketplace: string
    venue: string
    dao: string
  }
}

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

function emit() {
  listeners.forEach(l => l())
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

export function empireTxStart(label: string): void {
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
}

export function empireTxSigning(): void {
  if (state.tx.phase === 'idle') return
  state = { ...state, tx: { ...state.tx, phase: 'signing' } }
  emit()
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
}

export function empireTxSuccess(sessionId?: string, explorerUrl?: string): void {
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
  state = {
    ...state,
    tx: { ...state.tx, phase: 'error', error },
  }
  emit()
}

export function empireTxClear(): void {
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
