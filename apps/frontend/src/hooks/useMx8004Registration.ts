import { useEffect, useState } from 'react'

export type Mx8004Reg = {
  mode?: string
  agent_nonce?: number | string
  tx_hash?: string
  identity_registry?: string
  pem_available?: boolean
}

function isLive(j: Mx8004Reg | null): boolean {
  if (!j) return false
  if (j.mode === 'live' && j.agent_nonce) return true
  if (j.tx_hash && j.identity_registry && !String(j.identity_registry).startsWith('('))
    return true
  return false
}

export default function useMx8004Registration() {
  const [reg, setReg] = useState<Mx8004Reg | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let c = false
    const urls = ['data/mx8004_registration.json', '/data/mx8004_registration.json']
    ;(async () => {
      for (const u of urls) {
        try {
          const r = await fetch(u, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as Mx8004Reg
          if (!c) setReg(j)
          break
        } catch {
          /* try next */
        }
      }
      if (!c) setLoaded(true)
    })()
    return () => {
      c = true
    }
  }, [])

  return { reg, loaded, live: isLive(reg) }
}
