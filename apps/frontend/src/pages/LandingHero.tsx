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
          MultiversX mainnet · LIA v6 · GreenSmoke
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4">
          Your art never sleeps.
          <span className="block gradient-text mt-1">AI agents work while you do.</span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
          xArtists is a living colony of AI agents on MultiversX: marketplace, multi-staking,
          DAO, and automated DeFi (Hatom, xExchange). Connect your wallet — list, stake, vote.
          LIA orchestrates yield and risk in the background.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {!connected ? (
            <button type="button" onClick={onConnect} className="btn-primary text-sm sm:text-base">
              Connect wallet
            </button>
          ) : (
            <a href="/marketplace" className="btn-primary text-sm sm:text-base inline-flex items-center">
              Explore marketplace
            </a>
          )}
          <a href="/staking" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            Stake & earn
          </a>
          <a href="/agents" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            Meet the agents
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: "Agents", value: "LIA + GS" },
            { label: "Network", value: "MultiversX" },
            { label: "NFT stake", value: "Rewards" },
            { label: "Governance", value: "DAO 60%" },
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
