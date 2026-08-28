/**
 * Sovereign Intent Bar — Cmd/Ctrl+K
 * Route rules (intentParser) + LIP-1 resolve + Guardian (lipBridge).
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseIntent, type StructuredIntent } from '../lib/intentParser'
import { recordIntentActivity } from '../lib/paperSoul'
import {
  resolveLip,
  lipToRoute,
  type LipIntent,
  type GuardianVerdict,
} from '../lib/lipBridge'
import FiatOnRampModal from './onramp/FiatOnRampModal'

type LiaUiState = 'idle' | 'thinking' | 'success' | 'error'

export default function IntentBar() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [preview, setPreview] = useState<StructuredIntent | null>(null)
  const [lip, setLip] = useState<LipIntent | null>(null)
  const [guardian, setGuardian] = useState<GuardianVerdict | null>(null)
  const [liaState, setLiaState] = useState<LiaUiState>('idle')
  const [clarify, setClarify] = useState<string | null>(null)
  const [onRamp, setOnRamp] = useState<{ intent: string; amount: string; asset: string } | null>(
    null
  )
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    if (!q.trim()) {
      setPreview(null)
      setLip(null)
      setGuardian(null)
      setClarify(null)
      setLiaState('idle')
      return
    }
    setLiaState('thinking')
    const routeIntent = parseIntent(q)
    setPreview(routeIntent)
    const resolved = resolveLip(q)
    setLip(resolved.intent)
    setGuardian(resolved.guardian)
    setClarify(resolved.ok ? null : resolved.clarify)
    setLiaState(resolved.ok ? 'success' : 'error')
  }, [q, open])

  const openOnRamp = (raw: string) => {
    const lower = raw.toLowerCase()
    const amountMatch = lower.match(/(\d+(?:[.,]\d+)?)/)
    setOnRamp({
      intent: raw,
      amount: amountMatch ? amountMatch[1].replace(',', '.') : '50',
      asset: 'EGLD',
    })
    setOpen(false)
    setQ('')
  }

  const submit = useCallback(() => {
    setLiaState('thinking')
    const intent = parseIntent(q)
    const resolved = resolveLip(q)
    setPreview(intent)
    setLip(resolved.intent)
    setGuardian(resolved.guardian)
    recordIntentActivity(intent.action)
    window.dispatchEvent(
      new CustomEvent('lia-intent', {
        detail: { route: intent, lip: resolved.intent, guardian: resolved.guardian },
      })
    )

    const lower = q.toLowerCase()
    const buyLike =
      /\b(achète|acheter|buy|card|fiat|moonpay|carte|google pay|apple pay)\b/i.test(lower) ||
      intent.action === 'ONRAMP'

    if (buyLike) {
      setLiaState('success')
      openOnRamp(q)
      return
    }

    // Prefer nav routes from classic parser; fallback LIP
    const route = intent.route || lipToRoute(resolved.intent)
    if (route && route !== '/') {
      setLiaState('success')
      navigate(route)
      setOpen(false)
      setQ('')
      return
    }

    if (!resolved.ok) {
      setClarify(resolved.clarify)
      setLiaState('error')
      return
    }

    setLiaState('success')
    if (route) {
      navigate(route)
      setOpen(false)
      setQ('')
    }
  }, [q, navigate])

  const stateColor =
    liaState === 'thinking'
      ? 'text-amber-300'
      : liaState === 'success'
        ? 'text-emerald-300'
        : liaState === 'error'
          ? 'text-rose-300'
          : 'text-zinc-500'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-[#0e0e18]/95 px-4 py-2 text-xs text-cyan-100/90 shadow-lg backdrop-blur hover:border-cyan-400/50"
        aria-label="Ouvrir la barre d’intention"
      >
        <span className="text-cyan-400">⌘K</span>
        <span className="text-zinc-400">Intention LIA…</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 pt-[12vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#3a3a5a] bg-[#0e0e16] shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[#2a2a3a] px-4 py-3">
              <span className={`text-sm ${stateColor}`}>
                {liaState === 'thinking' ? '◉' : liaState === 'success' ? '✓' : liaState === 'error' ? '!' : '✦'}
              </span>
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submit()
                }}
                placeholder='Ex: « tours paris » · « solde TRO » · « buy 50 EGLD »'
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
              <kbd className="hidden sm:inline text-[10px] text-zinc-600 border border-zinc-700 rounded px-1">
                ESC
              </kbd>
            </div>

            <div className="px-4 py-2 flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className={stateColor}>
                LIA · {liaState === 'idle' ? 'ready' : liaState}
              </span>
              {guardian && (
                <span className={guardian.allowed ? 'text-emerald-500/80' : 'text-rose-400/90'}>
                  Guardian {guardian.code}
                </span>
              )}
            </div>

            {preview && (
              <div className="px-4 pb-3 text-xs space-y-1 border-t border-white/5 pt-2">
                <p className="text-zinc-400">
                  Route <strong className="text-cyan-300">{preview.action}</strong>
                  <span className="text-zinc-600 ml-2">
                    conf {(preview.confidence * 100).toFixed(0)}%
                  </span>
                </p>
                <p className="text-white">{preview.summary}</p>
              </div>
            )}

            {lip && (
              <div className="px-4 pb-3 text-[11px] space-y-1 font-mono text-zinc-400">
                <p>
                  LIP <span className="text-violet-300">{lip.intent_type}</span> · {lip.chain} ·{' '}
                  {lip.decimals} dec · atomic {lip.amount_atomic.slice(0, 18)}
                  {lip.amount_atomic.length > 18 ? '…' : ''}
                </p>
                <p className="text-zinc-500">{lip.reason}</p>
                {lip.requires_human_approval && (
                  <p className="text-amber-300/90">Human-in-the-loop requis (seuil TRO)</p>
                )}
              </div>
            )}

            {clarify && (
              <p className="px-4 pb-2 text-xs text-rose-200/90">{clarify}</p>
            )}

            {(preview || lip) && (
              <div className="px-4 pb-4">
                <button type="button" className="btn-primary text-xs w-full" onClick={submit}>
                  Exécuter →
                </button>
              </div>
            )}

            {!preview && !q.trim() && (
              <p className="px-4 py-3 text-[11px] text-zinc-600">
                Essaie : tours · lightning · entity · trading · buy 50 EGLD · solde TRO
              </p>
            )}
          </div>
        </div>
      )}

      <FiatOnRampModal
        isOpen={Boolean(onRamp)}
        onClose={() => setOnRamp(null)}
        intent={onRamp?.intent}
        amount={onRamp?.amount}
        asset={onRamp?.asset}
      />
    </>
  )
}
