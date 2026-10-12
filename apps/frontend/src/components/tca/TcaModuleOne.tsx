/**
 * Premier module cours vidéo ATC — Module 1 Sfumato.
 * SAMPLE path: video + theory + practice. FULL: CTA classroom + context bridge.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { YouTubeEmbed } from './YouTubeEmbed'
import { ImmersiveErrorBoundary } from '../ImmersiveErrorBoundary'
import { saveTcaContext } from '../../lib/tcaVideoContext'
import { askMentor } from '../../lib/tcaRag'

type ModuleSection = {
  id: string
  title: string
  type: string
  body: string
}

type ModuleData = {
  id: string
  title: string
  subtitle?: string
  professor_id?: string
  youtubeId?: string
  lesson_id?: string
  estimated_minutes?: number
  learning_objectives?: string[]
  sections?: ModuleSection[]
  key_terms?: { term: string; def: string }[]
  rag_topics?: string[]
  unlock_next?: string
  cta_full?: string
}

const DATA = `${import.meta.env.BASE_URL || '/'}data/tca/`

const FALLBACK: ModuleData = {
  id: 'module_01_sfumato',
  title: 'Module 1 — The Science of Sfumato',
  subtitle: 'Smoke between light and dark',
  professor_id: 'leonardo',
  youtubeId: 'BqQhD2qH8vE',
  lesson_id: 'sample_01',
  estimated_minutes: 25,
  learning_objectives: [
    'Define sfumato without confusing it with simple blur',
    'Identify three value steps on a soft edge',
    'Practice one silhouette without a hard contour',
  ],
  sections: [
    {
      id: 'watch',
      title: 'Watch',
      type: 'video',
      body: 'Watch the preview. Note where edges dissolve into atmosphere.',
    },
    {
      id: 'theory',
      title: 'Theory',
      type: 'text',
      body: 'Sfumato is graduated absence of hard contour so form emerges from air.',
    },
  ],
  key_terms: [{ term: 'sfumato', def: 'Soft transitions where contour dissolves into air' }],
  unlock_next: 'Pack Pulse unlocks the holographic classroom',
}

type Props = {
  mode?: 'SAMPLE' | 'FULL'
  onEnterClassroom?: () => void
}

export function TcaModuleOne({ mode = 'SAMPLE', onEnterClassroom }: Props) {
  const [mod, setMod] = useState<ModuleData>(FALLBACK)
  const [section, setSection] = useState(0)
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`${DATA}module_01_sfumato.json`, { cache: 'no-store' })
        if (r.ok) {
          const j = (await r.json()) as ModuleData
          if (!cancelled) setMod({ ...FALLBACK, ...j })
        }
      } catch {
        /* keep fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mod.youtubeId && mod.lesson_id) {
      saveTcaContext({
        video_id: mod.youtubeId,
        lesson_id: mod.lesson_id,
        topic: mod.title,
      })
    }
  }, [mod.youtubeId, mod.lesson_id, mod.title])

  const sections = mod.sections || []
  const current = sections[section] || sections[0]

  const ask = () => {
    const query = q.trim()
    if (!query || busy) return
    setBusy(true)
    window.setTimeout(() => {
      const res = askMentor(query, mod.professor_id || 'leonardo', undefined, {
        video_id: mod.youtubeId,
        lesson_id: mod.lesson_id,
      })
      setAnswer(res.answer)
      setBusy(false)
    }, 800)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 text-white">
      <div className="inline-flex w-fit rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
        Module 1 · {mode === 'FULL' ? 'Pulse' : 'Sample ATC'}
      </div>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-amber-50 md:text-2xl">{mod.title}</h1>
        {mod.subtitle ? <p className="text-sm text-zinc-400">{mod.subtitle}</p> : null}
        <p className="text-[11px] text-zinc-500">
          Leonardo · ~{mod.estimated_minutes || 25} min · beginner
        </p>
      </header>

      {mod.learning_objectives && mod.learning_objectives.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[13px] text-zinc-300">
          {mod.learning_objectives.map(o => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      ) : null}

      <ImmersiveErrorBoundary area="rag">
        <div className="space-y-3">
          <YouTubeEmbed videoId={mod.youtubeId || ''} title={mod.title} />
          <p className="text-[12px] text-zinc-500">
            Context saved for classroom continuity (video → mentor RAG).
          </p>
        </div>
      </ImmersiveErrorBoundary>

      {sections.length > 0 ? (
        <nav className="flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(i)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                i === section
                  ? 'border-amber-400/50 bg-amber-950/50 text-amber-100'
                  : 'border-white/10 bg-white/5 text-zinc-400'
              }`}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </nav>
      ) : null}

      {current ? (
        <section className="rounded-2xl border border-white/10 bg-black/50 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-amber-100">{current.title}</h2>
          <p className="text-[13px] leading-relaxed text-zinc-300">{current.body}</p>
        </section>
      ) : null}

      {mod.key_terms && mod.key_terms.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {mod.key_terms.map(k => (
            <div key={k.term} className="rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-200/90">{k.term}</p>
              <p className="text-[12px] text-zinc-400">{k.def}</p>
            </div>
          ))}
        </div>
      ) : null}

      <ImmersiveErrorBoundary area="rag">
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4 space-y-3">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
            Ask the studio notes
          </h3>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask()}
              placeholder="e.g. What is sfumato?"
              className="flex-1 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <button
              type="button"
              disabled={busy || !q.trim()}
              onClick={ask}
              className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-2 text-[12px] font-semibold text-amber-100 disabled:opacity-40"
            >
              {busy ? '…' : 'Ask'}
            </button>
          </div>
          {answer ? <p className="text-[13px] leading-relaxed text-zinc-300">{answer}</p> : null}
        </div>
      </ImmersiveErrorBoundary>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
        <p className="text-[13px] text-zinc-400">{mod.unlock_next}</p>
        <div className="flex flex-wrap gap-2">
          {mode === 'FULL' && onEnterClassroom ? (
            <button
              type="button"
              onClick={onEnterClassroom}
              className="rounded-full border border-cyan-500/40 bg-cyan-950/40 px-5 py-2.5 text-[13px] font-semibold text-cyan-100"
            >
              {mod.cta_full || 'Enter 3D classroom'}
            </button>
          ) : (
            <Link
              to="/agents"
              className="inline-flex rounded-full border border-amber-500/40 bg-amber-950/50 px-5 py-2.5 text-[13px] font-semibold text-amber-100"
            >
              Obtenir le Pack Pulse
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-[13px] text-zinc-300"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TcaModuleOne
