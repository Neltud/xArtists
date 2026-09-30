/**
 * useLIAInterpreter — async LIA stream → semantic targets via Shadow Engine.
 * Falls back to market pulse after 2s. Paper-safe without VITE_LIA_API.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PulseEnvironment } from '../lib/pulseDemo'
import { compileSemantic, lerpUniforms, defaultUniforms, type ShaderUniformsTarget } from '../lib/semanticCompiler'
import {
  createShadowState,
  shadowOnLiaStart,
  shadowOnLiaDone,
  shadowOnLiaTimeout,
  shadowOnLiaError,
  LIA_TIMEOUT_MS,
  type ShadowState,
} from '../lib/shadowEngine'

function liaApiBase(): string {
  try {
    return String(
      (import.meta as { env?: { VITE_LIA_API?: string; VITE_PULSE_API?: string } }).env?.VITE_LIA_API ||
        (import.meta as { env?: { VITE_PULSE_API?: string } }).env?.VITE_PULSE_API ||
        '',
    ).replace(/\/$/, '')
  } catch {
    return ''
  }
}

/** Local paper phrases when no API */
const PAPER_PHRASES = [
  'Volume constructive sur EGLD — biais haussier mesuré.',
  'Régime calme · accumulation discrète.',
  'Tension macro · volatilité en hausse.',
  'Narrative art / builders — sentiment positif local.',
  'Risk-off temporaire · rester flexible.',
]

export type LiaInterpreter = {
  uniforms: ShaderUniformsTarget
  shadow: ShadowState
  phrase: string | null
  confidence: number
  requestComment: (context: string) => void
  source: 'lia' | 'paper' | 'pulse'
}

export function useLIAInterpreter(env: PulseEnvironment): LiaInterpreter {
  const [shadow, setShadow] = useState(() => createShadowState(env))
  const [uniforms, setUniforms] = useState<ShaderUniformsTarget>(() => compileSemantic(env))
  const [phrase, setPhrase] = useState<string | null>(null)
  const [source, setSource] = useState<'lia' | 'paper' | 'pulse'>('pulse')
  const [confidence, setConfidence] = useState(0.5)
  const targetRef = useRef<ShaderUniformsTarget>(compileSemantic(env))
  const envRef = useRef(env)
  envRef.current = env
  const seq = useRef(0)

  // When pulse env changes → recompile target (shadow may override)
  useEffect(() => {
    const compiled = compileSemantic(env, phrase)
    targetRef.current = compiled
    if (!shadow.liaPending) {
      setShadow(s => ({ ...s, predicted: compiled }))
    }
  }, [env, phrase, shadow.liaPending])

  // Frame-ish lerp ~20fps via interval (cheap; no rAF required in hook)
  useEffect(() => {
    const id = window.setInterval(() => {
      setUniforms(cur => lerpUniforms(cur, targetRef.current, 0.05, 2.6))
    }, 50)
    return () => window.clearInterval(id)
  }, [])

  // Drive target from shadow.predicted
  useEffect(() => {
    targetRef.current = shadow.predicted
  }, [shadow.predicted])

  const requestComment = useCallback((context: string) => {
    const id = ++seq.current
    const current = envRef.current
    setShadow(s => shadowOnLiaStart(s, current))

    const base = liaApiBase()
    const started = Date.now()

    const finishPaper = () => {
      if (id !== seq.current) return
      const p = PAPER_PHRASES[Math.floor(Math.random() * PAPER_PHRASES.length)]
      const withCtx = context ? `${p} · contexte: ${context.slice(0, 80)}` : p
      setPhrase(withCtx)
      setSource(base ? 'lia' : 'paper')
      setConfidence(0.55 + Math.random() * 0.25)
      setShadow(s => shadowOnLiaDone(s, current, withCtx))
    }

    if (!base) {
      // Simulate network latency paper
      window.setTimeout(finishPaper, 400 + Math.random() * 600)
      window.setTimeout(() => {
        if (id === seq.current && Date.now() - started >= LIA_TIMEOUT_MS) {
          setShadow(s => (s.liaPending ? shadowOnLiaTimeout(s, current) : s))
          setSource('pulse')
        }
      }, LIA_TIMEOUT_MS + 50)
      return
    }

    const ctrl = new AbortController()
    const to = window.setTimeout(() => {
      ctrl.abort()
      if (id === seq.current) {
        setShadow(s => shadowOnLiaTimeout(s, current))
        setSource('pulse')
        setConfidence(0.4)
      }
    }, LIA_TIMEOUT_MS)

    ;(async () => {
      try {
        const r = await fetch(`${base}/lia/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, sentiment: current.sentiment, category: current.category }),
          signal: ctrl.signal,
        })
        window.clearTimeout(to)
        if (id !== seq.current) return
        if (!r.ok) throw new Error(`LIA HTTP ${r.status}`)
        const j = (await r.json()) as { phrase?: string; confidence?: number }
        const text = j.phrase || 'Signal reçu.'
        setPhrase(text)
        setSource('lia')
        setConfidence(typeof j.confidence === 'number' ? j.confidence : 0.7)
        setShadow(s => shadowOnLiaDone(s, current, text))
      } catch (e) {
        window.clearTimeout(to)
        if (id !== seq.current) return
        if ((e as Error).name === 'AbortError') return
        setShadow(s => shadowOnLiaError(s, current, e instanceof Error ? e.message : 'LIA error'))
        setSource('pulse')
        finishPaper()
      }
    })()
  }, [])

  return {
    uniforms,
    shadow,
    phrase,
    confidence,
    requestComment,
    source,
  }
}

export { defaultUniforms }
