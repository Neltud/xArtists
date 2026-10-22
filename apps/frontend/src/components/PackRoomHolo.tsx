import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Salle pack — holo 360° data walls (prix, signaux, axes, tableurs). */
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'
import HoloDataRoom from './HoloDataRoom'

export default function PackRoomHolo({ packId }: { packId: PackId }) {
  const pack = AGENT_PACKS.find(p => p?.id === packId)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <p className="text-[11px] text-zinc-400">
          {xaRender(pack?.icon)} {xaRender(pack?.name)} · {xaRender(pack?.tierLabel || packId)}
        </p>
        <span className="text-[10px] text-zinc-600">{xaRender(pack?.tagline)}</span>
      </div>
      <HoloDataRoom mode={packId} height={480} />
    </div>
  )
}
