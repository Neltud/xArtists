/**
 * Hero d’accueil — promesse claire, CTA connect / intention.
 */
export default function LandingHero({
  connected,
  onConnect,
}: {
  connected: boolean
  onConnect: () => void
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#12121c] via-[#0e0e18] to-[#1a1030] px-5 py-8 md:px-8 md:py-10">
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent" />
      <div className="relative max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.25em] text-purple-300/90 mb-2">
          xArtists · MultiversX · LIA
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
          Art, agents IA et finance —
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
            {' '}
            en un parcours simple
          </span>
        </h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Explore la galerie et les tours artistiques. Achète un pack agent (Pulse / Yield / Sentinel).
          Suis le board LIA en mode <strong className="text-zinc-300">paper</strong>. Connecte ton
          wallet pour tipper ou recevoir des NFT.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {!connected ? (
            <button type="button" onClick={onConnect} className="btn-primary text-sm py-2.5 px-5">
              Connecter le wallet
            </button>
          ) : (
            <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              Wallet connecté
            </span>
          )}
          <a href="#path-hub-title" className="btn-secondary text-sm py-2.5 px-5">
            Voir les chemins
          </a>
          <span className="text-[11px] text-zinc-500 self-center">ou ⌘K pour parler à LIA</span>
        </div>
      </div>
    </header>
  )
}
