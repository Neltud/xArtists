import { lazy, Suspense } from 'react'
import { useMultiversX } from '../hooks/useMultiversX'

const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

const AGENTS = [
  { key: 'trading', name: 'LIA Trading', icon: '🤖', desc: 'Scalping + Swing + LIABrain', color: 'text-green-400' },
  { key: 'marketplace', name: 'LIA Marketplace', icon: '🎨', desc: 'NFT + RWA + Market Making', color: 'text-purple-400' },
  { key: 'yield', name: 'LIA Yield', icon: '🌾', desc: 'Hatom + xExchange Farms 40%', color: 'text-teal-400' },
  { key: 'security', name: 'LIA Security', icon: '🛡️', desc: 'BalanceGuard + Oracle', color: 'text-blue-400' },
  { key: 'rwa', name: 'LIA RWA Escrow', icon: '🏗️', desc: '$TRO + Arts Physiques', color: 'text-yellow-400' },
  { key: 'dao', name: 'LIA DAO', icon: '🗳️', desc: 'Governance + Proposals', color: 'text-pink-400' },
]

function StatCard({ label, value, sub, color = '' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
      <p className={`text-2xl font-black ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { prices, liaStatus, xartists, bonData, loading, lastUpdate, refresh } = useMultiversX()

  const portfolio = liaStatus?.portfolio?.total_usd ?? 0
  const hf = liaStatus?.portfolio?.hatom_health_factor ?? 999
  const guard = liaStatus?.market?.guard_status ?? 'OK'
  const bonScore = xartists?.battle_of_nodes?.score ?? bonData?.score ?? 0
  const bonRank = xartists?.battle_of_nodes?.rank_estimate ?? bonData?.rank_estimate ?? 'Participant'
  const nfts = xartists?.collections?.nfts_in_wallet ?? 0
  const tro = xartists?.tro_token?.balance_wallet ?? 0
  const millionPct = portfolio / 1_000_000 * 100

  const fgColor = prices.fearGreed <= 25 ? 'text-red-400' : prices.fearGreed <= 50 ? 'text-orange-400' : prices.fearGreed <= 75 ? 'text-yellow-400' : 'text-green-400'
  const hfColor = hf > 2 ? 'text-green-400' : hf > 1.5 ? 'text-orange-400' : 'text-red-400'
  const guardColor = guard === 'OK' ? 'text-green-400' : guard === 'WARNING' ? 'text-orange-400' : 'text-red-400'

  return (
    <div className="animate-fade-in">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">📊 Dashboard <span className="live-dot ml-2" /></h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdate ? `Mis à jour ${lastUpdate.toLocaleTimeString('fr-FR')}` : 'Chargement...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-secondary text-sm">🔄 Actualiser</button>
          <a
            href={`https://explorer.multiversx.com/accounts/${WALLET}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            🔗 Explorer
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Portfolio Total" value={`$${portfolio.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`} sub="LIA v6 mainnet" />
            <StatCard label="EGLD Price" value={`$${prices.egld.toFixed(4)}`} sub="MultiversX mainnet" />
            <StatCard label="$TRO Price" value={`$${prices.tro.toFixed(8)}`} sub={`TRO-94c925 • ${tro.toFixed(2)} TRO`} color="text-purple-400" />
            <StatCard label="Fear & Greed" value={`${prices.fearGreed}`} sub={prices.fearGreedLabel} color={fgColor} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="BTC Price" value={`$${prices.btc.toLocaleString()}`} />
            <StatCard label="Hatom HF" value={hf >= 999 ? 'N/A' : hf.toFixed(2)} sub="Health Factor" color={hfColor} />
            <StatCard label="BalanceGuard" value={guard} color={guardColor} />
            <StatCard label="NFTs xArtists" value={`${nfts}`} sub="11 collections mainnet" color="text-pink-400" />
          </div>

          {/* Progression $1M */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">🎯 Progression $10 → $1,000,000</p>
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
          </div>

          {/* Battle of Nodes */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">⚔️ Réputation LIA On-Chain</p>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-black gradient-text">{bonScore}</div>
                <div>
                  <p className="font-bold text-lg">{bonRank}</p>
                  <p className="text-xs text-gray-500">Battle of Nodes — Supernova</p>
                  <span className="badge-purple mt-1">⚡ MultiversX Mainnet</span>
                </div>
              </div>
              <div className="progress-bar mt-3">
                <div className="progress-fill" style={{ width: `${bonScore}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{bonScore}/100 points</p>
            </div>

            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">🤖 Agents IA — Statut</p>
              <div className="grid grid-cols-2 gap-2">
                {AGENTS.map(a => (
                  <div key={a.key} className="flex items-center gap-2 p-2 rounded-lg bg-[#111118]">
                    <span className="text-lg">{a.icon}</span>
                    <div>
                      <p className={`text-xs font-semibold ${a.color}`}>{a.name}</p>
                      <p className="text-[10px] text-gray-500">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: 'https://xexchange.com', label: 'xExchange', icon: '🔵' },
              { href: 'https://hatom.com', label: 'Hatom', icon: '🏦' },
              { href: 'https://xoxno.com', label: 'XOXNO', icon: '🖼️' },
              { href: `https://explorer.multiversx.com/tokens/TRO-94c925`, label: '$TRO Explorer', icon: '🎨' },
            ].map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
                {l.icon} {l.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
