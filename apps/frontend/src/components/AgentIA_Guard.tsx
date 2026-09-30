/**
 * AgentIA_Guard — Command Center access wrapper.
 * Access if hasAgentAccess (Pulse | Yield | Sentinel pack NFT or paper).
 * Does NOT modify Museum routes.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAgentAccess } from '../store/empireStore'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

type Props = {
  children: ReactNode
  /** Require specific pack rooms */
  requirePack?: 'pulse' | 'yield' | 'sentinel'
}

export default function AgentIA_Guard({ children, requirePack }: Props) {
  const { connected } = useWallet()
  const access = useAgentAccess()

  const ok =
    access.hasAgentAccess &&
    (!requirePack || access.packs.includes(requirePack))

  if (ok) return <>{children}</>

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/25 bg-[#0a0a12] p-6 space-y-4 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/80 font-semibold">
          Command Center · Restricted
        </p>
        <h1 className="text-xl font-bold text-white tracking-tight">Access Denied</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {!connected
            ? 'Connecte ton wallet pour vérifier la détention d’un Agent IA Pack (Pulse · Yield · Sentinel).'
            : requirePack
              ? `Salle réservée aux holders du pack « ${requirePack} ».`
              : 'Cette zone est réservée aux holders d’un Agent IA Pack (on-chain ou paper device).'}
        </p>
        <ul className="text-[11px] text-zinc-500 space-y-1 mono">
          <li>Collections: xAiAx · xAiAy · xAiAs</li>
          <li>
            Status: {access.source} · packs [{access.packs.join(', ') || '—'}]
          </li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-1">
          {!connected ? (
            <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
              Connect Wallet
            </button>
          ) : (
            <Link to="/agents" className="btn-primary text-sm">
              Obtenir un Pack
            </Link>
          )}
          <Link to="/my-packs" className="btn-secondary text-sm">
            My Packs
          </Link>
          <Link to="/museum" className="btn-secondary text-sm">
            Musée (public)
          </Link>
        </div>
      </div>
    </div>
  )
}
