/** FUN vs RÉEL — réel désactivé tant que spinEgld bytecode bug (ESDT expected). */
import { canSpinSlot } from '../../config/scStatus'

export type SlotPlayMode = 'paper' | 'chain'

/** Probe mainnet: spin EGLD path broken until SC upgrade */
const REAL_SPIN_READY = false

type Props = {
  mode: SlotPlayMode
  onChange: (m: SlotPlayMode) => void
  confirmedReal: boolean
  onConfirmReal: (v: boolean) => void
}

export default function SlotModeSwitch({ mode, onChange, confirmedReal, onConfirmReal }: Props) {
  const scLive = canSpinSlot() && REAL_SPIN_READY

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Choix de jeu</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onConfirmReal(false)
            onChange('paper')
          }}
          className={`rounded-2xl border p-3 text-left ${
            mode === 'paper'
              ? 'border-emerald-400/50 bg-emerald-500/15'
              : 'border-white/10 bg-black/30'
          }`}
        >
          <p className="text-sm font-bold text-emerald-100">Fun</p>
          <p className="text-[11px] text-zinc-400 mt-1">Crédits virtuels · rien n’est retirable</p>
        </button>
        <button
          type="button"
          disabled={!scLive}
          onClick={() => {
            if (!scLive) return
            onChange('chain')
          }}
          className={`rounded-2xl border p-3 text-left disabled:opacity-40 ${
            mode === 'chain' ? 'border-amber-400/50 bg-amber-500/10' : 'border-white/10 bg-black/30'
          }`}
        >
          <p className="text-sm font-bold text-amber-100">Réel</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            {scLive ? 'EGLD on-chain' : 'Bientôt · upgrade SC'}
          </p>
        </button>
      </div>
      {!REAL_SPIN_READY && (
        <p className="text-[11px] text-amber-200/85 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          Mode réel en pause : le contrat slot renvoie une erreur de paiement EGLD. Joue en{' '}
          <strong>Fun</strong> en attendant la mise à jour on-chain.
        </p>
      )}
      {mode === 'chain' && !confirmedReal && scLive && (
        <label className="flex items-start gap-2 text-[12px] text-zinc-400">
          <input
            type="checkbox"
            checked={confirmedReal}
            onChange={e => onConfirmReal(e.target.checked)}
          />
          Je comprends que les mises réelles partent au contrat.
        </label>
      )}
    </div>
  )
}
