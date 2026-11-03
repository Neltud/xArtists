/**
 * Landing sculpture: lightweight, accessible 2D by default on phones,
 * reduced-motion and data-saver devices. Load three.js only after explicit opt-in
 * or on sufficiently capable desktop screens.
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { useCopy } from './state'

const Sculpture = lazy(() => import('./Sculpture'))

type ConnectionNavigator = Navigator & {
  connection?: { saveData?: boolean }
  deviceMemory?: number
}

export default function HomeHeroSculpture({ variant = 0 }: { variant?: number }) {
  const c = useCopy()
  const [desktopAllowed, setDesktopAllowed] = useState(false)
  const [userEnabled, setUserEnabled] = useState(false)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)')
    const nav = navigator as ConnectionNavigator
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4
    const enableDesktop = () => setDesktopAllowed(mq.matches && !nav.connection?.saveData && !lowMemory)
    enableDesktop()
    mq.addEventListener?.('change', enableDesktop)
    return () => mq.removeEventListener?.('change', enableDesktop)
  }, [])

  if (desktopAllowed || userEnabled) {
    return (
      <Suspense fallback={<div className="xa-orbit-fallback" aria-hidden="true"><i/><i/><i/></div>}>
        <Sculpture variant={variant} />
      </Suspense>
    )
  }

  return (
    <div className="xa-hero-2d" data-variant={variant}>
      <div className="xa-hero-2d-visual" role="img" aria-label={c('sculpture')}>
        <span className="xa-hero-2d-ring xa-hero-2d-ring-one" aria-hidden="true"/>
        <span className="xa-hero-2d-ring xa-hero-2d-ring-two" aria-hidden="true"/>
        <span className="xa-hero-2d-center" aria-hidden="true"/>
      </div>
      <div className="xa-hero-2d-actions">
        <p>{c('hero3dLead')}</p>
        <button type="button" className="xa-hero-2d-button" onClick={() => setUserEnabled(true)}>
          {c('hero3dAction')}
        </button>
      </div>
    </div>
  )
}
