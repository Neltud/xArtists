/**
 * FAST PATH status poll — guardian / live flag / agent action.
 * Adaptive interval; AbortController; no LLM payloads.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export type GuardianSnap = {
  allow?: boolean
  reason?: string
  max_notional?: number
  spiral_score?: number
  effective_leverage?: number
  kill_state?: string
  var_usd?: number
}

export type FastPathDoc = {
  updated?: string
  LIA_LIVE_TRADING?: number | string
  orchestrator?: {
    live_trading?: boolean
    agent_action?: string
    mode?: string
    guardian?: GuardianSnap
    equity_usd?: number
    drawdown?: number
  }
  market?: { guard_status?: string }
}

const CANDIDATES = [
  `${import.meta.env.BASE_URL}data/lia_v6_status.json`,
  'data/lia_v6_status.json',
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_v6_status.json',
]

function intervalMs(doc: FastPathDoc | null, err: boolean): number {
  if (err) return 15_000
  const ks = doc?.orchestrator?.guardian?.kill_state?.toUpperCase()
  if (ks === 'KILLED' || ks === 'TRIPPED') return 3_000
  return 5_000
}

export function useLiaFastPath() {
  const [doc, setDoc] = useState<FastPathDoc | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const prevKill = useRef<string | undefined>(undefined)
  const [killAlert, setKillAlert] = useState<string | null>(null)

  const load = useCallback(async (signal: AbortSignal) => {
    const t = Date.now()
    for (const base of CANDIDATES) {
      try {
        const url = base.includes('?') ? base : `${base}?t=${t}`
        const r = await fetch(url, { cache: 'no-store', signal })
        if (!r.ok) continue
        const j = (await r.json()) as FastPathDoc
        setDoc(j)
        setErr(null)
        const ks = j?.orchestrator?.guardian?.kill_state
        if (ks && prevKill.current && prevKill.current === 'ARMED' && ks !== 'ARMED') {
          setKillAlert(ks)
        }
        if (ks) prevKill.current = ks
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    setErr('status unavailable')
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    load(ac.signal)
    const id = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => {
      ac.abort()
      clearInterval(id)
    }
  }, [load])

  useEffect(() => {
    const ac = new AbortController()
    const ms = intervalMs(doc, !!err)
    const id = window.setTimeout(() => load(ac.signal), ms)
    return () => {
      ac.abort()
      clearTimeout(id)
    }
  }, [doc, err, load, tick])

  const g = doc?.orchestrator?.guardian
  const live =
    doc?.orchestrator?.live_trading === true || String(doc?.LIA_LIVE_TRADING ?? '0') === '1'

  return {
    doc,
    err,
    guardian: g,
    live,
    killState: (g?.kill_state || 'ARMED').toUpperCase(),
    killAlert,
    clearKillAlert: () => setKillAlert(null),
    mode: doc?.orchestrator?.mode,
    agentAction: doc?.orchestrator?.agent_action,
    equityUsd: doc?.orchestrator?.equity_usd,
    drawdown: doc?.orchestrator?.drawdown,
    updated: doc?.updated,
  }
}
