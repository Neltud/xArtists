/** Play navigate SFX + unlock audio context on route change */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { playUiSound, unlockAudio } from '../hooks/useFuturisticSounds'

export default function RouteSfx() {
  const location = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    unlockAudio()
    playUiSound('navigate')
  }, [location.pathname])

  return null
}
