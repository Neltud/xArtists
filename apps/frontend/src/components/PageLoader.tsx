import { useEffect, useState } from 'react'

/** Shared lazy-route loader. */
export default function PageLoader() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 8000)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[55vh]" role="status" aria-live="polite">
      <div className="text-center max-w-sm px-4">
        <div className="relative mx-auto mb-5 h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-violet-500 animate-spin" />
        </div>
        <p className="display text-sm text-zinc-300">Chargement</p>
        <p className="text-[11px] text-zinc-600 mt-1">Module en cours…</p>
        {slow && (
          <div className="mt-5 space-y-2">
            <p className="text-xs text-amber-400/90">
              Trop long — cache ou déploiement Pages en cours.
            </p>
            <button type="button" className="btn-secondary text-xs" onClick={() => window.location.reload()}>
              Recharger
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
