/** CTA carte → musée 3D (ville + lieux cliquables) */
import { useNavigate } from 'react-router-dom'
import { museumTravelHref } from '../../lib/travelBridge'
import { VIRTUAL_MUSEUMS } from '../../lib/museumWorldCatalog'
import { museumIdForVenue, venuesForCity } from '../../lib/museumVenueMap'

export default function MapMuseumEnter({
  id,
  city,
  country,
  focus,
  venues,
}: {
  id: string
  city: string
  country?: string
  focus?: string
  venues?: string[]
}) {
  const navigate = useNavigate()

  const featured = venuesForCity(city)
  const fromData =
    venues?.map(v => ({
      label: v,
      museumId: museumIdForVenue(v, city),
    })) || []

  // fusion unique par museumId
  const seen = new Set<string>()
  const list = [...featured, ...fromData].filter(v => {
    if (seen.has(v.museumId + v.label)) return false
    seen.add(v.museumId + v.label)
    return true
  })

  const defaultId = museumIdForVenue(city, city)
  const defaultMuseum = VIRTUAL_MUSEUMS.find(m => m.id === defaultId)

  const go = (museumId: string, label?: string) => {
    navigate(
      museumTravelHref({
        id,
        city,
        country,
        focus: label || focus || defaultMuseum?.name,
        space: 'world_tour',
        source: 'map',
        museumId,
      })
    )
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      {list.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Musées 3D</p>
          <div className="flex flex-wrap gap-1.5">
            {list.map(v => (
              <button
                key={v.label + v.museumId}
                type="button"
                onClick={() => go(v.museumId, v.label)}
                className="rounded-md border border-white/15 bg-black/40 hover:border-rose-400/50 hover:bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-zinc-200 transition-colors"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="btn-primary text-xs self-start" onClick={() => go(defaultId)}>
        Entrer · {defaultMuseum?.name || 'Musée 3D'} →
      </button>
    </div>
  )
}
