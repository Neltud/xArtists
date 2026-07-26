import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { useWalletTokens } from '../hooks/useWalletTokens'

const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const FORECAST_URL = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data/greensmoke_forecasts.json'

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
      <p className={`text-xl sm:text-2xl font-black ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { prices, liaStatus, xartists, bonData, loading, lastUpdate, refresh } = useMultiversX()
  const { hatomPosition, lpTokens, farmTokens, totalEsdtUsd, loading: walletLoading } = useWalletTokens()
  const [signal, setSignal] = useState<{ primary: string; secondary: string; regime: string; action: string } | null>(null)

  useEffect(() => {
    fetch(FORECAST_URL + '?t=' + Date.now())
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.aggregated_signals) {
          setSignal({
            primary: j.aggregated_signals.primary,
            secondary: j.aggregated_signals.secondary,
            regime: j.aggregated_signals.regime,
            action: j.aggregated_signals.recommended_action,
          })
        }
      })
      .catch(() => {})
  }, [])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">📊 Dashboard <span className="live-dot ml-2" /></h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdate ? `Mis à jour ${lastUpdate.toLocaleTimeString('fr-FR')}` : 'Chargement...'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
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

      {/* GreenSmoke forecasts strip */}
      {signal && (
        <Link
          to="/agents"
          className="card mb-6 block border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-1">🔮 Prévisions GreenSmoke</p>
              <p className="text-sm font-bold text-green-400">{signal.primary}</p>
              <p className="text-xs text-gray-400 mt-0.5">{signal.action}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-purple">{signal.regime}</span>
              <span className="badge-green">{signal.secondary}</span>
              <span className="text-xs text-gray-500">Détails →</span>
            </div>
          </div>
        </Link>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <StatCard label="Portfolio Total" value={`$${portfolio.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`} sub="LIA v6 mainnet" />
            <StatCard label="EGLD Price" value={`$${prices.egld.toFixed(4)}`} sub="MultiversX mainnet" />
            <StatCard label="$TRO Price" value={`$${prices.tro.toFixed(8)}`} sub={`TRO-94c925 • ${tro.toFixed(2)} TRO`} color="text-purple-400" />
            <StatCard label="Fear & Greed" value={`${prices.fearGreed}`} sub={prices.fearGreedLabel} color={fgColor} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard label="BTC Price" value={`$${prices.btc.toLocaleString()}`} />
            <StatCard label="Hatom HF" value={hf >= 999 ? 'N/A' : hf.toFixed(2)} sub="Health Factor" color={hfColor} />
            <StatCard label="BalanceGuard" value={guard} color={guardColor} />
            <StatCard label="NFTs xArtists" value={`${nfts}`} sub="11 collections mainnet" color="text-pink-400" />
          </div>

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

          {!walletLoading && (
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="card border-teal-500/20 bg-teal-500/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">🏦 Hatom Protocol</p>
                  <Link to="/hatom" className="text-xs text-gray-500 hover:text-white transition-colors">Détails →</Link>
                </div>
                {hatomPosition ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Supplied</p>
                      <p className="font-bold text-green-400">${hatomPosition.totalSuppliedUsd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Borrowed</p>
                      <p className="font-bold text-orange-400">${hatomPosition.totalBorrowedUsd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Health Factor</p>
                      <p className={`font-bold ${hfColor}`}>{hf >= 999 ? 'N/A' : hf.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Net Position</p>
                      <p className="font-bold text-white">${hatomPosition.netValueUsd.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune position Hatom active</p>
                )}
              </div>

              <div className="card border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">💧 xExchange LP & Farms</p>
                  <Link to="/lp" className="text-xs text-gray-500 hover:text-white transition-colors">Détails →</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">LP Tokens</p>
                    <p className="font-bold">{lpTokens.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Farm Tokens</p>
                    <p className="font-bold">{farmTokens.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Valeur LP</p>
                    <p className="font-bold text-purple-400">
                      ${lpTokens.reduce((s, t) => s + t.valueUsd, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total ESDT</p>
                    <p className="font-bold text-white">${totalEsdtUsd.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">⚔️ Réputation LIA On-Chain</p>
              <div className="flex items-center gap-4">
                <div className="text-4xl sm:text-5xl font-black gradient-text">{bonScore}</div>
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">🤖 Agents IA</p>
                <Link to="/agents" className="text-xs text-purple-400 hover:text-purple-300">Monitoring →</Link>
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
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { href: 'https://xexchange.com', label: 'xExchange', icon: '🔵' },
              { href: 'https://hatom.com', label: 'Hatom', icon: '🏦' },
              { href: 'https://xoxno.com', label: 'XOXNO', icon: '🖼️' },
              { href: `https://explorer.multiversx.com/tokens/TRO-94c925`, label: '$TRO', icon: '🎨' },
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
