import { Link } from 'react-router-dom'

/**
 * Hero d'accueil — vendre le rêve + CTA clairs
 * Intégrer en haut de Dashboard.tsx ou page /
 */

type Props = {
  onConnect?: () => void;
  connected?: boolean;
};

export default function LandingHero({ onConnect, connected }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#12121a] via-[#0a0a12] to-[#1a1030] p-6 sm:p-10 mb-8">
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 mb-4">
          <span className="live-dot" />
          MultiversX mainnet · Art phygital · LIA limited editions
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4">
          Publish your art in minutes.
          <span className="block gradient-text mt-1">Collect phygital drops and limited LIA agents.</span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
          Two clear doors: artists can publish in 3 steps, collectors can explore original artworks
          and limited LIA editions on MultiversX without extra jargon.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/publish" className="btn-primary text-sm sm:text-base inline-flex items-center">
            Publier mon œuvre
          </Link>
          <Link to="/marketplace" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            Explorer le marketplace
          </Link>
          {!connected && onConnect ? (
            <button type="button" onClick={onConnect} className="btn-primary text-sm sm:text-base">
              Connect wallet
            </button>
          ) : null}
          <Link to="/agents" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            Agents LIA limités
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: "Artists", value: "3 steps" },
            { label: "Collections", value: "Phygital" },
            { label: "Agents", value: "Limited" },
            { label: "Royalties", value: "On-chain" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-black/20 px-3 py-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
