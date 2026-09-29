/**
 * MULTIVERSX → SDK/API → empireStore → feedback visuel
 * Lecture RPC (api.multiversx.com) — pas de PEM.
 */
import {
  TRO_STAKING_ADDRESS,
  MARKETPLACE_ADDRESS,
  SLOT_CASINO_ADDRESS,
  VENUE_SC_ADDRESS,
  TRO_TOKEN_ID,
} from '../config/scStatus'
import { setEmpirePulse, getEmpireState } from '../store/empireStore'
import { publishBrain, scoreToMood } from './brainStream'

const API = 'https://api.multiversx.com'

export type ChainObjectState = {
  key: string
  address: string
  codeHash: string | null
  balanceEgld: number
  live: boolean
  label: string
  /** 0..1 visual intensity from activity */
  intensity: number
}

export type ChainMirrorSnapshot = {
  at: number
  apiOk: boolean
  objects: ChainObjectState[]
  troTotalStaked: number
}

let last: ChainMirrorSnapshot = {
  at: 0,
  apiOk: true,
  objects: [],
  troTotalStaked: 0,
}
const listeners = new Set<(s: ChainMirrorSnapshot) => void>()

export function getChainMirror(): ChainMirrorSnapshot {
  return last
}

export function subscribeChainMirror(cb: (s: ChainMirrorSnapshot) => void): () => void {
  listeners.add(cb)
  cb(last)
  return () => listeners.delete(cb)
}

function emit(s: ChainMirrorSnapshot) {
  last = s
  listeners.forEach(l => l(s))
}

async function fetchAccount(addr: string): Promise<{ codeHash: string | null; balance: number }> {
  try {
    const r = await fetch(`${API}/accounts/${addr}`)
    if (!r.ok) return { codeHash: null, balance: 0 }
    const j = await r.json()
    const bal = Number(j.balance || 0) / 1e18
    return { codeHash: j.codeHash || null, balance: bal }
  } catch {
    return { codeHash: null, balance: 0 }
  }
}

async function queryTotalStaked(addr: string): Promise<number> {
  try {
    const body = JSON.stringify({ scAddress: addr, funcName: 'getTotalStaked', args: [] })
    const r = await fetch(`${API}/vm-values/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (!r.ok) return 0
    const j = await r.json()
    const raw = j?.data?.data?.returnData?.[0]
    if (!raw) return 0
    const bin = atob(raw)
    let n = 0
    for (let i = 0; i < bin.length; i++) n = n * 256 + bin.charCodeAt(i)
    return n
  } catch {
    return 0
  }
}

const TARGETS: { key: string; address: string; label: string }[] = [
  { key: 'tro_staking', address: TRO_STAKING_ADDRESS, label: 'TRO Stake' },
  { key: 'marketplace', address: MARKETPLACE_ADDRESS, label: 'Market' },
  { key: 'venue', address: VENUE_SC_ADDRESS, label: 'Venue' },
  { key: 'slot', address: SLOT_CASINO_ADDRESS, label: 'Slot' },
]

export async function refreshChainMirror(): Promise<ChainMirrorSnapshot> {
  const objects: ChainObjectState[] = []
  let apiOk = true
  for (const t of TARGETS) {
    if (!t.address?.startsWith('erd1')) continue
    const acc = await fetchAccount(t.address)
    if (!acc.codeHash && acc.balance === 0) apiOk = apiOk && true
    objects.push({
      key: t.key,
      address: t.address,
      codeHash: acc.codeHash,
      balanceEgld: acc.balance,
      live: !!acc.codeHash,
      label: t.label,
      intensity: acc.codeHash ? Math.min(1, 0.35 + Math.log10(1 + acc.balance) * 0.15) : 0.1,
    })
  }
  const troTotalStaked = await queryTotalStaked(TRO_STAKING_ADDRESS)
  const snap: ChainMirrorSnapshot = {
    at: Date.now(),
    apiOk,
    objects,
    troTotalStaked,
  }
  emit(snap)
  setEmpirePulse({ apiOk: true, lastPingAt: Date.now(), chainId: '1' })

  // Cerveau: activity from total staked + live SC count
  const liveN = objects.filter(o => o.live).length
  const score = Math.max(-0.2, Math.min(0.85, (liveN / 4) * 0.5 + (troTotalStaked > 0 ? 0.25 : 0)))
  publishBrain({
    mood: scoreToMood(score),
    score,
    source: 'lia',
    note: `chain mirror · ${liveN}/4 SC · stake ${troTotalStaked} ${TRO_TOKEN_ID}`,
  })
  return snap
}

export function startChainMirror(intervalMs = 45_000): () => void {
  void refreshChainMirror()
  const id = window.setInterval(() => void refreshChainMirror(), intervalMs)
  return () => window.clearInterval(id)
}

/** Debug helper — current empire flags */
export function empireFlagsSnapshot() {
  return getEmpireState().flags
}
