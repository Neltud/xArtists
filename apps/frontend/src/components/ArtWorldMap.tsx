/**
 * Carte mondiale RÉELLE — Leaflet + tuiles Carto Dark.
 * Zoom/pan natifs · 72 destinations · expos live.
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

/** Minimal Leaflet typings (CDN load — no npm @types/leaflet required). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletNS = any

declare global {
  interface Window {
    L?: LeafletNS
  }
}

function statusBadge(status: string): string {
  if (status === 'ongoing') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  if (status === 'upcoming') return 'bg-amber-500/20 text-amber-200 border-amber-500/40'
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

/** Load Leaflet from CDN once (no npm peer risk). */
function loadLeaflet(): Promise<LeafletNS> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L as LeafletNS)
      return
    }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L as LeafletNS))
      existing.addEventListener('error', () => reject(new Error('Leaflet load failed')))
      if (window.L) resolve(window.L as LeafletNS)
      return
    }
    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => resolve(window.L as LeafletNS)
    script.onerror = () => reject(new Error('Leaflet load failed'))
    document.head.appendChild(script)
  })
}

export default function ArtWorldMap() {
  const [locations, setLocations] = useState<ArtLocation[]>([])
  const [selected, setSelected] = useState<ArtLocation | null>(null)
  const [expos, setExpos] = useState<ArtExhibition[]>([])
  const [expoLoading, setExpoLoading] = useState(false)
  const [expoError, setExpoError] = useState<string | null>(null)
  const [feedUpdated, setFeedUpdated] = useState<string | null>(null)
  const [globalCount, setGlobalCount] = useState(0)
  const [locsLoading, setLocsLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState<string | 'all'>('all')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletNS>(null)
  const layerRef = useRef<LeafletNS>(null)
  const LRef = useRef<LeafletNS>(null)
  const selectedRef = useRef<ArtLocation | null>(null)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

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

  const onSelect = useCallback(
    (loc: ArtLocation) => {
      setSelected(loc)
      void loadCityExpos(loc.id)
      const map = mapRef.current
      if (map) {
        map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 5), { duration: 0.8 })
      }
    },
    [loadCityExpos]
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

  useEffect(() => {
    let cancelled = false
    let map: LeafletNS = null

    ;(async () => {
      try {
        const L = await loadLeaflet()
        if (cancelled || !mapElRef.current) return
        LRef.current = L

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        map = L.map(mapElRef.current, {
          center: [20, 10],
          zoom: 2,
          minZoom: 2,
          maxZoom: 12,
          worldCopyJump: true,
          zoomControl: true,
          attributionControl: true,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map)

        layerRef.current = L.layerGroup().addTo(map)
        mapRef.current = map
        setMapReady(true)

        setTimeout(() => map?.invalidateSize(), 120)
        setTimeout(() => map?.invalidateSize(), 400)
      } catch (e) {
        if (!cancelled) setMapError(e instanceof Error ? e.message : 'Map init failed')
      }
    })()

    return () => {
      cancelled = true
      if (map) {
        map.remove()
      }
      mapRef.current = null
      layerRef.current = null
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

  useEffect(() => {
    const L = LRef.current
    const layer = layerRef.current
    const map = mapRef.current
    if (!L || !layer || !map || !mapReady) return

    layer.clearLayers()

    filtered.forEach(loc => {
      const isSel = selectedRef.current?.id === loc.id
      const r = isSel ? 11 : 7
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: r,
        color: isSel ? '#fecdd3' : '#fb7185',
        weight: isSel ? 2.5 : 1.5,
        fillColor: isSel ? '#f43f5e' : '#e11d48',
        fillOpacity: isSel ? 0.95 : 0.8,
        opacity: 1,
      })

      marker.bindTooltip(
        `<strong>${loc.city}</strong><br/><span style="opacity:.8">${loc.country}</span>`,
        {
          direction: 'top',
          offset: [0, -6],
          opacity: 0.95,
          className: 'xart-map-tooltip',
        }
      )

      marker.on('click', () => {
        onSelect(loc)
      })

      marker.addTo(layer)
    })
  }, [filtered, mapReady, selected, onSelect])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map || !mapReady || filtered.length === 0) return
    if (selected) return

    try {
      const bounds = L.latLngBounds(filtered.map(l => [l.lat, l.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.25), { maxZoom: 5, animate: true })
    } catch {
      /* ignore */
    }
  }, [filtered, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>
          {locsLoading
            ? 'Chargement destinations…'
            : `${locations.length} destinations · ${filtered.length} visibles · ${globalCount} expos`}
          {feedUpdated && (
            <span className="ml-2 text-zinc-600">· maj {feedUpdated.slice(0, 10)}</span>
          )}
          {mapReady && <span className="ml-2 text-emerald-500/80">· carte live</span>}
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
        <button
          type="button"
          className="text-[11px] text-zinc-400 hover:text-white underline underline-offset-2"
          onClick={() => {
            setSelected(null)
            setExpos([])
            const map = mapRef.current
            if (map) map.setView([20, 10], 2)
          }}
        >
          Vue monde
        </button>
      </div>

      <div className="relative rounded-2xl border border-rose-500/25 overflow-hidden bg-[#0a0a12] shadow-[0_0_40px_rgba(244,63,94,0.08)]">
        <div
          ref={mapElRef}
          className="w-full h-[min(62vh,520px)] min-h-[320px] z-0"
          role="application"
          aria-label="Carte mondiale réelle — destinations artistiques"
        />

        {!mapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a12]/90 text-zinc-400 text-sm">
            Chargement de la carte réelle…
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a12]/95 text-rose-400 text-sm px-4 text-center">
            Impossible de charger Leaflet : {mapError}
          </div>
        )}

        <div className="absolute bottom-2 left-3 z-[400] pointer-events-none">
          <p className="text-[10px] text-zinc-400/90 bg-black/50 rounded-md px-2 py-1 backdrop-blur-sm">
            Carte réelle OSM/CARTO · zoom molette · clic marqueur = expos · service culturel
          </p>
        </div>
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
              <p className="text-[10px] text-zinc-600 mono mt-0.5">
                {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-[11px] text-cyan-400/90 hover:text-cyan-300"
                onClick={() => {
                  mapRef.current?.flyTo([selected.lat, selected.lng], 8, { duration: 0.7 })
                }}
              >
                Zoom ×8
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
            <p className="text-[10px] text-zinc-500">
              Intensité scène {(selected.score * 100).toFixed(0)}%
            </p>
          )}

          <div className="divider pt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-rose-300/90 font-semibold">
                Expositions · temps réel
              </p>
              {expoLoading && (
                <span className="text-[10px] text-zinc-500 animate-pulse">Chargement…</span>
              )}
            </div>

            {expoError && <p className="text-xs text-rose-400 mb-2">{expoError}</p>}

            {!expoLoading && expos.length === 0 && (
              <p className="text-xs text-zinc-500">
                Aucune expo indexée pour {selected.city}. Fiche lieux + focus disponibles.
              </p>
            )}

            <ul className="space-y-2">
              {expos.map(ex => (
                <li
                  key={ex.id}
                  className="rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug">{ex.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{ex.venue}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5 mono">
                        {ex.start} → {ex.end}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge(ex.status)}`}
                    >
                      {ex.status === 'ongoing'
                        ? 'En cours'
                        : ex.status === 'upcoming'
                          ? 'À venir'
                          : ex.status}
                    </span>
                  </div>
                  {ex.url && (
                    <a
                      href={ex.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-1.5 text-[11px] text-cyan-400/90 hover:text-cyan-300 underline underline-offset-2"
                    >
                      Site officiel ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .xart-map-tooltip {
          background: rgba(12, 12, 20, 0.92) !important;
          border: 1px solid rgba(244, 63, 94, 0.35) !important;
          color: #f4f4f5 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-size: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.45) !important;
        }
        .xart-map-tooltip::before {
          border-top-color: rgba(244, 63, 94, 0.35) !important;
        }
        .leaflet-container {
          font-family: inherit;
          background: #0a0a12;
        }
        .leaflet-control-zoom a {
          background: rgba(12,12,20,0.9) !important;
          color: #e4e4e7 !important;
          border-color: rgba(255,255,255,0.12) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(244, 63, 94, 0.25) !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.55) !important;
          color: #71717a !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #a1a1aa !important;
        }
      `}</style>
    </div>
  )
}
