/** TCA gate — FULL via server JWT (or dev demo). Protocol UI. */
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
import { useI18n } from '../i18n/I18nContext'
import { requestOpenConnect } from '../lib/walletEvents'

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
    cta: 'Pack Pulse',
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
  const { t, lang } = useI18n()
  const { address, connected } = useWallet()
  const [access, setAccess] = useState<TcaAccessResult | null>(null)
  const [sample, setSample] = useState<SampleLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [serverNote, setServerNote] = useState('')
  const isFr = lang === 'fr'

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
      <div className="xa-page flex min-h-[40vh] items-center justify-center text-sm text-[var(--xa-text-muted)]">
        {t('common.loading')}
      </div>
    )
  }

  if (access.status === 'FULL') {
    return (
      <div className="relative min-h-screen xa-page">
        <div className="pointer-events-none absolute left-3 top-3 z-[70] max-w-sm space-y-1">
          <div className="pointer-events-auto">
            <PulseAccessBanner access={access} />
          </div>
          {serverNote ? <p className="text-[9px] text-[var(--xa-text-muted)]">{serverNote}</p> : null}
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
      <div className="min-h-screen xa-page">
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <p className="xa-hero__kicker mb-2">TCA Academy</p>
          <PulseAccessBanner access={access} mode="SAMPLE" />
          {serverNote ? <p className="mt-1 text-[10px] text-[var(--xa-text-muted)]">{serverNote}</p> : null}
        </div>
        <TcaModuleOne mode="SAMPLE" />
      </div>
    )
  }

  return (
    <div className="xa-page mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-16 text-center">
      <p className="xa-hero__kicker">TCA Academy</p>
      <PulseAccessBanner access={access} mode="NONE" />
      <h1 className="xa-hero__title" style={{ fontSize: '1.75rem' }}>
        {isFr ? 'Accès TCA' : 'TCA access'}
      </h1>
      <p className="xa-hero__lead text-center">
        {isFr
          ? 'Connecte un wallet ou vois les offres Pack Pulse pour le module complet.'
          : 'Connect a wallet or see Pulse pack offers for the full module.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="xa-btn-primary" onClick={requestOpenConnect}>
          {t('common.connect')}
        </button>
        <Link to="/agents" className="xa-btn-secondary">
          {t('nav.packs')}
        </Link>
      </div>
      <p className="xa-disclaimer">
        {isFr
          ? 'Module 1 Sfumato · certification zero-trust · réservé Pulse (FULL).'
          : 'Module 1 Sfumato · zero-trust certification · Pulse (FULL) only.'}
      </p>
    </div>
  )
}
