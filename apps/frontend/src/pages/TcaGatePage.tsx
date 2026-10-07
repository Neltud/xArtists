/** TCA gate — FULL via server JWT; SAMPLE = Sfumato masterclass + volatile RAG. */
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveTcaAccess, type TcaAccessResult } from '../lib/tcaAccess'
import { demoPacksAllowed, verifyAccessRemote } from '../lib/tcaVerifyClient'
import { PulseAccessBanner } from '../components/tca/PulseAccessBanner'
import SfumatoChapterPlayer from '../components/tca/SfumatoChapterPlayer'
import { MentorAskBar } from '../components/tca/MentorAskBar'
import PageLoader from '../components/PageLoader'
import GlassLoader from '../components/GlassLoader'
import { useWallet } from '../context/WalletContext'

const TcaClassroom = lazy(() => import('./TcaClassroom'))

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
  const [loading, setLoading] = useState(true)
  const [serverNote, setServerNote] = useState('')
  const [seekSec, setSeekSec] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const demoPacks = readDemoPackIdsDevOnly()
      if (demoPacks.length > 0) {
        if (!cancelled) {
          setAccess(resolveTcaAccess(demoPacks))
          setServerNote('dev demo packs (off in PROD)')
          setLoading(false)
        }
        return
      }

      if (!connected || !address) {
        if (!cancelled) {
          setAccess(resolveTcaAccess([], { forceLobby: true }))
          setServerNote('')
          setLoading(false)
        }
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
    return <GlassLoader label="Vérification d'accès…" />
  }

  if (access.status === 'FULL') {
    return (
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute left-3 top-3 z-[70] max-w-sm space-y-1">
          <div className="pointer-events-auto">
            <PulseAccessBanner access={access} />
          </div>
          {serverNote ? <p className="text-[9px] text-zinc-600">{serverNote}</p> : null}
        </div>
        <Suspense fallback={<PageLoader />}>
          <TcaClassroom />
        </Suspense>
      </div>
    )
  }

  if (access.status === 'SAMPLE') {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 text-white">
        <PulseAccessBanner access={access} mode="SAMPLE" />
        {serverNote ? <p className="text-[10px] text-zinc-600">{serverNote}</p> : null}
        <div className="inline-flex w-fit rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
          Mode échantillon (ATC) · Sfumato
        </div>
        <h1 className="text-xl font-semibold text-amber-50">Leonardo · le Sfumato</h1>
        <SfumatoChapterPlayer
          seekSec={seekSec}
          onSeekConsumed={() => setSeekSec(null)}
        />
        <MentorAskBar
          professorId="leonardo"
          onCues={() => undefined}
          onSeek={sec => setSeekSec(sec)}
        />
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
          <h3 className="text-base font-medium text-amber-100">Mode immersif (TCA)</h3>
          <p className="text-[13px] text-zinc-400">
            Hologramme 3D + RAG illimité — Pack Pulse 12 mois.
          </p>
          <Link
            to="/agents"
            className="inline-flex rounded-full border border-amber-500/40 bg-amber-950/50 px-5 py-2.5 text-[13px] font-semibold text-amber-100"
          >
            Obtenir le Pack Pulse
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-16 text-center text-white">
      <PulseAccessBanner access={access} mode="NONE" />
      <h1 className="text-2xl font-semibold text-amber-50">Bienvenue dans la Galerie</h1>
      <p className="text-[14px] text-zinc-400">Connectez un wallet ou voyez les offres Pack Pulse.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/wallet" className="rounded-full border border-white/20 px-5 py-2.5 text-[13px] text-zinc-200">
          Connecter
        </Link>
        <Link
          to="/agents"
          className="rounded-full border border-amber-500/40 bg-amber-950/50 px-5 py-2.5 text-[13px] font-semibold text-amber-100"
        >
          Offres
        </Link>
      </div>
    </div>
  )
}
