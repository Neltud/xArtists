import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { usePortfolioValue } from '../hooks/usePortfolioValue'
import GSNBanner from '../components/GSNBanner'
import LIALaunchButton from '../components/LIALaunchButton'
import { LIA_WALLET } from '../config/links'

const AGENTS = [
  { key: 'trading', name: 'LIA Trading', icon: '🤖', desc: 'Scalping + Swing + LIABrain', color: 'text-green-400' },
  { key: 'marketplace', name: 'LIA Marketplace', icon: '🎨', desc: 'NFT + RWA + Market Making', color: 'text-purple-400' },
  { key: 'yield', name: 'LIA Yield', icon: '🌾', desc: 'Hatom + xExchange Farms', color: 'text-teal-400' },
  { key: 'security', name: 'LIA Security', icon: '🛡️', desc: 'BalanceGuard + Oracle', color: 'text-blue-400' },
  { key: 'rwa', name: 'LIA RWA Escrow', icon: '🏗️', desc: '$TRO + Arts Physiques', color: 'text-yellow-400' },
  { key: 'dao', name: 'LIA DAO', icon: '🗳️', desc: 'Governance + Proposals', color: 'text-pink-400' },
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

  const portfolioUsd = portfolio.totalUsd || (liaStatus?.portfolio?.total_usd ?? 0)
  const egldPrice = portfolio.egldPrice || prices.egld
  const guard = liaStatus?.market?.guard_status ?? 'OK'
  const bonScore = xartists?.battle_of_nodes?.score ?? bonData?.score ?? 0
  const bonRank = xartists?.battle_of_nodes?.rank_estimate ?? bonData?.rank_estimate ?? 'Participant'
  const nfts = xartists?.collections?.nfts_in_wallet ?? 0
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
            Vue <strong className="text-purple-300">protocole LIA</strong> (ops) — pas le solde de ton wallet
            connecté
          </p>
          <p className="text-[10px] mono text-gray-600 mt-1">
            {LIA_WALLET.slice(0, 16)}…{" "}
            {lastUpdate ? `· ${lastUpdate.toLocaleTimeString('fr-FR')}` : ''}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <LIALaunchButton />
          <button type="button" onClick={refresh} className="btn-secondary text-sm">
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
        Portfolio ci-dessous = <strong>wallet protocole LIA</strong>. Pour ton portefeuille personnel →{" "}
        <Link to="/wallet" className="underline">
          /wallet
        </Link>{" "}
        après Connect.
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <StatCard
              label="LIA Portfolio"
              value={`$${portfolioUsd.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`}
              sub={`${portfolio.tokens.length} tokens · ${portfolio.nfts.length} NFT`}
              color="text-purple-400"
            />
            <StatCard label="EGLD Price" value={`$${egldPrice.toFixed(4)}`} sub="MEX EGLD/USDC" />
            <StatCard label="Fear & Greed" value={`${prices.fearGreed}`} sub={prices.fearGreedLabel} color={fgColor} />
            <StatCard label="BalanceGuard" value={guard} color={guardColor} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="LIA EGLD"
              value={`${portfolio.egldBalance.toFixed(6)}`}
              sub={`$${(portfolio.egldValueUsd).toFixed(2)}`}
            />
            <StatCard label="BTC Price" value={`$${prices.btc.toLocaleString()}`} />
            <StatCard label="NFTs LIA" value={`${nfts}`} sub="collections mainnet" color="text-pink-400" />
            <StatCard label="$TRO Price" value={`$${prices.tro.toFixed(8)}`} sub="→ DAO" color="text-purple-400" />
          </div>

          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  🎯 Progression LIA $3 → $1,000,000
                </p>
                <p className="text-2xl font-black mt-1">{millionPct.toFixed(6)}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Objectif</p>
                <p className="text-lg font-bold text-purple-400">$1,000,000</p>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(millionPct * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <Link to="/portfolio" className="text-xs text-purple-400 hover:text-purple-300">
                Détails →
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <Link to="/hatom" className="card border-teal-500/20 bg-teal-500/5 block">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">🏦 Hatom</p>
              <p className="text-sm text-gray-400 mt-1">Yield sleeve LIA</p>
            </Link>
            <Link to="/lp" className="card border-purple-500/20 bg-purple-500/5 block">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">💧 LP & Farms</p>
              <p className="text-sm text-gray-400 mt-1">Positions LIA</p>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">🤖 Agents LIA</p>
                <Link to="/agents" className="text-xs text-purple-400">
                  Market →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AGENTS.map(a => (
                  <div key={a.key} className="flex items-center gap-2 p-2 rounded-lg bg-[#111118]">
                    <span className="text-lg">{a.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${a.color} truncate`}>{a.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                ⚔️ Réputation LIA
              </p>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black gradient-text">{bonScore}</div>
                <div>
                  <p className="font-bold text-lg">{bonRank}</p>
                  <span className="badge-purple mt-1">MultiversX Mainnet</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <a href="https://xexchange.com" target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
              🔵 xExchange
            </a>
            <a href="https://app.hatom.com" target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
              🏦 Hatom
            </a>
            <a href="https://xoxno.com" target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
              🖼️ XOXNO
            </a>
            <Link to="/dao" className="btn-secondary text-center text-sm">
              🗳️ DAO / $TRO
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
