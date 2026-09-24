import { useEffect, useState } from 'react'

export type Mx8004Reg = {
  mode?: string
  agent_nonce?: number | string | null
  tx_hash?: string | null
  identity_registry?: string | null
  pem_available?: boolean
  note?: string
  agents?: {
    lia?: { mode?: string; agent_nonce?: number | string | null; name?: string }
    grokyversx?: { mode?: string; role?: string }
  }
}

export type Mx8004Jobs = {
  verified_count?: number
  target?: number
  mode?: string
  jobs?: { id: string; title: string; status: string; type?: string }[]
}

export type Mx8004Trust = {
  score?: number
  target?: number
  mode?: string
  path_to_90?: string[]
}

function isLive(j: Mx8004Reg | null): boolean {
  if (!j) return false
  if (j.mode === 'live' && j.agent_nonce) return true
  if (j.tx_hash && j.identity_registry && !String(j.identity_registry).startsWith('(')) return true
  return false
}

const BASE = import.meta.env.BASE_URL || '/'
const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

async function loadJson<T>(name: string): Promise<T | null> {
  const urls = [
    `${BASE}data/${name}?t=${Date.now()}`,
    `data/${name}?t=${Date.now()}`,
    `${RAW}/data/${name}?t=${Date.now()}`,
    `${RAW}/docs/data/${name}?t=${Date.now()}`,
  ]
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' })
      if (!r.ok) continue
      return (await r.json()) as T
    } catch {
      /* next */
    }
  }
  return null
}

export default function useMx8004Registration() {
  const [reg, setReg] = useState<Mx8004Reg | null>(null)
  const [jobs, setJobs] = useState<Mx8004Jobs | null>(null)
  const [trust, setTrust] = useState<Mx8004Trust | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let c = false
    ;(async () => {
      const [r, j, t] = await Promise.all([
        loadJson<Mx8004Reg>('mx8004_registration.json'),
        loadJson<Mx8004Jobs>('mx8004_jobs.json'),
        loadJson<Mx8004Trust>('mx8004_trust.json'),
      ])
      if (!c) {
        setReg(r)
        setJobs(j)
        setTrust(t)
        setLoaded(true)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const live = isLive(reg)
  const jobsOk = (jobs?.verified_count ?? 0) >= (jobs?.target ?? 5)
  const trustOk = (trust?.score ?? 0) > (trust?.target ?? 90)

  return {
    reg,
    jobs,
    trust,
    loaded,
    live,
    jobsOk,
    trustOk,
    criteria: [
      { id: 'mx8004', label: 'MX-8004 registration', ok: live },
      {
        id: 'jobs',
        label: `≥ ${jobs?.target ?? 5} verified jobs`,
        ok: jobsOk,
        detail: jobs ? `${jobs.verified_count ?? 0}/${jobs.target ?? 5} paper` : undefined,
      },
      {
        id: 'trust',
        label: `Trust score > ${trust?.target ?? 90}`,
        ok: trustOk,
        detail: trust?.score != null ? `paper ${trust.score}` : undefined,
      },
    ],
  }
}
