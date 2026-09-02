/** SLOW PATH — desk / cognitive decisions. Poll 60s. Isolated from fast path. */
import { useEffect, useState } from 'react'

export type DeskRole = { role: string; stance: string; score: number; note?: string }
export type DeskPayload = {
  action?: string
  confidence?: number
  net_score?: number
  risk_veto?: boolean
  agreement?: number
  rationale?: string
  roles?: DeskRole[]
  paper?: boolean
}

const BASE = import.meta.env.BASE_URL

export function useLiaSlowPath() {
  const [desk, setDesk] = useState<DeskPayload | null>(null)
  const [fuseSrc, setFuseSrc] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        let deskObj: DeskPayload | null = null
        let fuse: string | null = null
        const r1 = await fetch(`${BASE}data/desk_last.json?t=${Date.now()}`, { cache: 'no-store' })
        if (r1.ok) {
          const j = await r1.json()
          deskObj = (j?.desk as DeskPayload) || null
          fuse = j?.fuse?.source || null
        }
        if (!deskObj) {
          const r2 = await fetch(`${BASE}data/vellum_last_run.json?t=${Date.now()}`, {
            cache: 'no-store',
          })
          if (r2.ok) {
            const j = await r2.json()
            deskObj = (j?.desk as DeskPayload) || null
            fuse = j?.fuse?.source || null
          }
        }
        if (!cancelled) {
          setDesk(deskObj)
          setFuseSrc(fuse)
          setUpdatedAt(new Date().toISOString())
          if (!deskObj) setErr('no desk payload')
          else setErr(null)
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'desk unavailable')
      }
    }
    run()
    const id = window.setInterval(run, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return { desk, fuseSrc, err, updatedAt }
}
