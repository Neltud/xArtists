import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Entrée unique salle 3D : WebGL dans la page si disponible, sinon CSS 3D.
 */
import { lazy, Suspense, useMemo, useState } from 'react'
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
  const [compatible, setCompatible] = useState(false)

  // A successful WebGL probe does not guarantee Android/WebView can draw a
  // scene after switching apps. Keep the artwork visible through CSS 3D.
  return (
    <div className="xa-museum-engine">
      {webgl && (
        <div className="xa-museum-engine-controls" role="group" aria-label="Mode d’affichage du musée">
          <button
            type="button"
            className="xa-museum-engine-switch"
            aria-pressed={compatible}
            onClick={() => setCompatible(v => !v)}
          >
            {compatible
              ? xaRender("Revenir au musée WebGL")
              : xaRender("Écran vide ? Afficher le musée en mode compatible")}
          </button>
        </div>
      )}
      {!webgl || compatible
        ? <MuseumBlueprintRoom
            blueprint={blueprint}
            frames={frames}
            room={room}
            allowBuy={allowBuy}
            emptyLabel={emptyLabel}
          />
        : <Suspense
            fallback={
              <div className="xa-museum-engine-loading">
                {xaRender("Chargement moteur WebGL… ")}
              </div>
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
          </Suspense>}
    </div>
  )
}
