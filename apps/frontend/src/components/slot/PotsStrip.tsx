/** Two pots — never mix paper and chain. */
import { getCachedHouseEgld } from '../../lib/slotHouseGuard'

export default function PotsStrip({
  virtualEgld,
  onTapVirtual,
}: {
  virtualEgld: number
  onTapVirtual?: () => void
}) {
  const house = getCachedHouseEgld()
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onTapVirtual}
        className="rounded-xl border border-white/10 bg-black/30 p-3 text-left"
      >
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Cagnotte virtuelle</p>
        <p className="text-lg text-white tabular-nums">{virtualEgld.toFixed(2)} EGLD</p>
        <p className="text-[10px] text-zinc-500 mt-1">Play credits · non retirables</p>
      </button>
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
        <p className="text-[10px] uppercase tracking-wider text-amber-200/80">Caisse on-chain</p>
        <p className="text-lg text-amber-50 tabular-nums">
          {house == null ? '…' : `${house.toFixed(2)} EGLD`}
        </p>
        <p className="text-[10px] text-zinc-500 mt-1">Pool réel du contrat</p>
      </div>
    </div>
  )
}
