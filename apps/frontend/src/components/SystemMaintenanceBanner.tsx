/** Circuit Breaker UI when SC paused */
import { useEffect, useState } from 'react'
import { fetchScPauseState } from '../lib/scPause'

export default function SystemMaintenanceBanner() {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const s = await fetchScPauseState()
      if (!cancelled && s.slotPaused === true) setPaused(true)
      else if (!cancelled) setPaused(false)
    }
    void run()
    const id = window.setInterval(run, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  if (!paused) return null

  return (
    <div
      className="fixed top-0 inset-x-0 z-[90] border-b border-amber-500/40 bg-amber-950/95 px-4 py-2 text-center text-[12px] text-amber-100"
      role="alert"
    >
      <strong className="font-tech">System Maintenance</strong>
      {' — '}Slot SC en pause (circuit breaker). TX casino désactivées jusqu’à reprise admin/multisig.
    </div>
  )
}
