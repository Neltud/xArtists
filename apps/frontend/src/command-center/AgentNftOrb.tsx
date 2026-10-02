/**
 * Visuel NFT agent dans la salle CC — orbe holo + identité pack.
 */
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'
import { useI18n } from '../i18n/I18nContext'

const GLOW: Record<PackId, string> = {
  pulse: 'from-emerald-500/40 via-emerald-300/10 to-transparent',
  yield: 'from-amber-500/35 via-amber-200/10 to-transparent',
  sentinel: 'from-sky-500/40 via-cyan-200/10 to-transparent',
}

const RING: Record<PackId, string> = {
  pulse: 'border-emerald-400/40 shadow-[0_0_40px_-8px_rgba(52,211,153,0.55)]',
  yield: 'border-amber-400/40 shadow-[0_0_40px_-8px_rgba(245,158,11,0.5)]',
  sentinel: 'border-sky-400/40 shadow-[0_0_40px_-8px_rgba(56,189,248,0.55)]',
}

export default function AgentNftOrb({
  packId,
  staked,
  onSelect,
}: {
  packId: PackId
  staked?: boolean
  onSelect?: () => void
}) {
  const { t } = useI18n()
  const pack = AGENT_PACKS.find(p => p?.id === packId)
  if (!pack) return null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-2xl border ${RING[packId]} bg-[#06080f] overflow-hidden p-4 text-left transition hover:brightness-110`}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${GLOW[packId]} pointer-events-none`} />
      <div className="relative flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full border border-white/20 bg-black/50 flex items-center justify-center text-4xl animate-pulse"
          style={{ animationDuration: '2.8s' }}
          aria-hidden
        >
          {pack.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">{t('cc.agent.visual')}</p>
          <p className="text-lg font-semibold text-white">
            {pack.icon} {pack.name}
          </p>
          <p className="text-[12px] text-zinc-400 line-clamp-2">{pack.tagline}</p>
          <p className="text-[11px] mt-1 tabular-nums text-zinc-500">
            {staked ? '● staked · clone armé' : '○ free · stake pour claim'}
          </p>
        </div>
      </div>
      {/* holo scan lines */}
      <div
        className="pointer-events-none absolute inset-x-0 h-8 opacity-20"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px)',
          animation: 'xartists-holo-scan 4s linear infinite',
        }}
      />
    </button>
  )
}
