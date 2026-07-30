import { useState } from 'react'

const TABS = ['TRO', 'NFT', 'Rewards', 'Help'] as const

export default function StakingPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('TRO')

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Staking</h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Lock $TRO or stake xArtists NFTs to earn rewards and voting power. Sign with your own wallet (xPortal / Web Wallet) — never the LIA protocol address.
        </p>
      </header>

      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-violet-600/30 text-violet-200' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'TRO' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">$TRO staking modes</h2>
          <ul className="text-sm text-zinc-400 space-y-2">
            <li><strong className="text-zinc-200">Flexible</strong> — unstake anytime</li>
            <li><strong className="text-zinc-200">Bonded 30 / 90 days</strong> — higher APR</li>
            <li><strong className="text-zinc-200">Vote-locked</strong> — DAO voting power</li>
          </ul>
          <p className="text-xs text-zinc-600">Connect wallet, then stake via on-chain txs (sdk-dapp next).</p>
        </div>
      )}

      {tab === 'NFT' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">NFT staking</h2>
          <p className="text-sm text-zinc-400">
            Stake NFTs from xArtists collections to earn rewards. Set boosts may apply.
          </p>
        </div>
      )}

      {tab === 'Rewards' && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Rewards report</h2>
          <p className="text-sm text-zinc-400">RewardsAgent paper report will appear in data/rewards_report.json when the Vellum workflow runs.</p>
        </div>
      )}

      {tab === 'Help' && (
        <div className="card text-sm text-zinc-400 space-y-2">
          <p><strong className="text-zinc-200">Gas:</strong> keep some EGLD for fees.</p>
          <p><strong className="text-zinc-200">Risk:</strong> contracts and rewards are not guaranteed.</p>
          <p><strong className="text-zinc-200">Wallet:</strong> use xPortal / Web Wallet — never paste a PEM in the public UI.</p>
        </div>
      )}
    </div>
  )
}
