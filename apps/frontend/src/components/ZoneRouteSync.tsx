/**
 * Maps route → empire zone for audio mix (museum vs command).
 * Extension only — does not alter Museum page logic.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setEmpireZone, type EmpireZone } from '../store/empireStore'

function zoneFromPath(path: string): EmpireZone {
  if (path.startsWith('/command') || path.startsWith('/room/')) return 'command'
  if (path.startsWith('/museum') || path === '/' || path.startsWith('/gallery')) return 'museum'
  // trading / my-packs: soft command ambient
  if (path.startsWith('/my-packs') || path.startsWith('/trading')) return 'command'
  return 'museum'
}

export default function ZoneRouteSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    // hash router: pathname may be '/' and hash holds path
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
    const p = hash.startsWith('/') ? hash : pathname
    setEmpireZone(zoneFromPath(p))
  }, [pathname])

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace(/^#/, '')
      const p = hash.startsWith('/') ? hash : '/'
      setEmpireZone(zoneFromPath(p))
    }
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return null
}
