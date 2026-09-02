import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import { HELP } from '../content/helpCopy'

const TABS = ['TRO', 'NFT', 'Rewards', 'Help'] as const

export default function StakingPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('TRO')

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
          Staking
          <InfoTip k="liaVsUser" />
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Lock $TRO ou stake NFT xArtists — wallet <strong className="text-green-300">utilisateur</strong>{' '}
          uniquement. SC staking non live = UI informative.
        </p>
      </header>

      <PageGuide page="staking" />
      <LiaVsUserBanner tone="user" />

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90">
        Endpoints stake / unstake / claim <strong>désactivés</strong> tant que le SC staking n’est pas
        déployé + codeHash. Pas de faux bouton qui simule un envoi.
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] w-fit flex-wrap">
        {TABS.map(t => (
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
          <h2 className="font-semibold">$TRO staking (design)</h2>
          <ul className="text-sm text-zinc-400 space-y-2">
            <li>
              <strong className="text-zinc-200">Flexible</strong> — unstake anytime
            </li>
            <li>
              <strong className="text-zinc-200">Bonded 30 / 90 j</strong> — APR plus élevé (policy)
            </li>
            <li>
              <strong className="text-zinc-200">Vote-locked</strong> — pouvoir DAO
            </li>
          </ul>
          <button type="button" disabled className="btn-secondary text-sm opacity-50 cursor-not-allowed">
            Stake $TRO — SC bientôt
          </button>
        </div>
      )}

      {tab === 'NFT' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">NFT staking</h2>
          <p className="text-sm text-zinc-400">
            Stake collections xArtists pour rewards / boost. Activation post-deploy SC.
          </p>
          <Link to="/gallery" className="btn-secondary text-sm inline-block">
            Voir la galerie →
          </Link>
        </div>
      )}

      {tab === 'Rewards' && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Rewards report</h2>
          <p className="text-sm text-zinc-400">
            Rapport paper Vellum → <code className="text-[10px]">data/rewards_report.json</code> quand le
            workflow tourne.
          </p>
        </div>
      )}

      {tab === 'Help' && (
        <div className="card text-sm text-zinc-400 space-y-2">
          <p>
            <strong className="text-zinc-200">Gas :</strong> garder de l’EGLD.
          </p>
          <p>
            <strong className="text-zinc-200">Risque :</strong> rewards non garantis.
          </p>
          <p>
            <strong className="text-zinc-200">Wallet :</strong> {HELP.liaVsUser.body}
          </p>
          <Link to="/dao" className="text-purple-300 underline text-xs">
            DAO / policy →
          </Link>
        </div>
      )}
    </div>
  )
}
