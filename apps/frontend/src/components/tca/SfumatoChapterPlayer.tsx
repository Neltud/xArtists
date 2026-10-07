/**
 * Masterclass Sfumato — chapters + seek after RAG citation.
 * YouTube embed with start= seek_sec when provided.
 */
import { useEffect, useState } from 'react'
import GlassLoader from '../GlassLoader'

type Chapter = {
  id: string
  title: string
  start_sec: number
  end_sec: number
  summary?: string
}

type Mc = {
  title?: string
  youtube_id?: string
  chapters?: Chapter[]
}

function apiBase() {
  return ((import.meta.env.VITE_ACCESS_API_BASE as string) || '').replace(/\/$/, '')
}

export default function SfumatoChapterPlayer({
  seekSec,
  onSeekConsumed,
}: {
  seekSec?: number | null
  onSeekConsumed?: () => void
}) {
  const [mc, setMc] = useState<Mc | null>(null)
  const [loading, setLoading] = useState(true)
  const [start, setStart] = useState(0)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      const base = apiBase()
      try {
        if (base) {
          const r = await fetch(`${base}/v1/masterclass/da_vinci_sfumato`, { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            if (!c && j.masterclass) {
              setMc(j.masterclass)
              setLoading(false)
              return
            }
          }
        }
        // static fallback in public data if present
        const r2 = await fetch(
          `${import.meta.env.BASE_URL || '/'}data/masterclasses/da_vinci_sfumato.json`,
          { cache: 'no-store' },
        )
        if (r2.ok && !c) setMc(await r2.json())
      } catch {
        /* */
      }
      if (!c) setLoading(false)
    })()
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    if (seekSec != null && seekSec >= 0) {
      setStart(Math.floor(seekSec))
      onSeekConsumed?.()
    }
  }, [seekSec, onSeekConsumed])

  if (loading) return <GlassLoader label="Masterclass Sfumato…" />

  const yt = mc?.youtube_id || 'BqQhD2qH8vE'
  const src = `https://www.youtube.com/embed/${yt}?start=${start}&rel=0&modestbranding=1`

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        <iframe
          key={start}
          title={mc?.title || 'Sfumato'}
          src={src}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {mc?.chapters?.length ? (
        <div className="flex flex-wrap gap-2">
          {mc.chapters.map(ch => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setStart(ch.start_sec)}
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-amber-500/40 hover:text-amber-100"
            >
              {ch.title}
              <span className="ml-1 text-zinc-600">{ch.start_sec}s</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
