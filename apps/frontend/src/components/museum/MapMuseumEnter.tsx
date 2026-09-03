/** CTA carte → musée résolu par ville */
import { useNavigate } from 'react-router-dom'
import { museumTravelHref } from '../../lib/travelBridge'
import { museumIdForCity } from '../../lib/museumWorldCatalog'

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
  const mid = museumIdForCity(city)
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <button
        type="button"
        className="btn-primary text-xs"
        onClick={() =>
          navigate(
            museumTravelHref({
              id,
              city,
              country,
              focus,
              space: 'world_tour',
              source: 'map',
              museumId: mid || undefined,
            })
          )
        }
      >
        Entrer dans le musée →
      </button>
      <span className="text-[10px] text-zinc-500 self-center">{mid || 'xartists'}</span>
    </div>
  )
}
