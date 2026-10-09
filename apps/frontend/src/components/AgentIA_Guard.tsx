/**
 * AgentIA_Guard — Command Center access.
 * SAMPLE preview: non-holders can VIEW hub (read-only banner).
 * Rooms pulse/yield/sentinel still require pack via requirePack.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAgentAccess } from '../store/empireStore'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { isAdminAddress } from '../config/accessControl'

type Props = {
  children: ReactNode
  requirePack?: 'pulse' | 'yield' | 'sentinel'
  /** if true, block entirely without access (default false = SAMPLE preview) */
  strict?: boolean
}

export default function AgentIA_Guard({ children, requirePack, strict = false }: Props) {
  const { connected, address } = useWallet()
  const access = useAgentAccess()

  const admin = isAdminAddress(address)
  const ok =
    admin ||
    (access.hasAgentAccess && (!requirePack || access.packs.includes(requirePack)))

  if (ok) return <>{children}</>

  // SAMPLE preview: show children with banner unless strict or room-locked
  if (!strict && !requirePack) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-[12px] text-amber-100/90">
          Aperçu SAMPLE — connecte un pack Agent IA pour déverrouiller les salles et les TX.
          {!connected && (
            <>
              {' '}
              <button type="button" className="underline font-medium" onClick={requestOpenConnect}>
                Connecter
              </button>
            </>
          )}
          {connected && (
            <>
              {' '}
              <Link to="/agents" className="underline font-medium">
                Packs
              </Link>
            </>
          )}
        </div>
        {children}
      </div>
    )
  }

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
              : 'Cette zone est réservée aux holders d’un Agent IA Pack.'}
        </p>
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
          <Link to="/" className="btn-secondary text-sm">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
