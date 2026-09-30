/**
 * Sons futuristes — Web Audio, mute par défaut (localStorage).
 * Slot: spin / reel / win / jackpot / bonus.
 */
type SoundId =
  | 'navigate'
  | 'click'
  | 'success'
  | 'buy'
  | 'sell'
  | 'whoosh'
  | 'notify'
  | 'error'
  | 'slot_spin'
  | 'slot_reel'
  | 'slot_win'
  | 'slot_jackpot'
  | 'slot_bonus'

const STORAGE_KEY = 'xartists-sfx-muted'

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    return ctx
  } catch {
    return null
  }
}

export function isSfxMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

export function setSfxMuted(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('xartists-sfx', { detail: { muted } }))
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gainPeak: number,
  delay = 0,
) {
  const ac = getCtx()
  if (!ac || isSfxMuted()) return
  if (ac.state === 'suspended') void ac.resume()
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const g = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2400
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(filter)
  filter.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function sweep(f0: number, f1: number, dur: number, peak: number) {
  const ac = getCtx()
  if (!ac || isSfxMuted()) return
  if (ac.state === 'suspended') void ac.resume()
  const t0 = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(f0, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 40), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export function playUiSound(id: SoundId) {
  if (isSfxMuted()) return
  switch (id) {
    case 'navigate':
      sweep(420, 880, 0.14, 0.045)
      tone(1320, 0.06, 'triangle', 0.03, 0.05)
      break
    case 'click':
      tone(980, 0.04, 'square', 0.025)
      break
    case 'success':
      tone(523, 0.08, 'sine', 0.05)
      tone(659, 0.1, 'sine', 0.045, 0.07)
      tone(784, 0.14, 'sine', 0.04, 0.14)
      break
    case 'buy':
      tone(660, 0.07, 'sine', 0.05)
      tone(990, 0.1, 'triangle', 0.04, 0.06)
      break
    case 'sell':
      tone(440, 0.08, 'triangle', 0.045)
      tone(330, 0.12, 'sine', 0.035, 0.05)
      break
    case 'whoosh':
      sweep(900, 180, 0.22, 0.04)
      break
    case 'notify':
      tone(880, 0.05, 'sine', 0.04)
      tone(1175, 0.08, 'sine', 0.035, 0.08)
      break
    case 'error':
      tone(200, 0.15, 'sawtooth', 0.03)
      break
    case 'slot_spin':
      sweep(200, 600, 0.18, 0.05)
      tone(400, 0.05, 'square', 0.02, 0.02)
      break
    case 'slot_reel':
      tone(180 + Math.random() * 120, 0.035, 'square', 0.018)
      break
    case 'slot_win':
      tone(523, 0.07, 'sine', 0.055)
      tone(659, 0.09, 'sine', 0.05, 0.06)
      tone(784, 0.12, 'triangle', 0.045, 0.12)
      break
    case 'slot_jackpot':
      for (let i = 0; i < 6; i++) {
        tone(400 + i * 80, 0.1, 'sine', 0.05, i * 0.07)
      }
      sweep(200, 1200, 0.45, 0.06)
      break
    case 'slot_bonus':
      tone(880, 0.08, 'triangle', 0.05)
      tone(1100, 0.1, 'sine', 0.045, 0.08)
      tone(1320, 0.14, 'sine', 0.04, 0.16)
      break
    default:
      break
  }
}

export function unlockAudio() {
  const ac = getCtx()
  if (ac?.state === 'suspended') void ac.resume()
}
