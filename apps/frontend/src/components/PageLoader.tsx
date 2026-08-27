import { useEffect, useState } from 'react'

/** Shared lazy-route loader with timeout hint. */
export default function PageLoader() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 8000)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className="text-center max-w-sm px-4">
        <div className="w-12 h-12 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Chargement…</p>
        {slow && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-amber-400/90">
              La page met trop longtemps — cache ou déploiement en cours.
            </p>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => window.location.reload()}
            >
              Recharger
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
