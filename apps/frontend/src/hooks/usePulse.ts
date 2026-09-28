/**
 * Source unique Pulse — WS live si VITE_PULSE_API, sinon cycle démo.
 * Diffuse `xartists:pulse` pour musée / strips / 8008.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { PULSE_DEMO_CYCLE, type PulseEnvironment } from '../lib/pulseDemo'

export type PulseSource = 'ws' | 'http' | 'demo'

const DEMO_MS = 8000

function apiBase(): string {
  const v = (import.meta as { env?: { VITE_PULSE_API?: string } }).env?.VITE_PULSE_API
  return (v || '').replace(/\/$/, '')
}

function isPulseEnv(x: unknown): x is PulseEnvironment {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.sentiment === 'number' && typeof o.category === 'string'
}

function broadcast(env: PulseEnvironment, source: PulseSource) {
  if (typeof window === 'undefined') return
  ;(window as unknown as { __XARTISTS_PULSE__?: PulseEnvironment }).__XARTISTS_PULSE__ = env
  window.dispatchEvent(
    new CustomEvent('xartists:pulse', { detail: { env, source, ts: Date.now() } }),
  )
}

export function usePulse() {
  const [env, setEnv] = useState<PulseEnvironment>(PULSE_DEMO_CYCLE[0])
  const [source, setSource] = useState<PulseSource>('demo')
  const [connected, setConnected] = useState(false)
  const idx = useRef(0)
  const wsRef = useRef<WebSocket | null>(null)

  const apply = useCallback((next: PulseEnvironment, src: PulseSource) => {
    setEnv(next)
    setSource(src)
    broadcast(next, src)
  }, [])

  useEffect(() => {
    const base = apiBase()
    let cancelled = false
    let demoTimer: number | undefined
    let httpTimer: number | undefined

    const startDemo = () => {
      setConnected(false)
      apply(PULSE_DEMO_CYCLE[idx.current % PULSE_DEMO_CYCLE.length], 'demo')
      demoTimer = window.setInterval(() => {
        idx.current += 1
        apply(PULSE_DEMO_CYCLE[idx.current % PULSE_DEMO_CYCLE.length], 'demo')
      }, DEMO_MS)
    }

    if (!base) {
      startDemo()
      return () => {
        if (demoTimer) window.clearInterval(demoTimer)
      }
    }

    const httpUrl = `${base}/pulse`
    const wsUrl = base.replace(/^http/, 'ws') + '/ws/pulse'

    const pollHttp = async () => {
      try {
        const r = await fetch(httpUrl, { cache: 'no-store' })
        if (!r.ok) throw new Error('http')
        const j = await r.json()
        if (!cancelled && isPulseEnv(j)) {
          apply(j, 'http')
          setConnected(true)
        }
      } catch {
        if (!cancelled) setConnected(false)
      }
    }

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => {
        if (!cancelled) setConnected(true)
      }
      ws.onmessage = ev => {
        try {
          const j = JSON.parse(String(ev.data))
          if (!cancelled && isPulseEnv(j)) apply(j, 'ws')
        } catch {
          /* ignore */
        }
      }
      ws.onerror = () => {
        try {
          ws.close()
        } catch {
          /* */
        }
      }
      ws.onclose = () => {
        if (cancelled) return
        setConnected(false)
        void pollHttp()
        httpTimer = window.setInterval(() => void pollHttp(), DEMO_MS)
      }
    } catch {
      startDemo()
    }

    // seed immédiat HTTP
    void pollHttp()

    return () => {
      cancelled = true
      if (demoTimer) window.clearInterval(demoTimer)
      if (httpTimer) window.clearInterval(httpTimer)
      try {
        wsRef.current?.close()
      } catch {
        /* */
      }
    }
  }, [apply])

  return { env, source, connected, apiBase: apiBase() }
}

/** Subscribe without React (musée Three.js) */
export function onPulse(
  cb: (env: PulseEnvironment, source: PulseSource) => void,
): () => void {
  const handler = (e: Event) => {
    const d = (e as CustomEvent).detail as { env: PulseEnvironment; source: PulseSource }
    if (d?.env) cb(d.env, d.source)
  }
  window.addEventListener('xartists:pulse', handler)
  const cur = (window as unknown as { __XARTISTS_PULSE__?: PulseEnvironment }).__XARTISTS_PULSE__
  if (cur) cb(cur, 'demo')
  return () => window.removeEventListener('xartists:pulse', handler)
}
