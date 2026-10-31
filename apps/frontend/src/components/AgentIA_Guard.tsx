import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
  const packs = access?.packs ?? []
  const hasAccess = Boolean(access?.hasAgentAccess)

  const admin = isAdminAddress(address)
  const ok =
    admin ||
    (hasAccess && (!requirePack || packs.includes(requirePack)))

  if (ok) return <>{xaRender(children)}</>

  if (!strict && !requirePack) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 px-3 py-2.5 text-[12px] leading-relaxed text-amber-50/90">
          <span className="font-semibold tracking-wide text-amber-100">SAMPLE · lecture seule</span>
          <span className="text-amber-100/70"> — </span>
          {xaRender(
            'Indicateurs paper visibles. Les salles pack et les TX restent verrouillées jusqu’à détention NFT (Pulse / Yield / Sentinel).',
          )}
          {xaRender(
            !connected && (
              <>
                {' '}
                <button type="button" className="underline font-medium text-amber-50" onClick={requestOpenConnect}>
                  {xaRender('Connecter le wallet')}
                </button>
              </>
            ),
          )}
          {xaRender(
            connected && (
              <>
                {' '}
                <Link to="/intelligence/agents" className="underline font-medium text-amber-50">
                  {xaRender('Voir les packs')}
                </Link>
              </>
            ),
          )}
        </div>
        {xaRender(children)}
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a12] p-6 space-y-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">
          {xaRender('Command Center · Restricted')}
        </p>
        <h1 className="text-xl font-bold text-white tracking-tight">{xaRender('Accès requis')}</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {xaRender(
            !connected
              ? 'Connecte ton wallet pour vérifier la détention d’un pack Agent IA.'
              : requirePack
                ? `Pack ${requirePack} requis pour cette salle.`
                : 'Un pack Agent IA (Pulse / Yield / Sentinel) est requis.',
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {xaRender(
            !connected ? (
              <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
                {xaRender('Connecter')}
              </button>
            ) : (
              <Link to="/intelligence/agents" className="btn-primary text-sm inline-flex items-center">
                {xaRender('Voir les packs')}
              </Link>
            ),
          )}
          <Link to="/" className="btn-secondary text-sm inline-flex items-center">
            {xaRender('Accueil')}
          </Link>
        </div>
      </div>
    </div>
  )
}
