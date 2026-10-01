/**
 * Map route → empire zone (music volume + ambiance).
 * /slot → casino volume (not full command mute).
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setEmpireZone, type EmpireZone } from '../store/empireStore'

function zoneFromPath(path: string): EmpireZone {
  const p = path.replace(/\/$/, '') || '/'
  if (p.startsWith('/command') || p.startsWith('/trading') || p.startsWith('/my-packs')) {
    return 'command'
  }
  if (p.startsWith('/slot') || p.startsWith('/casino')) {
    // treat as museum-adjacent with casino volume via audioVolume override
    return 'museum'
  }
  if (p === '/' || p.startsWith('/museum') || p.startsWith('/gallery')) {
    return 'museum'
  }
  return 'transition'
}

export default function ZoneRouteSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname || (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '/')
    const clean = path.split('?')[0] || '/'
    const zone = zoneFromPath(clean)
    setEmpireZone(zone)

    // Soft casino duck for slot SFX clarity
    if (clean.startsWith('/slot') || clean.startsWith('/casino')) {
      try {
        const { setEmpireAudioVolume } = require('../store/empireStore') as {
          setEmpireAudioVolume: (v: number) => void
        }
        setEmpireAudioVolume(0.55)
      } catch {
        /* */
      }
    }
  }, [pathname])

  return null
}
