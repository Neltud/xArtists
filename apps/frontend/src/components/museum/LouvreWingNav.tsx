import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../../i18n/phraseRuntime'
/**
 * Minimap / sélecteur salles — Louvre M1.
 */
import { LOUVRE_M1_WING, type LouvreRoomId } from '../../lib/louvreM1'

type Props = {
  activeId: LouvreRoomId | string
  onSelect: (id: LouvreRoomId) => void
}

export default function LouvreWingNav({ activeId, onSelect }: Props) {
  xaUsePhraseLocale()

  return (
    <div className="xa-louvre-wing-nav rounded-2xl border border-white/10 bg-black/50 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          {xaLocalize('Louvre M1 · aile')}
        </p>
        <p className="text-[10px] text-zinc-600">{xaRender(LOUVRE_M1_WING.length)} salles</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {xaRender(
          LOUVRE_M1_WING.map((room, idx) => {
            const active = room.id === activeId
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelect(room.id)}
                className={`rounded-xl border px-2.5 py-2 text-left transition ${
                  active
                    ? 'border-lime-400/50 bg-lime-500/15 text-lime-100'
                    : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25'
                }`}
              >
                <span className="block text-[10px] tabular-nums text-zinc-500">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="block text-[12px] font-medium leading-tight">{xaRender(room.short)}</span>
                <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                  {xaRender(room.label)}
                </span>
              </button>
            )
          }),
        )}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-zinc-600">
        {xaLocalize('Collections on-chain ALISTOR · BGG · XAUS accrochées par salle. Égalité fiat/crypto hors musée (Rule1).')}
      </p>
    </div>
  )
}
