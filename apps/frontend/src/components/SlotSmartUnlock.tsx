/**
 * Force re-eval MODE REAL when explorer smart-unlock completes.
 * Drop on SlotPage — listens xartists-codehash + polls once.
 */
import { useEffect, useState } from 'react'
import { canSpinSlot, SLOT_CASINO_ADDRESS } from '../config/scStatus'
import { refreshRuntimeCodehashes, runtimeSlotBalance } from '../lib/runtimeCodehash'
import { refreshHouseFromApi } from '../lib/slotHouseGuard'

export default function SlotSmartUnlock({
  onLive,
}: {
  onLive?: (live: boolean) => void
}) {
  const [live, setLive] = useState(() => canSpinSlot())
  const [bal, setBal] = useState(0)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    const apply = (ok: boolean) => {
      if (cancelled) return
      setLive(ok)
      setBal(runtimeSlotBalance())
      onLive?.(ok)
    }
    ;(async () => {
      setChecking(true)
      await refreshRuntimeCodehashes()
      if (SLOT_CASINO_ADDRESS) await refreshHouseFromApi(SLOT_CASINO_ADDRESS)
      apply(canSpinSlot())
      setChecking(false)
    })()
    const on = () => apply(canSpinSlot())
    window.addEventListener('xartists-codehash', on)
    return () => {
      cancelled = true
      window.removeEventListener('xartists-codehash', on)
    }
  }, [onLive])

  if (live) {
    return (
      <p className="text-[12px] text-emerald-300/90 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
        MODE REAL ouvert · caisse ~{bal > 0 ? bal.toFixed(2) : '0.50'} EGLD · on-chain vérifié
      </p>
    )
  }
  return (
    <p className="text-[12px] text-amber-200/80 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
      {checking ? 'Vérification on-chain…' : 'Simulation active — REAL dès validation SC'}
    </p>
  )
}
