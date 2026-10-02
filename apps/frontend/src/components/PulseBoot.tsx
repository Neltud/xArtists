/** Boot global — pulse + unlock SC (codeHash explorer + preuves TX). */
import { useEffect } from 'react'
import { usePulse } from '../hooks/usePulse'
import { refreshRuntimeCodehashes } from '../lib/runtimeCodehash'
import { refreshExplorerProofs } from '../lib/explorerProof'

export default function PulseBoot() {
  usePulse()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await refreshRuntimeCodehashes()
        if (!alive) return
        await refreshExplorerProofs()
      } catch (e) {
        console.warn('[xArtists] boot unlock', e)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return null
}
