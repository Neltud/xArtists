import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/** Lazy mount control room to avoid blocking LiaPage first paint. */
import { lazy, Suspense, useState } from 'react'
import { ProgressUnpackLoader } from './ProgressUnpackLoader'

const LiaHubControlRoom = lazy(() => import('./LiaHubControlRoom'))

export default function LiaHubControlRoomLazy() {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-purple-500/30 bg-black/60 px-4 py-3 text-left text-sm text-cyan-100"
      >
        {xaRender("Ouvrir la salle de contrôle 3D · Packs Sponsors ")}</button>
    )
  }

  return (
    <Suspense fallback={<div className="relative h-48"><ProgressUnpackLoader progress={30} /></div>}>
      <LiaHubControlRoom />
    </Suspense>
  )
}
