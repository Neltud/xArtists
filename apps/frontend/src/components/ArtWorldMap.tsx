/**
 * Carte mondiale interactive — zoom/pan · destinations artistiques · expos live.
 * Service culturel Tours (≠ pack IA).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ArtExhibition,
  fetchCityExhibitions,
  loadExhibitionFeed,
} from '../services/artExhibitions'

export type ArtLocation = {
  id: string
  city: string
  country: string
  lat: number
  lng: number
  focus: string
  venues?: string[]
  score?: number
  region?: string
}

const W = 960
const H = 480
const MIN_ZOOM = 1
const MAX_ZOOM = 6

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * W
  const y = ((90 - lat) / 180) * H
  return { x, y }
}

function statusBadge(status: string): string {
  if (status === 'ongoing') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  if (status === 'upcoming') return 'bg-amber-500/20 text-amber-200 border-amber-500/40'
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
}

type View = { scale: number; tx: number; ty: number }

function clampView(v: View): View {
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.scale))
  const maxTx = 0
  const minTx = W * (1 - scale)
  const maxTy = 0
  const minTy = H * (1 - scale)
  return {
    scale,
    tx: Math.min(maxTx, Math.max(minTx, v.tx)),
    ty: Math.min(maxTy, Math.max(minTy, v.ty)),
  }
}

export default function ArtWorldMap() {
  const [locations, setLocations] = useState<ArtLocation[]>([])
  const [selected, setSelected] = useState<ArtLocation | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [expos, setExpos] = useState<ArtExhibition[]>([])
  const [expoLoading, setExpoLoading] = useState(false)
  const [expoError, setExpoError] = useState<string | null>(null)
  const [feedUpdated, setFeedUpdated] = useState<string | null>(null)
  const [globalCount, setGlobalCount] = useState(0)
  const [locsLoading, setLocsLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState<string | 'all'>('all')

  const [view, setView] = useState<View>({ scale: 1, tx: 0, ty: 0 })
  const dragging = useRef(false)
  const lastPtr = useRef<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const urls = [
      `${import.meta.env.BASE_URL}data/art_tour_locations.json`,
      'https://raw.githubusercontent.com/Neltud/xArtists/main/data/art_tour_locations.json',
      'https://raw.githubusercontent.com/Neltud/xArtists/main/apps/frontend/public/data/art_tour_locations.json',
    ]
    ;(async () => {
      setLocsLoading(true)
      for (const url of urls) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const list = Array.isArray(j.locations) ? j.locations : []
          if (!cancelled && list.length) {
            setLocations(list)
            break
          }
        } catch {
          /* next */
        }
      }
      if (!cancelled) setLocsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const feed = await loadExhibitionFeed()
        if (!cancelled) {
          setGlobalCount(feed.exhibitions?.length ?? 0)
          setFeedUpdated(feed.updated ?? null)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadCityExpos = useCallback(async (cityId: string) => {
    setExpoLoading(true)
    setExpoError(null)
    try {
      const { exhibitions, updated } = await fetchCityExhibitions(cityId)
      setExpos(exhibitions)
      if (updated) setFeedUpdated(updated)
    } catch (e) {
      setExpoError(e instanceof Error ? e.message : 'Fetch expos failed')
      setExpos([])
    } finally {
      setExpoLoading(false)
    }
  }, [])

  const zoomToCity = useCallback((loc: ArtLocation, targetScale = 3.2) => {
    const { x, y } = project(loc.lat, loc.lng)
    const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetScale))
    const tx = W / 2 - x * scale
    const ty = H / 2 - y * scale
    setView(clampView({ scale, tx, ty }))
  }, [])

  const onSelect = useCallback(
    (loc: ArtLocation) => {
      setSelected(loc)
      zoomToCity(loc)
      void loadCityExpos(loc.id)
    },
    [loadCityExpos, zoomToCity]
  )

  const refreshAll = useCallback(async () => {
    setExpoLoading(true)
    try {
      const feed = await loadExhibitionFeed(true)
      setGlobalCount(feed.exhibitions?.length ?? 0)
      setFeedUpdated(feed.updated ?? null)
      if (selected) {
        const { exhibitions } = await fetchCityExhibitions(selected.id)
        setExpos(exhibitions)
      }
    } catch (e) {
      setExpoError(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setExpoLoading(false)
    }
  }, [selected])

  const zoomBy = useCallback((factor: number, cx = W / 2, cy = H / 2) => {
    setView(prev => {
      const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.scale * factor))
      const k = nextScale / prev.scale
      const tx = cx - (cx - prev.tx) * k
      const ty = cy - (cy - prev.ty) * k
      return clampView({ scale: nextScale, tx, ty })
    })
  }, [])

  const resetView = useCallback(() => {
    setView({ scale: 1, tx: 0, ty: 0 })
  }, [])

  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const mx = ((e.clientX - rect.left) / rect.width) * W
      const my = ((e.clientY - rect.top) / rect.height) * H
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      zoomBy(factor, mx, my)
    },
    [zoomBy]
  )

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    dragging.current = true
    lastPtr.current = { x: e.clientX, y: e.clientY }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || !lastPtr.current) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = ((e.clientX - lastPtr.current.x) / rect.width) * W
    const dy = ((e.clientY - lastPtr.current.y) / rect.height) * H
    lastPtr.current = { x: e.clientX, y: e.clientY }
    setView(prev => clampView({ ...prev, tx: prev.tx + dx, ty: prev.ty + dy }))
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = false
    lastPtr.current = null
    try {
      ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  const regions = useMemo(() => {
    const s = new Set(locations.map(l => l.region).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [locations])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return locations.filter(loc => {
      if (regionFilter !== 'all' && loc.region !== regionFilter) return false
      if (!q) return true
      return (
        loc.city.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q) ||
        loc.focus.toLowerCase().includes(q)
      )
    })
  }, [locations, filter, regionFilter])

  const points = useMemo(
    () =>
      filtered.map(loc => {
        const { x, y } = project(loc.lat, loc.lng)
        return { ...loc, x, y }
      }),
    [filtered]
  )

  const showLabels = view.scale >= 1.6 || points.length <= 20

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>
          {locsLoading
            ? 'Chargement carte…'
            : `${locations.length} destinations · ${filtered.length} visibles · ${globalCount} expos`}
          {feedUpdated && (
            <span className="ml-2 text-zinc-600">· maj {feedUpdated.slice(0, 10)}</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => void refreshAll()}
          disabled={expoLoading}
          className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-50"
        >
          {expoLoading ? 'Sync…' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Rechercher ville, pays…"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 w-44 sm:w-56 focus:outline-none focus:border-rose-400/40"
        />
        <select
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-rose-400/40"
        >
          <option value="all">Toutes régions</option>
          {regions.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="relative rounded-2xl border border-rose-500/25 bg-gradient-to-b from-[#0a1020] to-[#0c0c14] overflow-hidden select-none">
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.35)} className="h-8 w-8 rounded-lg border border-white/15 bg-black/50 text-white text-lg leading-none hover:bg-rose-500/30">+</button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.35)} className="h-8 w-8 rounded-lg border border-white/15 bg-black/50 text-white text-lg leading-none hover:bg-rose-500/30">−</button>
          <button type="button" aria-label="Reset view" onClick={resetView} className="h-8 w-8 rounded-lg border border-white/15 bg-black/50 text-[10px] text-zinc-300 hover:bg-white/10" title="Reset">1:1</button>
        </div>

        <div className="absolute top-2 left-2 z-10 rounded-md bg-black/40 px-2 py-1 text-[10px] text-zinc-400 mono">
          ×{view.scale.toFixed(1)}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto max-h-[480px] cursor-grab active:cursor-grabbing touch-none"
          role="img"
          aria-label="Carte mondiale interactive — zoom molette, glisser pour déplacer"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
            <rect width={W} height={H} fill="#0a1220" />
            {[0.25, 0.5, 0.75].map(p => (
              <line key={`h-${p}`} x1={0} y1={H * p} x2={W} y2={H * p} stroke="#1e293b" strokeWidth={1 / view.scale} />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map(p => (
              <line key={`v-${p}`} x1={W * p} y1={0} x2={W * p} y2={H} stroke="#1e293b" strokeWidth={1 / view.scale} />
            ))}
            <ellipse cx={180} cy={200} rx={90} ry={110} fill="#132033" opacity={0.9} />
            <ellipse cx={480} cy={180} rx={70} ry={90} fill="#132033" opacity={0.9} />
            <ellipse cx={520} cy={280} rx={55} ry={80} fill="#132033" opacity={0.85} />
            <ellipse cx={780} cy={220} rx={100} ry={70} fill="#132033" opacity={0.9} />
            <ellipse cx={850} cy={360} rx={60} ry={40} fill="#132033" opacity={0.85} />
            <ellipse cx={250} cy={360} rx={50} ry={70} fill="#132033" opacity={0.85} />

            {points.map(p => {
              const active = selected?.id === p.id || hover === p.id
              const r = (active ? 8 : 5) / Math.sqrt(view.scale)
              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(p.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={e => {
                    e.stopPropagation()
                    onSelect(p)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(p)
                    }
                  }}
                >
                  <circle cx={p.x} cy={p.y} r={r + 6 / Math.sqrt(view.scale)} fill="#f43f5e" opacity={active ? 0.3 : 0.12} />
                  <circle cx={p.x} cy={p.y} r={r} fill={active ? '#fb7185' : '#e11d48'} stroke="#fecdd3" strokeWidth={(active ? 2 : 1) / view.scale} />
                  {showLabels && (
                    <text
                      x={p.x + 8 / Math.sqrt(view.scale)}
                      y={p.y + 3 / Math.sqrt(view.scale)}
                      fill="#e2e8f0"
                      fontSize={Math.max(9, 11 / Math.sqrt(view.scale * 0.85))}
                      className="pointer-events-none"
                      style={{ fontFamily: 'system-ui, sans-serif' }}
                    >
                      {p.city}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        <p className="absolute bottom-2 left-3 text-[10px] text-zinc-500 max-w-[70%]">
          Molette = zoom · glisser = déplacer · clic ville = expos · service culturel (pas un pack IA)
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
        {filtered.map(loc => (
          <button
            key={loc.id}
            type="button"
            onClick={() => onSelect(loc)}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
              selected?.id === loc.id
                ? 'border-rose-400/60 bg-rose-500/20 text-rose-100'
                : 'border-white/10 text-zinc-400 hover:border-rose-400/40'
            }`}
          >
            {loc.city}
          </button>
        ))}
      </div>

      {selected && (
        <div className="card border-rose-500/30 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold text-white text-lg">
                {selected.city}{' '}
                <span className="text-zinc-500 font-normal text-sm">· {selected.country}</span>
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">{selected.focus}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="text-[11px] text-cyan-400/90 hover:text-cyan-300" onClick={() => zoomToCity(selected, 4)}>
                Zoom ×4
              </button>
              <button
                type="button"
                className="text-zinc-500 hover:text-white text-xs"
                onClick={() => {
                  setSelected(null)
                  setExpos([])
                }}
              >
                Fermer
              </button>
            </div>
          </div>

          {selected.venues && selected.venues.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {selected.venues.map(v => (
                <li key={v} className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-300">
                  {v}
                </li>
              ))}
            </ul>
          )}

          {selected.score != null && (
            <p className="text-[10px] text-zinc-500">Intensité scène {(selected.score * 100).toFixed(0)}%</p>
          )}

          <div className="divider pt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-rose-300/90 font-semibold">Expositions · temps réel</p>
              {expoLoading && <span className="text-[10px] text-zinc-500 animate-pulse">Chargement…</span>}
            </div>
            {expoError && <p className="text-xs text-rose-400 mb-2">{expoError}</p>}
            {!expoLoading && expos.length === 0 && (
              <p className="text-xs text-zinc-500">Aucune expo indexée pour {selected.city}. Autres destinations ont des fiches lieux.</p>
            )}
            <ul className="space-y-2">
              {expos.map(ex => (
                <li key={ex.id} className="rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug">{ex.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{ex.venue}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5 mono">{ex.start} → {ex.end}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge(ex.status)}`}>
                      {ex.status === 'ongoing' ? 'En cours' : ex.status === 'upcoming' ? 'À venir' : ex.status}
                    </span>
                  </div>
                  {ex.url && (
                    <a href={ex.url} target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-[11px] text-cyan-400/90 hover:text-cyan-300 underline underline-offset-2">
                      Site officiel ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
