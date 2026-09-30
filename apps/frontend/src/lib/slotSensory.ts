/**
 * Slot sensory — audio duck + LIA jackpot broadcast (non-blocking).
 */

import { setEmpireAudioVolume, getEmpireState } from '../store/empireStore'

const JACKPOT_MULT = 20 // tableGross / cost threshold for LIA fanfare

let duckRestore: number | null = null

/** Duck ambient music during spin animation */
export function duckAmbientForSpin(ms = 2200): void {
  try {
    const prev = getEmpireState().audioVolume
    if (duckRestore == null) duckRestore = prev
    setEmpireAudioVolume(Math.min(prev, 0.12))
    window.setTimeout(() => {
      if (duckRestore != null) {
        setEmpireAudioVolume(duckRestore)
        duckRestore = null
      }
    }, ms)
  } catch {
    /* */
  }
}

export function isJackpotWin(tableGross: number, cost: number): boolean {
  if (!(cost > 0)) return tableGross > 0 && tableGross >= 50
  return tableGross / cost >= JACKPOT_MULT || tableGross >= cost * JACKPOT_MULT
}

/** Notify LIA terminal + optional custom event for particles */
export function announceSlotResult(opts: {
  win: boolean
  jackpot: boolean
  kind: string
  amountLabel: string
  fairHash?: string
}): void {
  const detail = {
    type: opts.jackpot ? 'SLOT_JACKPOT' : opts.win ? 'SLOT_WIN' : 'SLOT_LOSS',
    kind: opts.kind,
    amount: opts.amountLabel,
    fairHash: opts.fairHash,
    ts: Date.now(),
  }
  window.dispatchEvent(new CustomEvent('xartists:slot-result', { detail }))
  if (opts.jackpot) {
    window.dispatchEvent(
      new CustomEvent('xartists:lia-line', {
        detail: {
          phrase: `Jackpot slot · ${opts.kind} · ${opts.amountLabel}. LIA félicite le holder.`,
        },
      }),
    )
  } else if (opts.win) {
    window.dispatchEvent(
      new CustomEvent('xartists:lia-line', {
        detail: { phrase: `Gain slot · ${opts.kind} · ${opts.amountLabel}` },
      }),
    )
  }
}

export { JACKPOT_MULT }
