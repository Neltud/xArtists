/** Claim quotidien on-chain · +1 pt / jour · +3 pts serie 7 j */
import { useDailyPoints } from '../hooks/useDailyPoints'
import { requestOpenConnect } from '../lib/walletEvents'

export default function DailyCheckIn() {
  const {
    totalPoints,
    streak,
    canClaimToday,
    claim,
    lastClaimDay,
    claiming,
    claimError,
    needsWallet,
    lastTxHash,
  } = useDailyPoints()

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-zinc-950 to-cyan-950/20 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Parcours · points on-chain
          </p>
          <p className="text-[12px] text-zinc-500 mt-1">
            +1 pt / jour · +3 pts tous les 7 jours · TX MultiversX
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white tabular-nums">{totalPoints}</p>
          <p className="text-[10px] text-zinc-500">points · serie {streak}j</p>
        </div>
      </div>

      {needsWallet ? (
        <button
          type="button"
          onClick={() => requestOpenConnect()}
          className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-100 py-2.5 text-sm font-semibold hover:bg-cyan-500/20 transition"
        >
          Connecter le wallet pour claim on-chain
        </button>
      ) : (
        <button
          type="button"
          disabled={!canClaimToday || claiming}
          onClick={() => void claim()}
          className="w-full rounded-xl bg-cyan-400/90 text-zinc-950 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-300 transition"
        >
          {claiming
            ? 'Signature / broadcast…'
            : canClaimToday
              ? 'Reclamer +1 pt (TX on-chain)'
              : 'Deja reclame aujourd hui'}
        </button>
      )}

      {claimError && (
        <p className="text-[11px] text-amber-200/90 text-center leading-relaxed">{claimError}</p>
      )}

      {lastClaimDay && (
        <p className="text-[10px] text-zinc-600 text-center">
          Dernier claim : {lastClaimDay} (UTC)
          {lastTxHash && lastTxHash !== 'wallet-hook' && lastTxHash !== 'submitted'
            ? ` · ${lastTxHash.slice(0, 10)}…`
            : ''}
        </p>
      )}
    </section>
  )
}
