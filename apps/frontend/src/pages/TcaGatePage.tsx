/**
 * TCA gate: SAMPLE → YouTube preview | FULL → holographic classroom + RAG
 * Air-gap: access is read-only from pack holdings.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveTcaAccess, type TcaAccessResult } from '../lib/tcaAccess'
import { PulseAccessBanner } from '../components/tca/PulseAccessBanner'
import { YouTubeEmbed } from '../components/tca/YouTubeEmbed'
import { MentorAskBar } from '../components/tca/MentorAskBar'
import PageLoader from '../components/PageLoader'

const TcaClassroom = lazy(() => import('./TcaClassroom'))

type SampleLesson = {
  id: string
  title?: string
  youtubeId?: string
  cta?: string
}

const BASE = `${import.meta.env.BASE_URL || '/'}data/tca/`

async function loadSample(): Promise<SampleLesson | null> {
  try {
    const r = await fetch(`${BASE}sample_lesson.json`, { cache: 'no-store' })
    if (r.ok) return (await r.json()) as SampleLesson
  } catch {
    /* */
  }
  return {
    id: 'sample_01',
    title: 'Preview — What is sfumato?',
    youtubeId: 'BqQhD2qH8vE',
    cta: 'Unlock full holographic classroom with Pack Pulse (12 months)',
  }
}

/**
 * Pack ids from wallet — plug real NFT inventory when Pulse collection is live.
 * Until then: localStorage flag for ops demo, or empty = SAMPLE.
 */
function readDemoPackIds(): string[] {
  try {
    const raw = localStorage.getItem('xartists_tca_demo_packs')
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    /* */
  }
  return []
}

export default function TcaGatePage() {
  const [access, setAccess] = useState<TcaAccessResult>(() => resolveTcaAccess([]))
  const [sample, setSample] = useState<SampleLesson | null>(null)

  useEffect(() => {
    const packs = readDemoPackIds()
    setAccess(resolveTcaAccess(packs))
    loadSample().then(setSample)
  }, [])

  const isFull = access.status === 'FULL' && access.hasAccess

  const sampleBlock = useMemo(() => {
    if (!sample) return null
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
        <PulseAccessBanner access={access} />
        <h1 className="text-xl font-semibold text-amber-50">{sample.title || 'Sample lesson'}</h1>
        <YouTubeEmbed videoId={sample.youtubeId || ''} title={sample.title} />
        <p className="text-[12px] text-zinc-500">{sample.cta}</p>
        <div className="flex flex-wrap gap-3 text-[12px]">
          <Link to="/agents" className="rounded-full border border-amber-500/40 bg-amber-950/40 px-4 py-2 text-amber-100">
            Get Pack Pulse (12 months)
          </Link>
          <Link to="/museum" className="rounded-full border border-white/15 px-4 py-2 text-zinc-400">
            Gallery
          </Link>
        </div>
        {/* Ask bar hidden in SAMPLE — no unlimited RAG */}
      </div>
    )
  }, [sample, access])

  if (isFull) {
    return (
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute left-3 top-3 z-[70] max-w-xs">
          <div className="pointer-events-auto">
            <PulseAccessBanner access={access} />
          </div>
        </div>
        <Suspense fallback={<PageLoader />}>
          <TcaClassroom />
        </Suspense>
        {/* MentorAskBar lives inside classroom when FULL; optional overlay slot */}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white">
      {sampleBlock}
    </div>
  )
}

/** Ops: localStorage.setItem('xartists_tca_demo_packs', JSON.stringify(['pulse_pack_v1'])) */
