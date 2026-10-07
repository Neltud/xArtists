/** Ask bar — remote volatile RAG (/v1/rag/query) with seek_sec for chapter player. */
import { useState } from 'react'
import { askMentor } from '../../lib/tcaRag'
import { queryRagRemote } from '../../lib/tcaRagRemote'

export type TcaAskResult = ReturnType<typeof askMentor> & {
  seek_sec?: number | null
  remoteAnswer?: string
}

export function MentorAskBar({
  professorId,
  onCues,
  onSeek,
}: {
  professorId: string
  onCues: (cues: TcaAskResult['cues'], meta: TcaAskResult) => void
  onSeek?: (sec: number) => void
}) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastAnswer, setLastAnswer] = useState('')

  const submit = async () => {
    const query = q.trim()
    if (!query || busy) return
    setBusy(true)
    try {
      const remote = await queryRagRemote(query, { professor_id: professorId })
      if (remote.ok && remote.answer) {
        setLastAnswer(remote.answer)
        if (remote.seek_sec != null && onSeek) onSeek(remote.seek_sec)
        // Still emit local cues shape for classroom animation
        const local = askMentor(query, professorId)
        onCues(local.cues, {
          ...local,
          seek_sec: remote.seek_sec,
          remoteAnswer: remote.answer,
        })
      } else {
        // fallback extractive client
        await new Promise(r => setTimeout(r, 800))
        const res = askMentor(query, professorId)
        setLastAnswer(res.answer || '')
        onCues(res.cues, res)
      }
    } finally {
      setQ('')
      setBusy(false)
    }
  }

  return (
    <div className="pointer-events-auto w-full max-w-xl space-y-2">
      <form
        className="flex gap-2 rounded-full border border-white/10 bg-black/55 backdrop-blur-md px-3 py-2"
        onSubmit={e => {
          e.preventDefault()
          void submit()
        }}
      >
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Ask (Joconde, Sainte Anne, sfumato, glacis…)"
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
      {lastAnswer ? (
        <p className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] leading-relaxed text-zinc-300">
          {lastAnswer}
        </p>
      ) : null}
    </div>
  )
}
