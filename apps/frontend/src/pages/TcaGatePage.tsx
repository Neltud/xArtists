/**
 * TCA gatekeeper
 * FULL  → holographic classroom + RAG
 * SAMPLE → YouTube ATC preview
 * NONE  → lobby (connect / buy Pulse)
 * Air-gap: read-only pack check, never mint.
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  resolveTcaAccess,
  resolveTcaAccessForWallet,
  type TcaAccessResult,
} from '../lib/tcaAccess'
import { PulseAccessBanner } from '../components/tca/PulseAccessBanner'
import { YouTubeEmbed } from '../components/tca/YouTubeEmbed'
import PageLoader from '../components/PageLoader'
import { useWallet } from '../context/WalletContext'

const TcaClassroom = lazy(() => import('./TcaClassroom'))

type SampleLesson = {
  id: string
  title?: string
  youtubeId?: string
  cta?: string
}

const BASE = `${import.meta.env.BASE_URL || '/'}data/tca/`

async function loadSample(): Promise<SampleLesson> {
  try {
    const r = await fetch(`${BASE}sample_lesson.json`, { cache: 'no-store' })
    if (r.ok) return (await r.json()) as SampleLesson
  } catch {
    /* */
  }
  return {
    id: 'sample_01',
    title: 'Aperçu — Qu’est-ce que le sfumato ?',
    youtubeId: 'BqQhD2qH8vE',
    cta: 'Passez en mode immersif avec le Pack Pulse (12 mois)',
  }
}

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
  const { address, connected } = useWallet()
  const [access, setAccess] = useState<TcaAccessResult | null>(null)
  const [sample, setSample] = useState<SampleLesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const demoPacks = readDemoPackIds()
      const lesson = await loadSample()
      if (cancelled) return
      setSample(lesson)

      // Demo packs override (ops) OR future: NFT index for Pulse collection
      const result = await resolveTcaAccessForWallet(connected ? address : null, {
        packIds: demoPacks,
      })
      // No wallet → NONE lobby (unless demo packs force FULL)
      if (!connected && demoPacks.length === 0) {
        setAccess(
          resolveTcaAccess([], { forceLobby: true }),
        )
      } else if (!connected && demoPacks.length > 0) {
        setAccess(resolveTcaAccess(demoPacks))
      } else {
        setAccess(result)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [address, connected])

  if (loading || !access) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Initialisation du savoir…
      </div>
    )
  }

  const mode = access.status

  // ── FULL: hologram + RAG ──────────────────────────────────────────
  if (mode === 'FULL') {
    return (
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute left-3 top-3 z-[70] max-w-sm">
          <div className="pointer-events-auto">
            <PulseAccessBanner access={access} />
          </div>
        </div>
        <Suspense fallback={<PageLoader />}>
          <TcaClassroom />
        </Suspense>
      </div>
    )
  }

  // ── SAMPLE: ATC YouTube preview ───────────────────────────────────
  if (mode === 'SAMPLE') {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 text-white">
        <PulseAccessBanner access={access} mode={mode} />
        <div className="inline-flex w-fit rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
          Mode échantillon (ATC)
        </div>
        <h1 className="text-xl font-semibold text-amber-50">
          {sample?.title || 'Leçon d’aperçu'}
        </h1>
        <YouTubeEmbed videoId={sample?.youtubeId || ''} title={sample?.title} />
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
          <h3 className="text-base font-medium text-amber-100">Passez en mode immersif (TCA)</h3>
          <p className="text-[13px] text-zinc-400">
            Interagissez avec le Maître en 3D, posez vos questions (RAG), suivez l’agenda des professeurs.
          </p>
          <Link
            to="/agents"
            className="inline-flex rounded-full border border-amber-500/40 bg-amber-950/50 px-5 py-2.5 text-[13px] font-semibold text-amber-100 hover:bg-amber-900/40"
          >
            Obtenir le Pack Pulse
          </Link>
        </div>
      </div>
    )
  }

  // ── NONE: lobby ───────────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-16 text-center text-white">
      <PulseAccessBanner access={access} mode="NONE" />
      <h1 className="text-2xl font-semibold text-amber-50">Bienvenue dans la Galerie</h1>
      <p className="text-[14px] text-zinc-400 leading-relaxed">
        Connectez votre wallet pour vérifier un Pack Pulse, ou découvrez les offres pour accéder à la
        classroom holographique.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/wallet"
          className="rounded-full border border-white/20 px-5 py-2.5 text-[13px] text-zinc-200 hover:border-white/40"
        >
          Connecter le wallet
        </Link>
        <Link
          to="/agents"
          className="rounded-full border border-amber-500/40 bg-amber-950/50 px-5 py-2.5 text-[13px] font-semibold text-amber-100"
        >
          Voir les offres
        </Link>
      </div>
    </div>
  )
}

/**
 * Demo FULL:
 * localStorage.setItem('xartists_tca_demo_packs', JSON.stringify(['pulse_pack_v1']))
 * location.reload()
 */
