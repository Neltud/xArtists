import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Entrée unique salle 3D : WebGL dans la page si disponible, sinon CSS 3D.
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
  roomTitle='xArtists',
}: {
  blueprint: RoomBlueprint
  frames: FrameItem[]
  room?: Theme
  allowBuy?: boolean
  emptyLabel?: string
  roomTitle?: string
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
        <div className="xa-museum-engine-loading">
          {xaRender("Chargement moteur WebGL… ")}</div>
      }
    >
      <MuseumWebGLHall
        blueprint={blueprint}
        frames={frames}
        room={room}
        allowBuy={allowBuy}
        emptyLabel={emptyLabel}
        roomTitle={roomTitle}
      />
    </Suspense>
  )
}
