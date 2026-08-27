/**
 * Sovereign Intent Bar — Cmd/Ctrl+K · parse local · navigate (paper).
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseIntent, type StructuredIntent } from '../lib/intentParser'
import { recordIntentActivity } from '../lib/paperSoul'

export default function IntentBar() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [preview, setPreview] = useState<StructuredIntent | null>(null)
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
    setPreview(q.trim() ? parseIntent(q) : null)
  }, [q, open])

  const submit = useCallback(() => {
    const intent = parseIntent(q)
    setPreview(intent)
    recordIntentActivity(intent.action)
    window.dispatchEvent(new CustomEvent('lia-intent', { detail: intent }))
    if (intent.route) {
      navigate(intent.route)
      setOpen(false)
      setQ('')
    }
  }, [q, navigate])

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
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 pt-[15vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#3a3a5a] bg-[#0e0e16] shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[#2a2a3a] px-4 py-3">
              <span className="text-cyan-400 text-sm">✦</span>
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submit()
                }}
                placeholder='Ex: « ouvrir trading » · « pack agent » · « tip »'
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
              <kbd className="hidden sm:inline text-[10px] text-zinc-600 border border-zinc-700 rounded px-1">
                ESC
              </kbd>
            </div>
            {preview && (
              <div className="px-4 py-3 text-xs space-y-1">
                <p className="text-zinc-400">
                  Action{' '}
                  <strong className="text-cyan-300">{preview.action}</strong>
                  <span className="text-zinc-600 ml-2">
                    conf {(preview.confidence * 100).toFixed(0)}%
                  </span>
                </p>
                <p className="text-white">{preview.summary}</p>
                {preview.payment_asset && (
                  <p className="text-purple-300">Asset hint: {preview.payment_asset}</p>
                )}
                <p className="text-[10px] text-amber-200/70">{preview.notes}</p>
                <button type="button" className="btn-primary text-xs mt-2 w-full" onClick={submit}>
                  Aller → {preview.route}
                </button>
              </div>
            )}
            {!preview && (
              <p className="px-4 py-3 text-[11px] text-zinc-600">
                Paper only · pas d’exécution omnichain · SC marketplace bientôt
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
