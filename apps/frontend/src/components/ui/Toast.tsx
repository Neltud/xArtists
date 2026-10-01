/**
 * Lightweight toast — success / error / info. No inline styles.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type ToastKind = 'info' | 'ok' | 'err'

type ToastItem = { id: number; kind: ToastKind; text: string }

type ToastApi = {
  push: (text: string, kind?: ToastKind) => void
}

const ToastCtx = createContext<ToastApi | null>(null)

let seq = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((text: string, kind: ToastKind = 'info') => {
    const id = seq++
    setItems(s => [...s.slice(-4), { id, kind, text }])
    window.setTimeout(() => {
      setItems(s => s.filter(t => t.id !== id))
    }, 4200)
  }, [])

  const api = useMemo(() => ({ push }), [push])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-20 right-3 z-[90] flex flex-col gap-2 max-w-sm pointer-events-none">
        {items.map(t => (
          <div
            key={t.id}
            className={
              t.kind === 'ok'
                ? 'rounded-xl border border-emerald-400/30 bg-emerald-950/90 px-3 py-2 text-[13px] text-emerald-100'
                : t.kind === 'err'
                  ? 'rounded-xl border border-rose-400/30 bg-rose-950/90 px-3 py-2 text-[13px] text-rose-100'
                  : 'rounded-xl border border-white/15 bg-zinc-950/90 px-3 py-2 text-[13px] text-zinc-100'
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx)
  if (!ctx) {
    return { push: () => undefined }
  }
  return ctx
}
