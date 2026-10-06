/** Floating ask bar — cognitive delay + askMentor RAG (client extractive). */
import { useState } from 'react'
import { askMentor } from '../../lib/tcaRag'

export type TcaAskResult = ReturnType<typeof askMentor>

export function MentorAskBar({
  professorId,
  onCues,
}: {
  professorId: string
  onCues: (cues: TcaAskResult['cues'], meta: TcaAskResult) => void
}) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = () => {
    const query = q.trim()
    if (!query || busy) return
    setBusy(true)
    window.setTimeout(() => {
      const res = askMentor(query, professorId)
      onCues(res.cues, res)
      setQ('')
      setBusy(false)
    }, 1500)
  }

  return (
    <form
      className="pointer-events-auto flex w-full max-w-xl gap-2 rounded-full border border-white/10 bg-black/55 backdrop-blur-md px-3 py-2"
      onSubmit={e => {
        e.preventDefault()
        submit()
      }}
    >
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Ask the mentor (sfumato, light, anatomy…)"
        className="flex-1 bg-transparent text-[12px] text-zinc-100 outline-none placeholder:text-zinc-600 px-2"
      />
      <button
        type="submit"
        disabled={busy || !q.trim()}
        className="text-[12px] font-semibold text-amber-200 disabled:text-zinc-600 shrink-0"
      >
        {busy ? 'Thinking…' : 'Ask'}
      </button>
    </form>
  )
}
