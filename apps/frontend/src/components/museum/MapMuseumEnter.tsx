/** CTA carte → musée 3D résolu par ville */
import { useNavigate } from 'react-router-dom'
import { museumTravelHref } from '../../lib/travelBridge'
import { museumIdForCity, VIRTUAL_MUSEUMS } from '../../lib/museumWorldCatalog'

export default function MapMuseumEnter({
  id,
  city,
  country,
  focus,
}: {
  id: string
  city: string
  country?: string
  focus?: string
}) {
  const navigate = useNavigate()
  const mid = museumIdForCity(city) || museumIdForCity(id) || 'xartists'
  const museum = VIRTUAL_MUSEUMS.find(m => m.id === mid)
  const label = museum?.name || 'Musée 3D'

  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-[11px] text-zinc-500">
        Salle : <span className="text-zinc-300">{label}</span>
        {museum?.tagline ? ` · ${museum.tagline}` : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() =>
            navigate(
              museumTravelHref({
                id,
                city,
                country,
                focus: focus || label,
                space: 'world_tour',
                source: 'map',
                museumId: mid,
              })
            )
          }
        >
          Entrer dans le musée 3D →
        </button>
      </div>
    </div>
  )
}
