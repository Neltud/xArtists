/** CTA carte → musée 3D (ville + lieux cliquables depuis le catalog) */
import { useNavigate } from 'react-router-dom'
import { museumTravelHref } from '../../lib/travelBridge'
import { VIRTUAL_MUSEUMS, getMuseum } from '../../lib/museumWorldCatalog'
import { museumIdForVenue, venuesForCity } from '../../lib/museumVenueMap'

export default function MapMuseumEnter({
  id = 'world',
  city = '',
  country,
  focus,
  venues,
}: {
  id?: string
  city?: string
  country?: string
  focus?: string
  venues?: string[]
}) {
  const navigate = useNavigate()
  const citySafe = (city || '').trim()

  const featured = citySafe ? venuesForCity(citySafe) : []
  const fromData =
    (venues || []).map(v => ({
      label: v,
      museumId: museumIdForVenue(v, citySafe || undefined),
    })) || []

  const fromCatalog = citySafe
    ? VIRTUAL_MUSEUMS.filter(m => m.city.toLowerCase() === citySafe.toLowerCase()).map(m => ({
        label: m.name,
        museumId: m.id,
      }))
    : VIRTUAL_MUSEUMS.slice(0, 8).map(m => ({ label: m.name, museumId: m.id }))

  const seen = new Set<string>()
  const list = [...fromCatalog, ...featured, ...fromData].filter(v => {
    if (!v.museumId || seen.has(v.museumId)) return false
    seen.add(v.museumId)
    return true
  })

  const defaultId = list[0]?.museumId || museumIdForVenue(citySafe || 'xartists', citySafe)
  const defaultMuseum = getMuseum(defaultId)

  const go = (museumId: string, label?: string) => {
    navigate(
      museumTravelHref({
        id: id || museumId,
        city: citySafe || defaultMuseum?.city || 'MultiversX',
        country,
        focus: label || focus || defaultMuseum?.name,
        space: 'world_tour',
        source: 'map',
        museumId,
      }),
    )
  }

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-rose-300/90">
          Musées 3D{citySafe ? ` · ${citySafe}` : ' · annuaire'}
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
                    <span className="block text-[10px] text-zinc-500 mt-0.5">{meta.tagline}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => go(defaultId)}
        className="self-start rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-1.5 text-[12px] text-cyan-100 hover:bg-cyan-500/25"
      >
        Entrer · {defaultMuseum?.name || 'musée'}
      </button>
    </div>
  )
}
