/**
 * Liste déroulante villes + annuaire musées 3D (bas de carte / tours).
 * Clic → salle 3D via travelBridge.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VIRTUAL_MUSEUMS } from '../../lib/museumWorldCatalog'
import { museumTravelHref } from '../../lib/travelBridge'

export default function CityMuseumDirectory({
  onCityPick,
}: {
  /** Optionnel : synchroniser sélection carte */
  onCityPick?: (city: string) => void
}) {
  const navigate = useNavigate()
  const [cityFilter, setCityFilter] = useState('')

  const byCity = useMemo(() => {
    const m = new Map<string, typeof VIRTUAL_MUSEUMS>()
    for (const mus of VIRTUAL_MUSEUMS) {
      const k = mus.city
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(mus)
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  }, [])

  const cities = byCity.map(([c]) => c)
  const filtered = cityFilter
    ? byCity.filter(([c]) => c.toLowerCase() === cityFilter.toLowerCase())
    : byCity

  const go = (museumId: string, city: string, name: string) => {
    navigate(
      museumTravelHref({
        id: museumId,
        city,
        focus: name,
        space: 'world_tour',
        source: 'directory',
        museumId,
      })
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-rose-300/80">Musées 3D</p>
          <h3 className="text-sm font-semibold text-white mt-0.5">Annuaire · visite surréaliste</h3>
        </div>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          Ville
          <select
            value={cityFilter}
            onChange={e => {
              const v = e.target.value
              setCityFilter(v)
              if (v && onCityPick) onCityPick(v)
            }}
            className="rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-sm text-zinc-100 min-w-[10rem]"
          >
            <option value="">Toutes les villes</option>
            {cities.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
        {filtered.map(([city, museums]) => (
          <div key={city}>
            <p className="text-[11px] font-medium text-zinc-400 mb-1.5 sticky top-0 bg-zinc-950/90 py-0.5">
              {city}
              <span className="text-zinc-600 font-normal"> · {museums.length}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {museums.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => go(m.id, m.city, m.name)}
                  className="rounded-lg border border-white/12 bg-gradient-to-br from-violet-500/10 to-rose-500/5 hover:border-rose-400/40 hover:from-violet-500/20 px-2.5 py-1.5 text-left transition-all"
                >
                  <span className="block text-[12px] text-white font-medium leading-tight">{m.name}</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">{m.tagline}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-zinc-600">
        {VIRTUAL_MUSEUMS.length} salles 3D · clic = entrée WebGL / CSS 3D
      </p>
    </div>
  )
}
