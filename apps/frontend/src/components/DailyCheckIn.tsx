/** Claim quotidien 1 pt · +3 pts série 7 jours */
import { useDailyPoints } from '../hooks/useDailyPoints'

export default function DailyCheckIn() {
  const { totalPoints, streak, canClaimToday, claim, lastClaimDay } = useDailyPoints()

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-zinc-950 to-cyan-950/20 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Parcours · points
          </p>
          <p className="text-[12px] text-zinc-500 mt-1">
            +1 pt / jour · +3 pts tous les 7 jours de série
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white tabular-nums">{totalPoints}</p>
          <p className="text-[10px] text-zinc-500">points · série {streak}j</p>
        </div>
      </div>

      <button
        type="button"
        disabled={!canClaimToday}
        onClick={claim}
        className="w-full rounded-xl bg-cyan-400/90 text-zinc-950 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-300 transition"
      >
        {canClaimToday ? 'Réclamer +1 pt aujourd’hui' : 'Déjà réclamé aujourd’hui'}
      </button>

      {lastClaimDay && (
        <p className="text-[10px] text-zinc-600 text-center">Dernier claim : {lastClaimDay} (UTC)</p>
      )}
    </section>
  )
}
