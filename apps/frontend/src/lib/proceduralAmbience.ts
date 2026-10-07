/**
 * Procedural soft drone via Web Audio API — last-resort ambience when files missing.
 * Not a replacement for the real Mars/Elixir/Persic tracks.
 */

export type DroneHandle = { stop: () => void }

export function startProceduralDrone(zone: 'gallery' | 'command' | 'museum' | 'default'): DroneHandle {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AC()
  const master = ctx.createGain()
  master.gain.value = 0.0001
  master.connect(ctx.destination)

  const base =
    zone === 'command' ? 110 : zone === 'museum' ? 82 : zone === 'gallery' ? 98 : 92

  const oscs: OscillatorNode[] = []
  for (const mul of [1, 1.5, 2.01]) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = base * mul
    const g = ctx.createGain()
    g.gain.value = 0.12 / mul
    o.connect(g)
    g.connect(master)
    o.start()
    oscs.push(o)
  }

  // gentle fade in
  master.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.2)

  // slow LFO on master
  const lfo = ctx.createOscillator()
  const lfoG = ctx.createGain()
  lfo.frequency.value = 0.08
  lfoG.gain.value = 0.02
  lfo.connect(lfoG)
  lfoG.connect(master.gain)
  lfo.start()

  return {
    stop: () => {
      try {
        master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
        window.setTimeout(() => {
          oscs.forEach(o => {
            try {
              o.stop()
            } catch {
              /* */
            }
          })
          try {
            lfo.stop()
          } catch {
            /* */
          }
          ctx.close()
        }, 500)
      } catch {
        try {
          ctx.close()
        } catch {
          /* */
        }
      }
    },
  }
}
