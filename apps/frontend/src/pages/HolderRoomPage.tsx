import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Salle holder (Pulse / Yield / Sentinel) — accès pack + onglets DeFi.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { holderStatus, canEnterRoom, ROOM_META } from '../lib/holderAccess'
import PackRoomHolo from '../components/PackRoomHolo'
import PackAgentMonitor from '../components/PackAgentMonitor'
import DeFiCommandPanel from '../components/defi/DeFiCommandPanel'
import TroLiquidityPanel from '../components/defi/TroLiquidityPanel'
import TroHolderBoard from '../components/analytics/TroHolderBoard'

type EcoTab = 'defi' | 'liquidity' | 'holders'

export default function HolderRoomPage() {
  const { packId: raw } = useParams<{ packId: string }>()
  const packId = (raw === 'pulse' || raw === 'yield' || raw === 'sentinel' ? raw : 'pulse') as PackId
  const { connected, nfts } = useWallet()
  const status = useMemo(() => holderStatus(nfts || []), [nfts])
  const pack = AGENT_PACKS.find(p => p.id === packId) || AGENT_PACKS[0]
  const meta = ROOM_META[packId]
  const [ecoTab, setEcoTab] = useState<EcoTab>('defi')

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
          <p className="section-label">{xaRender("Salle réservée")}</p>
          <h1 className="section-title display text-2xl">
            {xaRender(meta.emoji)} {xaRender(meta.title)}
          </h1>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            {xaRender("Accès réservé au pack ")}<strong className="text-zinc-300">{xaRender(pack.name)}</strong>.
          </p>
        </header>
        {xaRender(!connected && (
          <button type="button" className="btn-primary w-full" onClick={() => requestOpenConnect()}>
            {xaRender("Connecter wallet ")}</button>
        ))}
        <Link to="/agents" className="btn-secondary w-full text-center block">
          {xaRender("Obtenir ")}{xaRender(pack.name)}
        </Link>
        <Link to="/my-packs" className="text-[12px] text-zinc-500 block text-center">
          {xaRender("← My Packs ")}</Link>
      </div>
    )
  }

  const tabs: { id: EcoTab; label: string }[] = [
    { id: 'defi', label: '📊 Dashboard Hub' },
    { id: 'liquidity', label: '💧 Liquidité $TRO' },
    { id: 'holders', label: '🏆 Top Holders' },
  ]

  return (
    <div className="animate-fade-in space-y-5 pb-20 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            {xaRender("Salle holder · ")}{xaRender(source)}
          </p>
          <h1 className="display text-2xl sm:text-3xl text-white mt-1">
            {xaRender(meta.emoji)} {xaRender(meta.title)}
          </h1>
          <p className="text-[12px] text-zinc-400 mt-1">{xaRender(meta.blurb || pack.tagline)}</p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-200">
          {xaRender("accès OK ")}</span>
      </div>

      <PackRoomHolo packId={packId} />
      <PackAgentMonitor packId={packId} />

      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] w-fit flex-wrap">
        {xaRender(tabs.map(t => (
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
            {xaRender(t.label)}
          </button>
        )))}
      </div>

      {xaRender(ecoTab === 'defi' && <DeFiCommandPanel hideTroLiquidity />)}
      {xaRender(ecoTab === 'liquidity' && <TroLiquidityPanel />)}
      {xaRender(ecoTab === 'holders' && <TroHolderBoard />)}

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/90">
          {xaRender("Desk trading ")}</p>
        <p className="text-[12px] text-zinc-400 leading-relaxed">
          {xaRender("Signaux pack + exécution uniquement si tu signes (xPortal). ")}</p>
        <div className="flex flex-wrap gap-2">
          <Link to={`/trading?pack=${packId}&desk=1`} className="btn-primary text-sm">
            {xaRender("Ouvrir le desk ")}</Link>
          <Link to="/lia" className="btn-secondary text-sm">
            {xaRender("LIA Hub ")}</Link>
          <Link to="/command-center" className="btn-secondary text-sm">
            {xaRender("Command Center ")}</Link>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/my-packs" className="hover:text-zinc-300">
          {xaRender("My Packs ")}</Link>
        <Link to="/agents" className="hover:text-zinc-300">
          {xaRender("Packs ")}</Link>
      </div>
    </div>
  )
}
