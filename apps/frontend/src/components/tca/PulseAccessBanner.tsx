/** Banner according to FULL | SAMPLE | NONE */
import type { TcaAccessResult } from '../../lib/tcaAccess'
import { Link } from 'react-router-dom'

export function PulseAccessBanner({
  access,
  mode,
}: {
  access?: TcaAccessResult
  mode?: string | null
}) {
  const status = access?.status || (mode as TcaAccessResult['status']) || 'NONE'

  if (status === 'FULL') {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-100/90">
        Pulse Pack · mode immersif TCA
        {access?.expiryDate ? (
          <span className="text-emerald-200/60"> · jusqu’au {access.expiryDate.slice(0, 10)}</span>
        ) : null}
      </div>
    )
  }

  if (status === 'SAMPLE') {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-50/90 space-y-1">
        <p className="font-medium">Mode échantillon (ATC)</p>
        <p className="text-amber-100/70">
          {access?.reason === 'pulse_expired'
            ? 'Pack Pulse expiré — aperçu vidéo uniquement.'
            : 'Aperçu vidéo. Le hologramme 3D + Q&A RAG nécessitent le Pack Pulse (12 mois).'}
        </p>
        <Link to="/agents" className="inline-block underline text-amber-200">
          Obtenir le Pack Pulse →
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-400 space-y-1">
      <p>Lobby — connectez un wallet ou explorez le Pack Pulse.</p>
      <Link to="/agents" className="underline text-amber-200/80">
        Voir les offres →
      </Link>
    </div>
  )
}
