import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { usePortfolioValue } from '../hooks/usePortfolioValue'
import { useLiaOnchainLive } from '../hooks/useLiaOnchainLive'
import { useWallet } from '../context/WalletContext'
import GSNBanner from '../components/GSNBanner'
import LIALaunchButton from '../components/LIALaunchButton'
import AdSlot from '../components/AdSlot'
import CommanderStrip from '../components/commander/CommanderStrip'
import ScStatusBanner from '../components/ScStatusBanner'
import DataHealthStrip from '../components/DataHealthStrip'
import PageGuide from '../components/PageGuide'
import InfoTip, { LabelWithTip } from '../components/InfoTip'
import PersonaWelcome, {
  PersonaQuickLinks,
  getStoredPersona,
  type Persona,
} from '../components/PersonaWelcome'

const QUICK = [
  { key: 'studio', name: 'Studio', icon: '🎨', desc: 'Mint & publish', color: 'text-pink-400' },
  { key: 'gallery', name: 'Gallery', icon: '🖼️', desc: 'Collections', color: 'text-purple-400' },
  { key: 'marketplace', name: 'Market', icon: '🏪', desc: 'List / Buy', color: 'text-blue-400' },
  { key: 'agents', name: 'Agents', icon: '🤖', desc: 'LIA packs', color: 'text-cyan-400' },
  { key: 'trading', name: 'LIA Trading', icon: '📈', desc: 'Vellum pack', color: 'text-green-400' },
  { key: 'tro', name: '$TRO', icon: '💎', desc: 'Token', color: 'text-yellow-400' },
]

function StatCard({
  label,
  value,
  tip,
}: {
  label: string
  value: string
  tip?: string
}) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 flex items-center gap-1">
        {label}
        {tip ? <InfoTip k={tip as any} /> : null}
      </p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { balance } = useMultiversX()
  const { totalUsd } = usePortfolioValue()
  const live = useLiaOnchainLive()
  const { address } = useWallet()
  const [persona, setPersona] = useState<Persona | null>(() => getStoredPersona())

  useEffect(() => {
    setPersona(getStoredPersona())
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageGuide page="dashboard" />
      <PrivateReleaseIfAny />

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">xArtists Command Center</h1>
        <p className="text-sm text-gray-400">
          AI trading + RWA marketplace · MultiversX mainnet · paper LIA until gates pass
        </p>
      </div>

      <ScStatusBanner />
      <DataHealthStrip />

      {!persona && (
        <PersonaWelcome
          onSelect={(p) => {
            setPersona(p)
          }}
        />
      )}
      {persona && <PersonaQuickLinks persona={persona} />}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            live.refresh()
          }}
          className="btn-secondary text-sm"
        >
          Actualiser
        </button>
      </div>

      <CommanderStrip />

      <GSNBanner />

      <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-100">
        Portfolio = wallet LIA (protocole). Ton compte →{' '}
        <Link to="/wallet" className="underline">
          /wallet · Mon wallet
        </Link>
        . $TRO supply max = <strong>500 000</strong> <InfoTip k="tro_token" />.{' '}
        <Link to="/trading" className="underline text-purple-300">
          Trading / Board
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="EGLD (live)" value={balance != null ? balance.toFixed(4) : '—'} />
        <StatCard label="Portfolio USD" value={totalUsd != null ? `$${totalUsd.toFixed(0)}` : '—'} />
        <StatCard label="NFT wallet LIA" value={String(live.nftCount ?? '—')} tip="lia_nfts" />
        <StatCard label="Session" value={address ? `${address.slice(0, 6)}…` : 'non connecté'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {QUICK.map((q) => (
          <Link
            key={q.key}
            to={`/${q.key === 'trading' ? 'trading' : q.key}`}
            className="card hover:border-purple-500/40 transition-colors"
          >
            <span className={`text-lg ${q.color}`}>{q.icon}</span>
            <p className="font-semibold text-sm mt-1">{q.name}</p>
            <p className="text-xs text-gray-500">{q.desc}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <LIALaunchButton />
        <AdSlot slotId="home_hero" />
      </div>
    </div>
  )
}

/** Soft strip if PrivateReleaseStrip is global in App; local noop helper. */
function PrivateReleaseIfAny() {
  return null
}
