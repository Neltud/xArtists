import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { usePortfolioValue } from '../hooks/usePortfolioValue'
import { useLiaOnchainLive } from '../hooks/useLiaOnchainLive'
import GSNBanner from '../components/GSNBanner'
import LIALaunchButton from '../components/LIALaunchButton'
import { LIA_WALLET } from '../config/links'

const AGENTS = [
  { key: 'trading', name: 'LIA Trading', icon: '🤖', desc: 'Vellum pack', color: 'text-green-400' },
  { key: 'marketplace', name: 'LIA Marketplace', icon: '🎨', desc: 'Vellum pack', color: 'text-purple-400' },
  { key: 'yield', name: 'LIA Yield', icon: '🌾', desc: 'Vellum pack', color: 'text-teal-400' },
  { key: 'security', name: 'LIA Security', icon: '🛡️', desc: 'Vellum pack', color: 'text-blue-400' },
  { key: 'rwa', name: 'LIA RWA', icon: '🏗️', desc: 'Vellum pack', color: 'text-yellow-400' },
  { key: 'dao', name: 'LIA DAO', icon: '🗳️', desc: 'Vellum pack', color: 'text-pink-400' },
]

function StatCard({ label, value, sub, color = '' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
      <p className={`text-xl sm:text-2xl font-black ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { prices, liaStatus, xartists, bonData, loading, lastUpdate, refresh } = useMultiversX()
  const portfolio = usePortfolioValue()
  const live = useLiaOnchainLive()

  const portfolioUsd = portfolio.totalUsd || (liaStatus?.portfolio?.total_usd ?? 0)
  const egldPrice = portfolio.egldPrice || prices.egld
  const guard = liaStatus?.market?.guard_status ?? 'OK'
  const bonScore = xartists?.battle_of_nodes?.score ?? bonData?.score ?? 0
  const bonRank = xartists?.battle_of_nodes?.rank_estimate ?? bonData?.rank_estimate ?? 'Participant'

  // Live wallet NFTs (API) — NOT collection catalog size
  const nftsWallet = live.nftInWallet || xartists?.collections?.nfts_in_wallet || portfolio.nfts.length || 0
  const nftsCatalog =
    (xartists?.collections as { nfts_in_collections_sum?: number })?.nfts_in_collections_sum ??
    xartists?.collections?.total_mainnet ??
    0

  const millionPct = (portfolioUsd / 1_000_000) * 100
  const fgColor =
    prices.fearGreed <= 25
      ? 'text-red-400'
      : prices.fearGreed <= 50
        ? 'text-orange-400'
        : prices.fearGreed <= 75
          ? 'text-yellow-400'
          : 'text-green-400'
  const guardColor =
    guard === 'OK' ? 'text-green-400' : guard === 'WARNING' ? 'text-orange-400' : 'text-red-400'

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">
            📊 Dashboard <span className="live-dot ml-2" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue <strong className="text-purple-300">protocole LIA</strong> — pas ton wallet Connect
          </p>
          <p className="text-[10px] mono text-gray-600 mt-1">
            {LIA_WALLET.slice(0, 18)}…{" "}
            {lastUpdate ? `· ${lastUpdate.toLocaleTimeString('fr-FR')}` : ''}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <LIALaunchButton />
          <button
            type="button"
            onClick={() => {
              refresh()
              live.refresh()
            }}
            className="btn-secondary text-sm"
          >
            🔄 Actualiser
          </button>
          <a
            href={`https://explorer.multiversx.com/accounts/${LIA_WALLET}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            🔗 Explorer LIA
          </a>
        </div>
      </div>

      <GSNBanner />

      <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-100">
        Portfolio = <strong>wallet LIA ops</strong>. Ton compte →{" "}
        <Link to="/wallet" className="underline">
          /wallet · Mon wallet
        </Link>{" "}
        après Connect (xPortal / extension).
      </div>

      {loading && live.loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <StatCard
              label="LIA Portfolio ≈"
              value={`$${portfolioUsd.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`}
              sub={`${portfolio.tokens.length} tokens · scan API`}
              color="text-purple-400"
            />
            <StatCard label="EGLD Price" value={`$${egldPrice.toFixed(4)}`} sub="Network" />
            <StatCard label="Fear & Greed" value={`${prices.fearGreed}`} sub={prices.fearGreedLabel} color={fgColor} />
            <StatCard label="BalanceGuard" value={guard} color={guardColor} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="LIA EGLD"
              value={`${(live.egldBalance || portfolio.egldBalance).toFixed(4)}`}
              sub="live API"
            />
            <StatCard
              label="LIA $TRO"
              value={`${(live.troBalance || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`}
              sub="live API"
              color="text-purple-400"
            />
            <StatCard
              label="NFTs dans wallet LIA"
              value={`${nftsWallet}`}
              sub="API /nfts/count (pas le catalogue)"
              color="text-pink-400"
            />
            <StatCard
              label="NFTs collections xArtists"
              value={nftsCatalog > 11 ? `${nftsCatalog}` : '275+'}
              sub="Somme collections mainnet (catalogue)"
              color="text-teal-300"
            />
          </div>

          <p className="text-[11px] text-gray-500 mb-6">
            Si tu voyais <strong>0 NFT</strong> : ancien JSON figé (<code>nfts_in_wallet: 0</code>). Le catalogue
            collections (~275 œuvres, ex. NFTUDURI 152) ≠ les <strong>{nftsWallet} NFT</strong> actuellement dans le
            wallet LIA.
          </p>

          <div className="card mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">🎯 Progression LIA</p>
            <p className="text-2xl font-black mt-1">{millionPct.toFixed(6)}%</p>
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${Math.min(millionPct * 100, 100)}%` }} />
            </div>
            <Link to="/portfolio" className="text-xs text-purple-400 mt-2 inline-block">
              Portfolio détail →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Link to="/hatom" className="card border-teal-500/20 block">
              <p className="text-xs text-teal-400 font-semibold">🏦 Hatom</p>
              <p className="text-sm text-gray-400">Yield sleeve LIA</p>
            </Link>
            <Link to="/lp" className="card border-purple-500/20 block">
              <p className="text-xs text-purple-400 font-semibold">💧 LP</p>
              <p className="text-sm text-gray-400">Farms LIA</p>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <div className="flex justify-between mb-3">
                <p className="text-xs uppercase text-gray-500 font-semibold">Packs LIA (Vellum)</p>
                <Link to="/agents" className="text-xs text-purple-400">
                  /agents →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AGENTS.map(a => (
                  <div key={a.key} className="flex gap-2 p-2 rounded-lg bg-[#111118]">
                    <span>{a.icon}</span>
                    <div>
                      <p className={`text-xs font-semibold ${a.color}`}>{a.name}</p>
                      <p className="text-[10px] text-gray-500">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-2">≠ prévisions GreenSmoke (bandeau ci-dessus)</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase text-gray-500 mb-3">Réputation LIA</p>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black gradient-text">{bonScore}</div>
                <div>
                  <p className="font-bold">{bonRank}</p>
                  <Link to="/dao" className="text-xs text-purple-400">
                    DAO lecture seule →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
