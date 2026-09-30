/**
 * Maps route → empire zone for audio mix (museum vs command).
 * setEmpireZone is a no-op if zone unchanged (no emit storm).
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setEmpireZone, type EmpireZone } from '../store/empireStore'

function zoneFromPath(path: string): EmpireZone {
  if (path.startsWith('/command') || path.startsWith('/room/')) return 'command'
  if (path.startsWith('/museum') || path === '/' || path.startsWith('/gallery')) return 'museum'
  if (path.startsWith('/my-packs') || path.startsWith('/trading')) return 'command'
  return 'museum'
}

function currentPath(pathname: string): string {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
  return hash.startsWith('/') ? hash : pathname || '/'
}

export default function ZoneRouteSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    setEmpireZone(zoneFromPath(currentPath(pathname)))
  }, [pathname])

  useEffect(() => {
    const onHash = () => setEmpireZone(zoneFromPath(currentPath('/')))
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return null
}
