import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMirroredJson } from '../config/dataSources'
import { useMultiversX } from '../hooks/useMultiversX'
import { usePortfolioValue } from '../hooks/usePortfolioValue'
import GSNBanner from '../components/GSNBanner'
import LIALaunchButton from '../components/LIALaunchButton'

const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

const AGENTS = [
  { key: 'trading', name: 'LIA Trading', icon: '🤖', desc: 'Scalping + Swing + LIABrain', color: 'text-green-400' },
  { key: 'marketplace', name: 'LIA Marketplace', icon: '🎨', desc: 'NFT + RWA + Market Making', color: 'text-purple-400' },
  { key: 'yield', name: 'LIA Yield', icon: '🌾', desc: 'Hatom + xExchange Farms 40%', color: 'text-teal-400' },
  { key: 'security', name: 'LIA Security', icon: '🛡️', desc: 'BalanceGuard + Oracle', color: 'text-blue-400' },
  { key: 'rwa', name: 'LIA RWA Escrow', icon: '🏗️', desc: '$TRO + Arts Physiques', color: 'text-yellow-400' },
  { key: 'dao', name: 'LIA DAO', icon: '🗳️', desc: 'Governance + Proposals', color: 'text-pink-400' },
]

interface CompoundStreakData {
  phase?: string
  mode?: string
  streak?: {
    consecutive_losses?: number
    compound_equity_usd?: number
    yield_sleeve_usd?: number
    total_trades?: number
    last_outcome?: string
    updated_at?: string
    halted?: boolean
    halt_reason?: string
  }
}

interface LiaStatusFile {
  status?: string
  timestamp?: string
  cycle?: {
    summary?: string
    last_event?: string
    mode?: string
  }
  executor?: {
    mode?: string
  }
  mode?: string
}

