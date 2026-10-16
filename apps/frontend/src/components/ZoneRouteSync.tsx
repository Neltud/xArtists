/**
 * Map route → empire zone (music volume + ambiance).
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setEmpireZone, type EmpireZone } from '../store/empireStore'

function zoneFromPath(path: string): EmpireZone {
  const p = path.replace(/\/$/, '') || '/'
  if (p.startsWith('/command') || p.startsWith('/trading') || p.startsWith('/my-packs')) {
    return 'command'
  }
  if (p === '/' || p.startsWith('/museum') || p.startsWith('/gallery') || p.startsWith('/lia') || p.startsWith('/tca')) {
    return 'museum'
  }
  return 'transition'
}

export default function ZoneRouteSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname || (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '/')
    const clean = path.split('?')[0] || '/'
    setEmpireZone(zoneFromPath(clean))
  }, [pathname])

  return null
}
