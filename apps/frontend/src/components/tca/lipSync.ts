/**
 * TCA lip-sync — approximate visemes driven by TTS + text timing.
 * No external audio dependency; uses Web Speech API boundary events when available.
 */

export type Viseme =
  | 'rest'
  | 'A' // open
  | 'E' // mid
  | 'I' // narrow
  | 'O' // round
  | 'U' // pout
  | 'M' // closed
  | 'F' // teeth
  | 'S' // hiss

/** Mouth shape targets (procedural mesh offsets). */
export type MouthShape = {
  open: number // 0–1 jaw drop
  width: number // 0–1 lip stretch
  round: number // 0–1 O/U
}

const SHAPES: Record<Viseme, MouthShape> = {
  rest: { open: 0.02, width: 0.35, round: 0.1 },
  A: { open: 0.85, width: 0.55, round: 0.15 },
  E: { open: 0.4, width: 0.7, round: 0.05 },
  I: { open: 0.25, width: 0.75, round: 0.0 },
  O: { open: 0.55, width: 0.35, round: 0.85 },
  U: { open: 0.35, width: 0.25, round: 0.95 },
  M: { open: 0.0, width: 0.4, round: 0.2 },
  F: { open: 0.12, width: 0.5, round: 0.1 },
  S: { open: 0.15, width: 0.55, round: 0.05 },
}

function charToViseme(ch: string): Viseme {
  const c = ch.toLowerCase()
  if ('mbp'.includes(c)) return 'M'
  if ('fv'.includes(c)) return 'F'
  if ('szcj'.includes(c)) return 'S'
  if ('aàâäá'.includes(c)) return 'A'
  if ('eéèêë'.includes(c)) return 'E'
  if ('iîïíy'.includes(c)) return 'I'
  if ('oôöó'.includes(c)) return 'O'
  if ('uùûüúw'.includes(c)) return 'U'
  if (/[aeiouyàâäéèêëïîôùûü]/i.test(c)) return 'A'
  return 'rest'
}

/** Build a timed viseme track from plain text (fallback when no audio analysis). */
export function buildVisemeTrack(
  text: string,
  durationSec: number,
): { t: number; viseme: Viseme }[] {
  const chars = text.replace(/\s+/g, ' ').trim().split('')
  if (!chars.length || durationSec <= 0) return [{ t: 0, viseme: 'rest' }]
  const track: { t: number; viseme: Viseme }[] = [{ t: 0, viseme: 'rest' }]
  const step = durationSec / Math.max(chars.length, 1)
  chars.forEach((ch, i) => {
    track.push({ t: i * step, viseme: charToViseme(ch) })
  })
  track.push({ t: durationSec, viseme: 'rest' })
  return track
}

/** Estimate spoken duration (seconds) from text length. */
export function estimateSpeechDuration(text: string, rate = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  // ~2.5 words/sec at rate 1
  return Math.max(0.8, (words / 2.5) / Math.max(0.5, rate))
}

export function shapeAt(
  track: { t: number; viseme: Viseme }[],
  timeSec: number,
): MouthShape {
  if (!track.length) return SHAPES.rest
  let cur = track[0]
  for (const k of track) {
    if (k.t <= timeSec) cur = k
    else break
  }
  return SHAPES[cur.viseme] || SHAPES.rest
}

export type LipSyncController = {
  speaking: boolean
  t0: number
  duration: number
  track: { t: number; viseme: Viseme }[]
  shape: MouthShape
}

export function createLipSyncState(): LipSyncController {
  return {
    speaking: false,
    t0: 0,
    duration: 0,
    track: [{ t: 0, viseme: 'rest' }],
    shape: SHAPES.rest,
  }
}

export function startLipSync(
  state: LipSyncController,
  text: string,
  opts?: { rate?: number; now?: number },
) {
  const rate = opts?.rate ?? 1
  const duration = estimateSpeechDuration(text, rate)
  state.speaking = true
  state.t0 = opts?.now ?? performance.now() / 1000
  state.duration = duration
  state.track = buildVisemeTrack(text, duration)
  state.shape = SHAPES.rest
}

export function tickLipSync(state: LipSyncController, nowSec: number) {
  if (!state.speaking) {
    state.shape = SHAPES.rest
    return state.shape
  }
  const local = nowSec - state.t0
  if (local >= state.duration + 0.15) {
    state.speaking = false
    state.shape = SHAPES.rest
    return state.shape
  }
  state.shape = shapeAt(state.track, local)
  return state.shape
}

export function stopLipSync(state: LipSyncController) {
  state.speaking = false
  state.shape = SHAPES.rest
}

/** Speak with prosody + drive lip-sync state; word boundaries refine track when supported. */
export function speakWithLipSync(
  text: string,
  opts: {
    lang?: string
    pitch?: number
    rate?: number
    lip: LipSyncController
  },
) {
  try {
    window.speechSynthesis?.cancel()
    stopLipSync(opts.lip)
    const u = new SpeechSynthesisUtterance(text)
    const lang = opts.lang || 'en'
    u.lang = lang.startsWith('it')
      ? 'it-IT'
      : lang.startsWith('fr')
        ? 'fr-FR'
        : lang.startsWith('ru')
          ? 'ru-RU'
          : lang.startsWith('nl')
            ? 'nl-NL'
            : 'en-GB'
    if (opts.pitch != null) u.pitch = Math.min(2, Math.max(0.5, opts.pitch))
    if (opts.rate != null) u.rate = Math.min(1.5, Math.max(0.6, opts.rate))

    const rate = opts.rate ?? 1
    startLipSync(opts.lip, text, { rate })

    // Refine timing with word boundaries when the engine supports them
    const words = text.trim().split(/\s+/).filter(Boolean)
    let wi = 0
    u.onboundary = (ev: SpeechSynthesisEvent) => {
      if (ev.name !== 'word' && ev.name !== undefined && ev.name !== '') {
        // some engines only fire without name
      }
      if (wi < words.length) {
        const w = words[wi++]
        const local = (performance.now() / 1000) - opts.lip.t0
        // inject stronger viseme for this word's first vowel
        const v = charToViseme(w.replace(/[^a-zA-Zàâäéèêëïîôùûüç]/g, '')[0] || 'a')
        opts.lip.track.push({ t: local, viseme: v })
        opts.lip.track.sort((a, b) => a.t - b.t)
      }
    }
    u.onend = () => stopLipSync(opts.lip)
    u.onerror = () => stopLipSync(opts.lip)
    window.speechSynthesis?.speak(u)
  } catch {
    stopLipSync(opts.lip)
  }
}
