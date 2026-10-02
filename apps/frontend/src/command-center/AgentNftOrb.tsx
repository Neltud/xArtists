/**
 * NFT agent orb — aura 4 modes from ambient state (bull/bear/reward/stable).
 */
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'
import { useI18n } from '../i18n/I18nContext'
import { AURA_ORB, type AuraMode } from '../lib/ambientAura'

export default function AgentNftOrb({
  packId,
  staked,
  aura = 'stable',
  onSelect,
}: {
  packId: PackId
  staked?: boolean
  aura?: AuraMode
  onSelect?: () => void
}) {
  const { t } = useI18n()
  const pack = AGENT_PACKS.find(p => p?.id === packId)
  if (!pack) return null

  const a = AURA_ORB[aura] || AURA_ORB.stable

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-2xl border ${a.ring} bg-[#06080f] overflow-hidden p-4 text-left transition`}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${a.glow} pointer-events-none`} />
      <div className="relative flex items-center gap-4">
        <div
          className={`w-20 h-20 rounded-full border border-white/25 bg-black/50 flex items-center justify-center text-4xl ${a.pulse}`}
          aria-hidden
        >
          {pack.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{t('cc.agent.visual')}</p>
            <span className="text-[9px] rounded-full border border-white/15 px-1.5 py-0.5 text-zinc-400 font-tech">
              {a.label}
            </span>
          </div>
          <p className="text-lg font-semibold text-white">
            {pack.icon} {pack.name}
          </p>
          <p className="text-[12px] text-zinc-400 line-clamp-2">{pack.tagline}</p>
          <p className="text-[11px] mt-1 tabular-nums text-zinc-500">
            {staked ? '\u25cf staked \u00b7 clone arm\u00e9' : '\u25cb free \u00b7 stake pour claim'}
          </p>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 h-8 opacity-15"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px)',
          animation: 'xartists-holo-scan 4s linear infinite',
        }}
      />
    </button>
  )
}
