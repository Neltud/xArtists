/**
 * Salle holder — holo 360 data + moniteur agent dense + onglets écosystème $TRO.
 */
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { holderStatus, canEnterRoom, ROOM_META } from '../lib/holderAccess'
import { requestOpenConnect } from '../lib/walletEvents'
import PackAgentMonitor from '../components/PackAgentMonitor'
import PackRoomHolo from '../components/PackRoomHolo'
import TroHolderBoard from '../components/analytics/TroHolderBoard'
import TroLiquidityPanel from '../components/defi/TroLiquidityPanel'
import DeFiCommandPanel from '../components/defi/DeFiCommandPanel'

const VALID: PackId[] = ['pulse', 'yield', 'sentinel']

type EcoTab = 'defi' | 'liquidity' | 'holders'

function isPackId(v: string | undefined): v is PackId {
  return !!v && VALID.includes(v as PackId)
}

export default function HolderRoomPage() {
  const { packId: raw } = useParams<{ packId: string }>()
  const packId = isPackId(raw) ? raw : null
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const status = useMemo(() => holderStatus(account.nfts), [account.nfts, account.refreshedAt])
  const [ecoTab, setEcoTab] = useState<EcoTab>(packId === 'yield' ? 'liquidity' : 'holders')

  if (!packId) return <Navigate to="/my-packs" replace />

  const meta = ROOM_META[packId]
  const pack = AGENT_PACKS.find(p => p.id === packId)!
  const allowed = canEnterRoom(status, packId)
  const source = status.onchain.includes(packId)
    ? 'on-chain'
    : status.paper.includes(packId)
      ? 'paper device'
      : null

  if (!allowed) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto space-y-6 pb-16">
        <header className="space-y-2">
          <p className="section-label">Salle réservée</p>
          <h1 className="section-title display text-2xl">
            {meta.emoji} {meta.title}
          </h1>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            Accès réservé au pack <strong className="text-zinc-300">{pack.name}</strong>.
          </p>
        </header>
        {!connected && (
          <button type="button" className="btn-primary w-full" onClick={() => requestOpenConnect()}>
            Connecter wallet
          </button>
        )}
        <Link to="/agents" className="btn-secondary w-full text-center block">
          Obtenir {pack.name}
        </Link>
        <Link to="/my-packs" className="text-[12px] text-zinc-500 block text-center">
          ← My Packs
        </Link>
      </div>
    )
  }

  const tabs: { id: EcoTab; label: string }[] = [
    { id: 'defi', label: 'Hub DeFi' },
    { id: 'liquidity', label: 'Liquidité $TRO' },
    { id: 'holders', label: 'Leaderboard Holders' },
  ]

  return (
    <div className="animate-fade-in space-y-5 pb-20 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            Salle holder · {source}
          </p>
          <h1 className="display text-2xl sm:text-3xl text-white mt-1">
            {meta.emoji} {meta.title}
          </h1>
          <p className="text-[12px] text-zinc-400 mt-1">{meta.blurb || pack.tagline}</p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-200">
          accès OK
        </span>
      </div>

      <PackRoomHolo packId={packId} />
      <PackAgentMonitor packId={packId} />

      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setEcoTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              ecoTab === t.id
                ? 'bg-cyan-600/25 text-cyan-100 border border-cyan-400/30'
                : 'text-zinc-500 hover:text-white border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {ecoTab === 'defi' && <DeFiCommandPanel hideTroLiquidity />}
      {ecoTab === 'liquidity' && <TroLiquidityPanel />}
      {ecoTab === 'holders' && <TroHolderBoard />}

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/90">
          Desk trading
        </p>
        <p className="text-[12px] text-zinc-400 leading-relaxed">
          Signaux pack + exécution uniquement si tu signes (xPortal).
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to={`/trading?pack=${packId}&desk=1`} className="btn-primary text-sm">
            Ouvrir le desk
          </Link>
          <Link to="/lia" className="btn-secondary text-sm">
            LIA Hub
          </Link>
          <Link to="/command-center" className="btn-secondary text-sm">
            Command Center
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/my-packs" className="hover:text-zinc-300">
          My Packs
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          Packs
        </Link>
      </div>
    </div>
  )
}
