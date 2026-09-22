/**
 * Transitions de pages — CSS only (pas de framer-motion).
 * Fade + slide léger à chaque changement de route.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { playUiSound } from '../hooks/useFuturisticSounds'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const [display, setDisplay] = useState(children)
  const [path, setPath] = useState(location.pathname)

  useEffect(() => {
    if (location.pathname === path) {
      setDisplay(children)
      return
    }
    setPhase('out')
    playUiSound('navigate')
    const t = window.setTimeout(() => {
      setPath(location.pathname)
      setDisplay(children)
      setPhase('in')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 160)
    return () => clearTimeout(t)
  }, [location.pathname, children, path])

  return (
    <div
      className={`page-transition page-transition--${phase}`}
      key={path}
    >
      {display}
    </div>
  )
}
