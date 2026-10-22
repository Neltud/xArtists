import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** TCA gate — Sprint 1.1: FULL only via server JWT (or dev demo flag). */
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveTcaAccess, type TcaAccessResult } from '../lib/tcaAccess'
import { demoPacksAllowed, verifyAccessRemote } from '../lib/tcaVerifyClient'
import { PulseAccessBanner } from '../components/tca/PulseAccessBanner'
import { TcaModuleOne } from '../components/tca/TcaModuleOne'
import { ImmersiveErrorBoundary } from '../components/ImmersiveErrorBoundary'
import { saveTcaContext } from '../lib/tcaVideoContext'
import PageLoader from '../components/PageLoader'
import { useWallet } from '../context/WalletContext'

const TcaClassroom = lazy(() => import('./TcaClassroom'))
const DATA = `${import.meta.env.BASE_URL || '/'}data/tca/`

type SampleLesson = { id: string; title?: string; youtubeId?: string; cta?: string }

async function loadSample(): Promise<SampleLesson> {
  try {
    const r = await fetch(`${DATA}sample_lesson.json`, { cache: 'no-store' })
    if (r.ok) return (await r.json()) as SampleLesson
  } catch {
    /* */
  }
  return {
    id: 'sample_01',
    title: 'Module 1 — What is sfumato?',
    youtubeId: 'BqQhD2qH8vE',
    cta: 'Pack Pulse 12 mois',
  }
}

function readDemoPackIdsDevOnly(): string[] {
  if (!demoPacksAllowed()) return []
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
  const [serverNote, setServerNote] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const lesson = await loadSample()
      if (cancelled) return
      setSample(lesson)

      const demoPacks = readDemoPackIdsDevOnly()
      if (demoPacks.length > 0) {
        setAccess(resolveTcaAccess(demoPacks))
        setServerNote('dev demo packs (off in PROD)')
        setLoading(false)
        return
      }

      if (!connected || !address) {
        setAccess(resolveTcaAccess([], { forceLobby: true }))
        setServerNote('')
        setLoading(false)
        return
      }

      const { access: remote, fromServer, raw } = await verifyAccessRemote(address)
      if (cancelled) return
      setAccess(remote)
      setServerNote(
        fromServer ? `server:${raw?.source || 'ok'} · ${remote.reason}` : `offline:${remote.reason}`,
      )
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [address, connected])

  if (loading || !access) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        {xaRender("Verification d acces... ")}</div>
    )
  }

  if (access.status === 'FULL') {
    return (
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute left-3 top-3 z-[70] max-w-sm space-y-1">
          <div className="pointer-events-auto">
            <PulseAccessBanner access={access} />
          </div>
          {xaRender(serverNote ? <p className="text-[9px] text-zinc-600">{xaRender(serverNote)}</p> : null)}
        </div>
        <Suspense fallback={<PageLoader />}>
          <ImmersiveErrorBoundary area="classroom">
            <TcaClassroom />
          </ImmersiveErrorBoundary>
        </Suspense>
      </div>
    )
  }

  if (access.status === 'SAMPLE') {
    if (sample?.youtubeId) {
      saveTcaContext({
        video_id: sample.youtubeId,
        lesson_id: sample.id || 'sample_01',
        topic: sample.title,
      })
    }
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <PulseAccessBanner access={access} mode="SAMPLE" />
          {xaRender(serverNote ? <p className="mt-1 text-[10px] text-zinc-600">{xaRender(serverNote)}</p> : null)}
        </div>
        <TcaModuleOne mode="SAMPLE" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-16 text-center text-white">
      <PulseAccessBanner access={access} mode="NONE" />
      <h1 className="text-2xl font-semibold text-amber-50">{xaRender("Bienvenue dans la Galerie")}</h1>
      <p className="text-[14px] text-zinc-400">{xaRender("Connectez un wallet ou voyez les offres Pack Pulse.")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/wallet" className="rounded-full border border-white/20 px-5 py-2.5 text-[13px] text-zinc-200">
          {xaRender("Connecter ")}</Link>
        <Link
          to="/agents"
          className="rounded-full border border-amber-500/40 bg-amber-950/50 px-5 py-2.5 text-[13px] font-semibold text-amber-100"
        >
          {xaRender("Offres ")}</Link>
      </div>
    </div>
  )
}
