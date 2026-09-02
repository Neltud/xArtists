/**
 * LIA Monitor — stream compact + terminal LIP.
 */
import { useEffect, useState } from 'react'
import TerminalLog from './TerminalLog'

export default function LiaMonitor() {
  const [open, setOpen] = useState(false)
  const [last, setLast] = useState<string>('idle')

  useEffect(() => {
    const onIntent = (ev: Event) => {
      const d = (ev as CustomEvent).detail as {
        lip?: { intent_type?: string }
        guardian?: { code?: string }
      }
      setLast(
        `${d?.lip?.intent_type || '?'} · ${d?.guardian?.code || '—'}`
      )
      setOpen(true)
    }
    window.addEventListener('lia-intent', onIntent)
    return () => window.removeEventListener('lia-intent', onIntent)
  }, [])

  return (
    <div className="fixed bottom-32 md:bottom-24 right-3 z-30 w-[min(100vw-1.5rem,20rem)]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="ml-auto flex items-center gap-2 rounded-full border border-violet-500/30 bg-[#0e0e18]/95 px-3 py-1.5 text-[10px] text-violet-100/90 shadow-lg backdrop-blur"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        Monitor · {last}
      </button>
      {open && (
        <div className="mt-2">
          <TerminalLog compact />
        </div>
      )}
    </div>
  )
}
