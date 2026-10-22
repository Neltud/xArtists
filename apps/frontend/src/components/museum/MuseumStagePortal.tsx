import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Move the same scene into the document body without remounting its canvas. */
export default function MuseumStagePortal({ fullscreen, children }: {
  fullscreen: boolean
  children: ReactNode
}) {
  const host = useRef<HTMLDivElement>(null)
  const [container] = useState(() => {
    if (typeof document === 'undefined') return null
    const element = document.createElement('div')
    element.style.display = 'contents'
    return element
  })

  useLayoutEffect(() => {
    if (!container || !host.current) return
    const parent = fullscreen ? document.body : host.current
    parent.appendChild(container)
    return () => container.remove()
  }, [container, fullscreen])

  if (!container) return <>{children}</>
  return <><div ref={host} className="xa-museum-portal-host" />{createPortal(children, container)}</>
}
