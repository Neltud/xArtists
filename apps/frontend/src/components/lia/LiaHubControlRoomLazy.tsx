import { lazy, Suspense, useState } from 'react'
import LiaMobileOverview from './LiaMobileOverview'
import { ProgressUnpackLoader } from './ProgressUnpackLoader'

/** Mobile-first: defer importing Three.js until the user explicitly opts in. */
const LiaHubControlRoom = lazy(() => import('./LiaHubControlRoom'))

export default function LiaHubControlRoomLazy() {
  // A public control room must show its readable, timestamped data first on every device.
  // Three.js is opt-in even on desktop; reduced-motion users never get auto-immersed.
  const [immersive, setImmersive] = useState(false)

  return (
    <section className="min-w-0 space-y-3" aria-label="LIA control room experience">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-300">Public signals first · immersive 3D is optional</p>
        <button
          type="button"
          className="min-h-[44px] rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          aria-pressed={immersive}
          onClick={() => setImmersive(value => !value)}
        >
          {immersive ? 'Return to accessible 2D view' : 'Enter immersive view (3D)'}
        </button>
      </div>
      {immersive ? (
        <Suspense fallback={<div className="relative h-48"><ProgressUnpackLoader progress={30} /></div>}>
          <LiaHubControlRoom />
        </Suspense>
      ) : <LiaMobileOverview />}
    </section>
  )
}
