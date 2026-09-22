import { Link } from 'react-router-dom'

export function JoyNote({
  eyebrow, children, to, linkLabel,
}: {
  eyebrow: string
  children: React.ReactNode
  to?: string
  linkLabel?: string
}) {
  return (
    <aside className="card-play animate-fade-in rounded-2xl border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.06] via-transparent to-cyan-500/[0.05] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/70 mb-1">{eyebrow}</p>
      <p className="text-[13px] text-zinc-400 leading-relaxed">{children}</p>
      {to && (
        <Link to={to} className="inline-block mt-2 text-[12px] text-cyan-300/90 hover:text-cyan-200 underline-offset-2 hover:underline">
          {linkLabel || 'Découvrir →'}
        </Link>
      )}
    </aside>
  )
}

export function JoyStripHome() {
  return (
    <div className="space-y-2.5">
      <JoyNote eyebrow="Curiosité" to="/museum" linkLabel="Entrer dans une salle →">
        Chaque musée a sa lumière. Promène-toi, zoome une œuvre — l’art aime qu’on prenne son temps.
      </JoyNote>
      <JoyNote eyebrow="Extensions" to="/sale" linkLabel="Voir la vente →">
        Packs Pulse · Yield · Sentinel : de petites clés pour suivre le board — sans promesse de miracle.
      </JoyNote>
      <JoyNote eyebrow="Roadmap" to="/legal" linkLabel="Cadre & droits →">
        Mint on-chain, salles mécènes… on construit à découvert, avec le sourire et les gardes-fous.
      </JoyNote>
    </div>
  )
}
