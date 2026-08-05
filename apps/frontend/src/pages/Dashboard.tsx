import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { usePortfolioValue } from '../hooks/usePortfolioValue'
import { useLiaOnchainLive } from '../hooks/useLiaOnchainLive'
import { useWallet } from '../context/WalletContext'
import GSNBanner from '../components/GSNBanner'
import LIALaunchButton from '../components/LIALaunchButton'
import AdSlot from '../components/AdSlot'
import PersonaWelcome, {
  PersonaQuickLinks,
  getStoredPersona,
  type Persona,
} from '../components/PersonaWelcome'
import LandingHero from './LandingHero'
import ExplainCards from './ExplainCards'
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
  const { connected } = useWallet()
  const [persona, setPersona] = useState<Persona | null>(null)

  useEffect(() => {
    setPersona(getStoredPersona())
  }, [])

  const portfolioUsd = portfolio.totalUsd || (liaStatus?.portfolio?.total_usd ?? 0)
  const egldPrice = portfolio.egldPrice || prices.egld
  const guard = liaStatus?.market?.guard_status ?? 'OK'
  const bonScore = xartists?.battle_of_nodes?.score ?? bonData?.score ?? 0
  const bonRank = xartists?.battle_of_nodes?.rank_estimate ?? bonData?.rank_estimate ?? 'Participant'

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
      <PersonaWelcome onClose={() => setPersona(getStoredPersona())} />

      <LandingHero connected={connected} />

      <div className="mb-4">
        <AdSlot id="home_hero" />
      </div>

      <PersonaQuickLinks persona={persona} />

      <div id="main-content" tabIndex={-1} className="outline-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Dashboard protocole <span className="live-dot ml-2" />
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Vue <strong className="text-purple-300">LIA ops</strong> — pas ton wallet Connect
            </p>
            <p className="text-[10px] mono text-gray-600 mt-1">
              {LIA_WALLET.slice(0, 18)}…{lastUpdate ? ` · ${lastUpdate.toLocaleTimeString('fr-FR')}` : ''}
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
              Actualiser
            </button>
          </div>
        </div>

        <GSNBanner />

        <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-100">
          Portfolio = wallet LIA. Ton compte →{' '}
          <Link to="/wallet" className="underline">
            /wallet · Mon wallet
          </Link>
          . $TRO supply max = <strong>500 000</strong>.{' '}
          <Link to="/ads" className="underline text-purple-300">
            Espace pub
          </Link>
        </div>

        {loading && live.loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8" aria-busy="true">
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
                sub={`${portfolio.tokens.length} tokens`}
                color="text-purple-400"
              />
              <StatCard label="EGLD Price" value={`$${egldPrice.toFixed(4)}`} sub="Network" />
              <StatCard
                label="Fear & Greed"
                value={`${prices.fearGreed}`}
                sub={prices.fearGreedLabel}
                color={fgColor}
              />
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
                sub="cap total 500 000"
                color="text-purple-400"
              />
              <StatCard
                label="NFTs wallet LIA"
                value={`${nftsWallet}`}
                sub="possession, pas catalogue"
                color="text-pink-400"
              />
              <StatCard
                label="NFTs collections"
                value={nftsCatalog > 11 ? `${nftsCatalog}` : '275+'}
                sub="catalogue mainnet"
                color="text-teal-300"
              />
            </div>

            <div className="card mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Progression LIA</p>
              <p className="text-2xl font-black mt-1">{millionPct.toFixed(6)}%</p>
              <div className="progress-bar mt-2" role="progressbar" aria-valuenow={millionPct}>
                <div className="progress-fill" style={{ width: `${Math.min(millionPct * 100, 100)}%` }} />
              </div>
              <Link to="/portfolio" className="text-xs text-purple-400 mt-2 inline-block">
                Portfolio détail →
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
                      <span aria-hidden>{a.icon}</span>
                      <div>
                        <p className={`text-xs font-semibold ${a.color}`}>{a.name}</p>
                        <p className="text-[10px] text-gray-500">{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
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

            <ExplainCards />
          </>
        )}
      </div>
    </div>
  )
}
