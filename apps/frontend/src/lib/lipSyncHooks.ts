/**
 * Hooks for hologram lip-sync / morph targets from TTS or RAG answer text.
 * Wire to TcaClassroom mesh morphTargetInfluences when FULL classroom is active.
 */
import { useEffect, useRef, useState } from 'react'

/** Simple viseme weights from phoneme-ish chars (demo, not full IPA). */
export function textToVisemeWeights(text: string, t: number): Record<string, number> {
  const i = Math.floor(t * 12) % Math.max(1, text.length)
  const c = (text[i] || ' ').toLowerCase()
  const open = /[aeiouàâäéèêëïîôùûü]/.test(c) ? 0.7 : 0.15
  const wide = /[oôuùûw]/.test(c) ? 0.5 : 0.1
  const closed = /[mbp]/.test(c) ? 0.8 : 0.05
  return {
    jawOpen: open,
    mouthWide: wide,
    mouthClose: closed,
    smile: /[ieéè]/.test(c) ? 0.35 : 0.05,
  }
}

export type LipSyncState = {
  active: boolean
  weights: Record<string, number>
  text: string
}

/** Drive morph targets while `speakingText` is non-empty. */
export function useLipSync(speakingText: string, cps = 14): LipSyncState {
  const [weights, setWeights] = useState<Record<string, number>>({
    jawOpen: 0,
    mouthWide: 0,
    mouthClose: 0,
    smile: 0,
  })
  const startRef = useRef(0)

  useEffect(() => {
    if (!speakingText.trim()) {
      setWeights({ jawOpen: 0, mouthWide: 0, mouthClose: 0, smile: 0 })
      return
    }
    startRef.current = performance.now()
    let raf = 0
    const duration = (speakingText.length / cps) * 1000
    const tick = () => {
      const elapsed = performance.now() - startRef.current
      if (elapsed > duration) {
        setWeights({ jawOpen: 0, mouthWide: 0, mouthClose: 0, smile: 0 })
        return
      }
      setWeights(textToVisemeWeights(speakingText, elapsed / 1000))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speakingText, cps])

  return {
    active: Boolean(speakingText.trim()),
    weights,
    text: speakingText,
  }
}

/** Apply weights onto a Three.js mesh with morphTargetDictionary if present. */
export function applyMorphTargets(
  mesh: { morphTargetDictionary?: Record<string, number>; morphTargetInfluences?: number[] } | null,
  weights: Record<string, number>,
) {
  if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return
  for (const [name, w] of Object.entries(weights)) {
    const idx = mesh.morphTargetDictionary[name]
    if (typeof idx === 'number' && mesh.morphTargetInfluences[idx] != null) {
      mesh.morphTargetInfluences[idx] = w
    }
  }
}
