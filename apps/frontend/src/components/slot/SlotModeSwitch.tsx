/**
 * Intentional risk choice — MODE FUN (paper) vs MODE REAL (on-chain).
 * On-chain locked unless canSpinSlot() + explicit confirm.
 */
import { canSpinSlot } from '../../config/scStatus'

export type SlotPlayMode = 'paper' | 'chain'

type Props = {
  mode: SlotPlayMode
  onChange: (m: SlotPlayMode) => void
  confirmedReal: boolean
  onConfirmReal: (v: boolean) => void
}

export default function SlotModeSwitch({ mode, onChange, confirmedReal, onConfirmReal }: Props) {
  const scLive = canSpinSlot()

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
        Choix de risque
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onConfirmReal(false)
            onChange('paper')
          }}
          className={`rounded-2xl border p-3 text-left transition ${
            mode === 'paper'
              ? 'border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'border-white/10 bg-black/30 hover:border-white/20'
          }`}
        >
          <p className="text-sm font-bold text-emerald-100">MODE FUN</p>
          <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
            Paper · sans risque · SFX · banque locale
          </p>
          <p className="text-[9px] text-emerald-300/80 mt-2 uppercase tracking-wider">Default</p>
        </button>

        <button
          type="button"
          disabled={!scLive}
          onClick={() => {
            if (!scLive) return
            onChange('chain')
          }}
          className={`rounded-2xl border p-3 text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
            mode === 'chain'
              ? 'border-amber-400/50 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'border-white/10 bg-black/30 hover:border-white/20'
          }`}
          title={scLive ? 'On-chain spinEgld' : 'VITE_SLOT_CASINO_CODEHASH_OK=1 requis'}
        >
          <p className="text-sm font-bold text-amber-100">
            MODE REAL {scLive ? '' : '🔒'}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
            On-chain · EGLD réel · signature wallet
          </p>
          <p className="text-[9px] text-amber-300/80 mt-2 uppercase tracking-wider">
            {scLive ? 'CODEHASH ok' : 'Gated'}
          </p>
        </button>
      </div>

      {mode === 'chain' && scLive && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-3 space-y-2">
          <p className="text-xs font-semibold text-amber-100">
            Attention : vous jouez avec vos fonds réels.
          </p>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            spinEgld envoie de l’EGLD au SC. House edge on-chain. Pas un investissement. Confirme
            explicitement avant le premier spin.
          </p>
          <label className="flex items-start gap-2 text-[11px] text-amber-100 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={confirmedReal}
              onChange={e => onConfirmReal(e.target.checked)}
            />
            <span>Je comprends — activer les spins on-chain</span>
          </label>
        </div>
      )}

      {!scLive && (
        <p className="text-[10px] text-zinc-600">
          MODE REAL verrouillé tant que le secret CODEHASH + fund SC ne sont pas posés (ops).
        </p>
      )}
    </div>
  )
}
