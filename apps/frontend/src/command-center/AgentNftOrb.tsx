/** Decorative static pack identity, never a market mood or staking indicator. */
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'
import type { AuraMode } from '../lib/ambientAura'

export default function AgentNftOrb({
  packId,
  staked: _staked,
  aura: _aura,
  onSelect,
}: {
  packId: PackId
  staked?: boolean
  aura?: AuraMode
  onSelect?: () => void
}) {
  const pack = AGENT_PACKS.find(p => p.id === packId)
  if (!pack) return null

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className="w-full rounded-2xl border border-[color:var(--xa-border)] bg-[color:var(--xa-panel)] p-5 text-left text-[color:var(--xa-text)]"
      aria-label={pack.name + ' · aperçu statique sans signal live'}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[color:var(--xa-border)] bg-[color:var(--xa-panel2)] text-3xl" aria-hidden="true">{pack.icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--xa-muted)]">Aperçu illustratif · statique</p>
          <strong className="block text-lg">{pack.name}</strong>
          <p className="text-xs text-[color:var(--xa-muted)]">{pack.tagline}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[color:var(--xa-muted)]">
        Pas de signal agent validé · staking non vérifié · aucune aura bull/bear live
      </p>
    </button>
  )
}
