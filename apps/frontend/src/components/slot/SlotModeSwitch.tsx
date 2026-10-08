/** Fun (jeu) vs Réel — libellés publics, sans jargon. */
import { canSpinSlot } from '../../config/scStatus'

export type SlotPlayMode = 'paper' | 'chain'

/** Réel on-chain tant que spin EGLD SC n’est pas corrigé */
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
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Mode</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onConfirmReal(false)
            onChange('paper')
          }}
          className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
            mode === 'paper'
              ? 'border-emerald-400/50 bg-emerald-500/15'
              : 'border-white/10 bg-black/30 hover:border-white/20'
          }`}
        >
          <p className="text-sm font-bold text-emerald-100">Fun</p>
          <p className="text-[11px] text-zinc-400 mt-1">Crédits virtuels · pour jouer maintenant</p>
        </button>
        <button
          type="button"
          disabled={!scLive}
          onClick={() => {
            if (!scLive) return
            onChange('chain')
          }}
          className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] disabled:opacity-40 ${
            mode === 'chain' ? 'border-amber-400/50 bg-amber-500/10' : 'border-white/10 bg-black/30'
          }`}
        >
          <p className="text-sm font-bold text-amber-100">Réel</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            {scLive ? 'EGLD on-chain' : 'Bientôt disponible'}
          </p>
        </button>
      </div>
      {!REAL_SPIN_READY && (
        <p className="text-[11px] text-zinc-400 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          Le mode réel est fermé : le compte slot n’est pas <code className="text-zinc-300">payable</code>{' '}
          (probe 8 oct, <code className="text-zinc-300">isPayable=false</code>). Un envoi EGLD est
          rejeté avant le tirage. House 0,5 EGLD intacte. Joue en{' '}
          <strong className="text-zinc-200">Fun</strong>.
        </p>
      )}
      {mode === 'chain' && !confirmedReal && scLive && (
        <label className="flex items-start gap-2 text-[12px] text-zinc-400">
          <input
            type="checkbox"
            checked={confirmedReal}
            onChange={e => onConfirmReal(e.target.checked)}
          />
          Je confirme une mise réelle en EGLD.
        </label>
      )}
    </div>
  )
}
