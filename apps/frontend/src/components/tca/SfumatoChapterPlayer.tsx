/** Masterclass Sfumato — chapters + seek flash on RAG jump. */
import { useEffect, useState } from 'react'

type Chapter = { id: string; title: string; start_sec: number; end_sec: number }

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
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [yt, setYt] = useState('BqQhD2qH8vE')
  const [start, setStart] = useState(0)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let c = false
    ;(async () => {
      const base = apiBase()
      try {
        if (base) {
          const r = await fetch(`${base}/v1/masterclass/da_vinci_sfumato`, { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            if (!c && j.masterclass) {
              setChapters(j.masterclass.chapters || [])
              if (j.masterclass.youtube_id) setYt(j.masterclass.youtube_id)
              return
            }
          }
        }
        const r2 = await fetch(
          `${import.meta.env.BASE_URL || '/'}data/masterclasses/da_vinci_sfumato.json`,
          { cache: 'no-store' },
        )
        if (r2.ok && !c) {
          const j = await r2.json()
          setChapters(j.chapters || [])
          if (j.youtube_id) setYt(j.youtube_id)
        }
      } catch {
        /* */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    if (seekSec != null && seekSec >= 0) {
      setStart(Math.floor(seekSec))
      setFlash(true)
      const t = window.setTimeout(() => setFlash(false), 1600)
      onSeekConsumed?.()
      return () => clearTimeout(t)
    }
  }, [seekSec, onSeekConsumed])

  const src = `https://www.youtube.com/embed/${yt}?start=${start}&rel=0&modestbranding=1`

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
        <iframe
          key={start}
          title="Sfumato"
          src={src}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div
          className={`absolute top-2 right-2 rounded-full px-3 py-1 text-[11px] font-mono transition ${
            flash
              ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-110'
              : 'bg-black/60 text-zinc-300 border border-white/10'
          }`}
        >
          {Math.floor(start / 60)}:{String(start % 60).padStart(2, '0')}
        </div>
      </div>
      {chapters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chapters.map(ch => (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                setStart(ch.start_sec)
                setFlash(true)
                window.setTimeout(() => setFlash(false), 1200)
              }}
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-amber-500/40"
            >
              {ch.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
