/**
 * Entrée unique salle 3D : WebGL plein écran si dispo, sinon CSS 3D.
 */
import { lazy, Suspense, useMemo } from 'react'
import type { FrameItem } from './MuseumCorridor'
import type { RoomBlueprint } from '../../lib/roomBlueprint'
import { isWebGLAvailable } from '../../lib/webglSupport'
import MuseumBlueprintRoom from './MuseumBlueprintRoom'

const MuseumWebGLHall = lazy(() => import('./MuseumWebGLHall'))

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

export default function MuseumHall({
  blueprint,
  frames,
  room = 'stone',
  allowBuy = true,
  emptyLabel = 'Aucune œuvre',
}: {
  blueprint: RoomBlueprint
  frames: FrameItem[]
  room?: Theme
  allowBuy?: boolean
  emptyLabel?: string
}) {
  const webgl = useMemo(() => isWebGLAvailable(), [])

  if (!webgl) {
    return (
      <MuseumBlueprintRoom
        blueprint={blueprint}
        frames={frames}
        room={room}
        allowBuy={allowBuy}
        emptyLabel={emptyLabel}
      />
    )
  }

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[25] h-full w-full flex items-center justify-center bg-black text-sm text-zinc-500">
          Chargement moteur WebGL…
        </div>
      }
    >
      <MuseumWebGLHall
        blueprint={blueprint}
        frames={frames}
        room={room}
        allowBuy={allowBuy}
        emptyLabel={emptyLabel}
      />
    </Suspense>
  )
}
