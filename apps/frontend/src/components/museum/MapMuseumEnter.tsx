/** CTA carte → musée 3D (ville + lieux cliquables) */
import { useNavigate } from 'react-router-dom'
import { museumTravelHref } from '../../lib/travelBridge'
import { VIRTUAL_MUSEUMS, getMuseum } from '../../lib/museumWorldCatalog'
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

  // musées catalog pour cette ville
  const fromCatalog = VIRTUAL_MUSEUMS.filter(
    m => m.city.toLowerCase() === city.toLowerCase()
  ).map(m => ({ label: m.name, museumId: m.id }))

  const seen = new Set<string>()
  const list = [...fromCatalog, ...featured, ...fromData].filter(v => {
    const k = v.museumId
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  const defaultId = list[0]?.museumId || museumIdForVenue(city, city)
  const defaultMuseum = getMuseum(defaultId) || VIRTUAL_MUSEUMS.find(m => m.id === defaultId)

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
    <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-rose-300/90">
          Musées 3D · {city}
        </p>
        {list.length === 0 ? (
          <p className="text-[11px] text-zinc-500">Aucune salle mappée — entrée xArtists.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {list.map(v => {
              const meta = getMuseum(v.museumId)
              return (
                <button
                  key={v.museumId}
                  type="button"
                  onClick={() => go(v.museumId, v.label)}
                  className="rounded-xl border border-white/15 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-500/5 hover:border-fuchsia-400/50 hover:shadow-[0_0_20px_rgba(232,121,249,0.15)] px-3 py-2 text-left transition-all max-w-[14rem]"
                >
                  <span className="block text-[12px] font-semibold text-white leading-tight">
                    {v.label}
                  </span>
                  {meta?.tagline && (
                    <span className="block text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                      {meta.tagline}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-primary text-xs self-start shadow-[0_0_24px_rgba(244,63,94,0.25)]"
        onClick={() => go(defaultId)}
      >
        Entrer dans le musée 3D · {defaultMuseum?.name || 'xArtists'} →
      </button>
    </div>
  )
}
