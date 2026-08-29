/**
 * Carte mondiale interactive — lieux d’art (service Tours).
 * Projection équirectangulaire SVG · pas de dépendance carte lourde.
 */
import { useEffect, useMemo, useState } from 'react'

export type ArtLocation = {
  id: string
  city: string
  country: string
  lat: number
  lng: number
  focus: string
  venues?: string[]
  score?: number
}

const W = 960
const H = 480

/** lng/lat → SVG x/y (équirectangular) */
function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * W
  const y = ((90 - lat) / 180) * H
  return { x, y }
}

export default function ArtWorldMap() {
  const [locations, setLocations] = useState<ArtLocation[]>([])
  const [selected, setSelected] = useState<ArtLocation | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const urls = [
      `${import.meta.env.BASE_URL}data/art_tour_locations.json`,
      'https://raw.githubusercontent.com/Neltud/xArtists/main/data/art_tour_locations.json',
    ]
    ;(async () => {
      for (const url of urls) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const list = Array.isArray(j.locations) ? j.locations : []
          if (!cancelled && list.length) {
            setLocations(list)
            return
          }
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const points = useMemo(
    () =>
      locations.map(loc => {
        const { x, y } = project(loc.lat, loc.lng)
        return { ...loc, x, y }
      }),
    [locations]
  )

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-rose-500/25 bg-gradient-to-b from-[#0a1020] to-[#0c0c14] overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto max-h-[420px]"
          role="img"
          aria-label="Carte mondiale des lieux d’art"
        >
          {/* Fond océan + graticule simple */}
          <rect width={W} height={H} fill="#0a1220" />
          {[0.25, 0.5, 0.75].map(p => (
            <line
              key={`h-${p}`}
              x1={0}
              y1={H * p}
              x2={W}
              y2={H * p}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}
          {[0.2, 0.4, 0.6, 0.8].map(p => (
            <line
              key={`v-${p}`}
              x1={W * p}
              y1={0}
              x2={W * p}
              y2={H}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}
          {/* Silhouette continents (approx paths simplifiés) */}
          <ellipse cx={180} cy={200} rx={90} ry={110} fill="#132033" opacity={0.9} />
          <ellipse cx={480} cy={180} rx={70} ry={90} fill="#132033" opacity={0.9} />
          <ellipse cx={520} cy={280} rx={55} ry={80} fill="#132033" opacity={0.85} />
          <ellipse cx={780} cy={220} rx={100} ry={70} fill="#132033" opacity={0.9} />
          <ellipse cx={850} cy={360} rx={60} ry={40} fill="#132033" opacity={0.85} />
          <ellipse cx={250} cy={360} rx={50} ry={70} fill="#132033" opacity={0.85} />

          {points.map(p => {
            const active = selected?.id === p.id || hover === p.id
            const r = active ? 9 : 6
            return (
              <g
                key={p.id}
                className="cursor-pointer"
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setSelected(p)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 6}
                  fill="#f43f5e"
                  opacity={active ? 0.25 : 0.12}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={active ? '#fb7185' : '#e11d48'}
                  stroke="#fecdd3"
                  strokeWidth={active ? 2 : 1}
                />
                <text
                  x={p.x + 10}
                  y={p.y + 4}
                  fill="#e2e8f0"
                  fontSize={11}
                  className="pointer-events-none"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {p.city}
                </text>
              </g>
            )
          })}
        </svg>

        <p className="absolute bottom-2 left-3 text-[10px] text-zinc-500">
          Clique un point · service culturel (pas un pack IA)
        </p>
      </div>

      {selected && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">
          <p className="font-bold text-white">
            {selected.city}{' '}
            <span className="text-zinc-500 font-normal text-xs">· {selected.country}</span>
          </p>
          <p className="text-zinc-400 text-xs mt-1">{selected.focus}</p>
          {selected.venues && selected.venues.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {selected.venues.map(v => (
                <li
                  key={v}
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-300"
                >
                  {v}
                </li>
              ))}
            </ul>
          )}
          {selected.score != null && (
            <p className="text-[10px] text-zinc-500 mt-2">
              Intensité scène {(selected.score * 100).toFixed(0)}%
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {locations.map(loc => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setSelected(loc)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              selected?.id === loc.id
                ? 'border-rose-400/60 bg-rose-500/20 text-rose-100'
                : 'border-white/10 text-zinc-400 hover:border-rose-400/40'
            }`}
          >
            {loc.city}
          </button>
        ))}
      </div>
    </div>
  )
}