function detectCircuitMode(streak: CompoundStreakData | null, status: LiaStatusFile | null): string | null {
  const candidates = [streak?.mode, status?.mode, status?.cycle?.mode, status?.executor?.mode]
  for (const value of candidates) {
    if (value === 'paper' || value === 'live') return value
  }
  return null
}

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
  const [compoundState, setCompoundState] = useState<CompoundStreakData | null>(null)
  const [liaCircuitStatus, setLiaCircuitStatus] = useState<LiaStatusFile | null>(null)

  const portfolioUsd = portfolio.totalUsd || (liaStatus?.portfolio?.total_usd ?? 0)
  const egldPrice = portfolio.egldPrice || prices.egld
  const guard = liaStatus?.market?.guard_status ?? 'OK'
  const bonScore = xartists?.battle_of_nodes?.score ?? bonData?.score ?? 0
  const bonRank = xartists?.battle_of_nodes?.rank_estimate ?? bonData?.rank_estimate ?? 'Participant'
  const nfts = xartists?.collections?.nfts_in_wallet ?? 0
  const millionPct = portfolioUsd / 1_000_000 * 100

  const fgColor = prices.fearGreed <= 25 ? 'text-red-400' : prices.fearGreed <= 50 ? 'text-orange-400' : prices.fearGreed <= 75 ? 'text-yellow-400' : 'text-green-400'
  const guardColor = guard === 'OK' ? 'text-green-400' : guard === 'WARNING' ? 'text-orange-400' : 'text-red-400'
  const circuitMode = useMemo(() => detectCircuitMode(compoundState, liaCircuitStatus), [compoundState, liaCircuitStatus])
  const consecutiveLosses = compoundState?.streak?.consecutive_losses ?? 0
  const compoundEquity = compoundState?.streak?.compound_equity_usd ?? null
  const yieldSleeve = compoundState?.streak?.yield_sleeve_usd ?? null
  const totalTreasury = (compoundEquity ?? 0) + (yieldSleeve ?? 0)
  const halted = compoundState?.streak?.halted ?? false
  const lastCircuitEvent =
    compoundState?.streak?.last_outcome ||
    liaCircuitStatus?.cycle?.last_event ||
    compoundState?.phase ||
    liaCircuitStatus?.cycle?.summary ||
    'Aucun événement publié'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [streakData, statusData] = await Promise.all([
          fetchMirroredJson<CompoundStreakData>('lia_compound_streak.json', { cache: 'no-store' }),
          fetchMirroredJson<LiaStatusFile>('lia_v6_status.json', { cache: 'no-store' }),
        ])
        if (cancelled) return
        setCompoundState(streakData)
        setLiaCircuitStatus(statusData)
      } catch {
        if (!cancelled) {
          setCompoundState(null)
          setLiaCircuitStatus(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lastUpdate])

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">📊 Dashboard <span className="live-dot ml-2" /></h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdate ? `Mis à jour ${lastUpdate.toLocaleTimeString('fr-FR')}` : 'Chargement...'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <LIALaunchButton />
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

      {/* GreenSmoke translucent banner */}
      <GSNBanner />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          {/* Quick stats: portfolio value, EGLD price, fear & greed, balance guard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <StatCard
              label="Portfolio Total"
              value={`$${portfolioUsd.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`}
              sub={`${portfolio.tokens.length} tokens · ${portfolio.nfts.length} NFT`}
              color="text-purple-400"
            />
            <StatCard label="EGLD Price" value={`$${egldPrice.toFixed(4)}`} sub="MEX EGLD/USDC" />
            <StatCard label="Fear & Greed" value={`${prices.fearGreed}`} sub={prices.fearGreedLabel} color={fgColor} />
            <StatCard label="BalanceGuard" value={guard} color={guardColor} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard label="EGLD Balance" value={`${portfolio.egldBalance.toFixed(6)}`} sub={`$${(portfolio.egldValueUsd).toFixed(2)}`} />
            <StatCard label="BTC Price" value={`$${prices.btc.toLocaleString()}`} />
            <StatCard label="NFTs xArtists" value={`${nfts}`} sub="collections mainnet" color="text-pink-400" />
            <StatCard label="$TRO Price" value={`$${prices.tro.toFixed(8)}`} sub="→ voir DAO" color="text-purple-400" />
          </div>

          {/* Progression $3 → $1,000,000 */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">🎯 Progression $3 → $1,000,000</p>
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
              <Link to="/portfolio" className="text-xs text-purple-400 hover:text-purple-300">Détails portfolio →</Link>
              <span className="text-xs text-gray-500">{millionPct.toFixed(8)}% du million</span>
            </div>
          </div>

          <div className="card mb-6 border-cyan-500/20 bg-cyan-500/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">🧠 LIA Circuit</p>
                <h2 className="mt-1 text-xl font-black">Compound equity vs yield sleeve</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Le circuit pro garde la boucle de trade d’un côté et le sleeve rendement 30 % de l’autre.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={halted ? 'badge-red' : 'badge-green'}>
                  {halted ? 'HALTED' : 'RUNNING'}
                </span>
                <span className="badge-gray">
                  Mode {circuitMode ?? 'non publié'}
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4 mb-4">
              <div className="rounded-xl border border-white/5 bg-[#111118] p-3">
                <p className="text-xs text-gray-500">Compound equity</p>
                <p className="mt-1 text-lg font-bold text-cyan-300">
                  {compoundEquity != null ? `$${compoundEquity.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111118] p-3">
                <p className="text-xs text-gray-500">Yield sleeve (30%)</p>
                <p className="mt-1 text-lg font-bold text-teal-300">
                  {yieldSleeve != null ? `$${yieldSleeve.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111118] p-3">
                <p className="text-xs text-gray-500">Consecutive losses</p>
                <p className={`mt-1 text-lg font-bold ${consecutiveLosses >= 3 ? 'text-red-400' : 'text-white'}`}>
                  {consecutiveLosses}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111118] p-3">
                <p className="text-xs text-gray-500">Total trades</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {compoundState?.streak?.total_trades ?? 0}
                </p>
              </div>
            </div>

            {totalTreasury > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Répartition publiée</span>
                  <span>${totalTreasury.toFixed(2)} total</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#111118]">
                  <div className="flex h-full">
                    <div
                      className="bg-cyan-400"
                      style={{ width: `${((compoundEquity ?? 0) / totalTreasury) * 100}%` }}
                    />
                    <div
                      className="bg-teal-400"
                      style={{ width: `${((yieldSleeve ?? 0) / totalTreasury) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-[#111118] p-3">
                <p className="text-xs text-gray-500">Last event</p>
                <p className="mt-1 font-semibold text-white">{lastCircuitEvent}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Phase {compoundState?.phase ?? 'N/A'} · status {liaCircuitStatus?.status ?? liaStatus?.status ?? 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111118] p-3">
                <p className="text-xs text-gray-500">Streak file</p>
                <p className="mt-1 font-semibold text-white">
                  {compoundState?.streak?.updated_at
                    ? new Date(compoundState.streak.updated_at).toLocaleString('fr-FR')
                    : 'Non publié'}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {halted
                    ? compoundState?.streak?.halt_reason || 'Arrêt automatique après trop de pertes'
                    : 'SL -1% · BE +0.5% · trail après +0.8%'}
                </p>
              </div>
            </div>
          </div>

          {/* DeFi quick links (Hatom & LP live on their own pages) */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <Link to="/hatom" className="card border-teal-500/20 bg-teal-500/5 hover:border-teal-500/40 transition-colors block">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">🏦 Hatom Protocol</p>
                <span className="text-xs text-gray-500">Détails →</span>
              </div>
              <p className="text-sm text-gray-400">Lending & borrowing positions de LIA.</p>
              <p className="text-xs text-gray-500 mt-1">Health factor, supplied/borrowed, rewards.</p>
            </Link>

            <Link to="/lp" className="card border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-colors block">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">💧 xExchange LP & Farms</p>
                <span className="text-xs text-gray-500">Détails →</span>
              </div>
              <p className="text-sm text-gray-400">Positions de liquidité et farming de LIA.</p>
              <p className="text-xs text-gray-500 mt-1">LP tokens, farm tokens, valeur DeFi.</p>
            </Link>
          </div>

          {/* LIA agent status + reputation */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">🤖 Statut Agents LIA</p>
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
                    <span className="ml-auto badge-green text-[9px]">●</span>
                  </div>
                ))}
              </div>
            </div>

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
          </div>

          {/* Quick external links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { href: 'https://xexchange.com', label: 'xExchange', icon: '🔵' },
              { href: 'https://hatom.com', label: 'Hatom', icon: '🏦' },
              { href: 'https://xoxno.com', label: 'XOXNO', icon: '🖼️' },
              { to: '/dao' as const, label: 'DAO / $TRO', icon: '🗳️', internal: true },
            ].map(l => (
              l.internal ? (
                <Link key={l.label} to={l.to} className="btn-secondary text-center text-sm">
                  {l.icon} {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
                  {l.icon} {l.label}
                </a>
              )
            ))}
          </div>
        </>
      )}
    </div>
  )
}
