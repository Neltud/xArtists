/**
 * Observe modales connues (checkout / playlist / login) via events + data-attr.
 * Les composants modaux appellent useWebglPauseWhen(open).
 * Ce bridge écoute aussi les dialogs [data-xartists-modal="1"].
 */
import { useEffect } from 'react'
import { requestWebglPause, releaseWebglPause } from '../lib/webglPause'

export default function WebglPauseBridge() {
  useEffect(() => {
    let paused = false
    const check = () => {
      const open = document.querySelectorAll('[data-xartists-modal="1"]').length > 0
      if(open===paused)return
      paused=open
      if(open)requestWebglPause()
      else releaseWebglPause()
    }
    const mo = new MutationObserver(check)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-xartists-modal'] })
    check()
    return () => {
      mo.disconnect()
      if(paused)releaseWebglPause()
    }
  }, [])
  return null
}
