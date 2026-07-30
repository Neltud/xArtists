/**
 * Cartes pédagogiques — information & explications
 */

const CARDS = [
  {
    emoji: "🎨",
    title: "Marketplace",
    body: "List your NFT, buy listed works, or make an offer. Prices and floors are shown when available. You always sign with your own wallet (xPortal).",
    href: "/marketplace",
    cta: "Open marketplace",
  },
  {
    emoji: "🔒",
    title: "Staking",
    body: "Stake $TRO (flexible or locked) or stake xArtists NFTs to earn rewards. Claim when ready. Boost multipliers apply when you stake a set.",
    href: "/staking",
    cta: "View staking",
  },
  {
    emoji: "🧠",
    title: "AI Agents",
    body: "LIA runs DeFi strategies (Hatom, swaps). GreenSmoke publishes forecasts. RewardsAgent helps distribute staking rewards. All visible on the Agents page.",
    href: "/agents",
    cta: "See agents",
  },
  {
    emoji: "🗳️",
    title: "DAO",
    body: "Staked TRO gives voting power. Proposals need a 60% quorum. Shape the protocol with the community.",
    href: "/dao",
    cta: "Go to DAO",
  },
  {
    emoji: "🏦",
    title: "Hatom & DeFi",
    body: "Supply assets to earn yield or manage collateral. LIA can automate parts of this for the protocol wallet; you keep control of your funds.",
    href: "/hatom",
    cta: "Hatom page",
  },
  {
    emoji: "🌉",
    title: "Soul (testnet)",
    body: "Experimental cross-chain liquidity. Testnet only for now — no mainnet funds. Native MultiversX support will follow when Soul ships it.",
    href: "/soul-testnet",
    cta: "Soul testnet",
  },
];

export default function ExplainCards() {
  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2 className="text-xl font-bold">How xArtists works</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Short guides — no jargon wall. Click through when you are ready.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="card group block hover:border-violet-500/40 transition-colors"
          >
            <div className="text-2xl mb-3">{c.emoji}</div>
            <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
              {c.title}
            </h3>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{c.body}</p>
            <span className="inline-block mt-4 text-xs font-medium text-violet-400">
              {c.cta} →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
