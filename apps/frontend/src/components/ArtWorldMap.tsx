/**
 * Carte mondiale RÉELLE — Leaflet + OSM / relief / couleurs / satellite.
 * POI OpenStreetMap (Overpass) : musées, galeries, centres d'art.
 * Service culturel Tours (≠ pack IA).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ArtExhibition,
  fetchCityExhibitions,
  loadExhibitionFeed,
} from '../services/artExhibitions'
import MapMuseumEnter from './museum/MapMuseumEnter'
import {
  fetchOsmCulturalPois,
  osmBrowseUrl,
  osmMinZoom,
  osmPoiColor,
  osmPoiLabel,
  type OsmPoi,
} from '../lib/osmOverpass'

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

const REGION_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  europe: { fill: '#38bdf8', stroke: '#7dd3fc', label: 'Europe' },
  americas: { fill: '#f43f5e', stroke: '#fda4af', label: 'Amériques' },
  asia: { fill: '#a78bfa', stroke: '#c4b5fd', label: 'Asie' },
  africa: { fill: '#fbbf24', stroke: '#fde68a', label: 'Afrique' },
  oceania: { fill: '#2dd4bf', stroke: '#5eead4', label: 'Océanie' },
}

function regionStyle(region?: string) {
  return REGION_COLORS[region || ''] || { fill: '#e11d48', stroke: '#fecdd3', label: 'Autre' }
}

type BasemapId = 'relief' | 'color' | 'satellite' | 'dark' | 'osm'

const BASEMAPS: Record<
  BasemapId,
  { label: string; url: string; attribution: string; maxZoom: number; subdomains?: string }
> = {
  relief: {
    label: 'Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    subdomains: 'abc',
  },
  color: {
    label: 'Couleur',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
  dark: {
    label: 'Nuit',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  osm: {
    label: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

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
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L))
      return
    }
    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Leaflet load failed'))
    document.head.appendChild(script)
  })
}

export default function ArtWorldMap() {
  const [locations, setLocations] = useState<ArtLocation[]>([])
  const [selected, setSelected] = useState<ArtLocation | null>(null)
  const [expos, setExpos] = useState<ArtExhibition[]>([])
  const [globalCount, setGlobalCount] = useState(0)
  const [filter, setFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [basemap, setBasemap] = useState<BasemapId>('osm')
  const [mapReady, setMapReady] = useState(false)
  const [osmPois, setOsmPois] = useState<OsmPoi[]>([])
  const [osmEnabled, setOsmEnabled] = useState(true)
  const [osmLoading, setOsmLoading] = useState(false)
  const [osmStatus, setOsmStatus] = useState('')
  const [mapError, setMapError] = useState<string | null>(null)

  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletNS>(null)
  const layerRef = useRef<LeafletNS>(null)
  const osmLayerRef = useRef<LeafletNS>(null)
  const baseLayerRef = useRef<LeafletNS>(null)
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
      for (const u of urls) {
        try {
          const r = await fetch(u)
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

  useEffect(() => {
    loadExhibitionFeed().then(f => setGlobalCount(f?.exhibitions?.length || 0))
  }, [])

  const onSelect = useCallback((loc: ArtLocation) => {
    setSelected(loc)
    void fetchCityExhibitions(loc.city).then(setExpos)
  }, [])

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
          maxZoom: 19,
          worldCopyJump: true,
          zoomControl: true,
          attributionControl: true,
        })

        const bm = BASEMAPS.osm
        const base = L.tileLayer(bm.url, {
          attribution: bm.attribution,
          maxZoom: bm.maxZoom,
          subdomains: bm.subdomains || 'abc',
        }).addTo(map)
        baseLayerRef.current = base

        layerRef.current = L.layerGroup().addTo(map)
        osmLayerRef.current = L.layerGroup().addTo(map)
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
      if (map) map.remove()
      mapRef.current = null
      layerRef.current = null
      osmLayerRef.current = null
      baseLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map || !mapReady) return
    const bm = BASEMAPS[basemap]
    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current)
    }
    const base = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: bm.maxZoom,
      subdomains: bm.subdomains || 'abc',
    }).addTo(map)
    baseLayerRef.current = base
    const markers = layerRef.current
    if (markers) {
      try {
        if (map.hasLayer(markers)) map.removeLayer(markers)
        markers.addTo(map)
      } catch {
        /* */
      }
    }
  }, [basemap, mapReady])

  const regions = useMemo(() => {
    const s = new Set(locations.map(l => l.region).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [locations])

  const filtered = useMemo(() => {
    return locations.filter(loc => {
      if (regionFilter !== 'all' && loc.region !== regionFilter) return false
      if (!filter.trim()) return true
      const q = filter.toLowerCase()
      return (
        loc.city.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q) ||
        (loc.focus || '').toLowerCase().includes(q)
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
      const style = regionStyle(loc.region)
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: selected?.id === loc.id ? 10 : 7,
        color: style.stroke,
        fillColor: style.fill,
        fillOpacity: 0.9,
        weight: selected?.id === loc.id ? 3 : 1.5,
      })
      marker.bindTooltip(`${loc.city} · ${loc.country}`, {
        direction: 'top',
        offset: [0, -6],
        className: 'xart-map-tooltip',
      })
      marker.on('click', () => onSelect(loc))
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

  // OpenStreetMap cultural POIs (Overpass) when zoomed in
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    const osmLayer = osmLayerRef.current
    if (!L || !map || !mapReady || !osmLayer) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const ac = new AbortController()

    const refresh = () => {
      if (!osmEnabled) {
        osmLayer.clearLayers()
        setOsmPois([])
        setOsmStatus('')
        return
      }
      const z = map.getZoom()
      if (z < osmMinZoom()) {
        osmLayer.clearLayers()
        setOsmPois([])
        setOsmStatus(`Zoom ≥ ${osmMinZoom()} pour POI OSM`)
        return
      }
      const b = map.getBounds()
      const bbox = {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      }
      setOsmLoading(true)
      setOsmStatus('Overpass…')
      void fetchOsmCulturalPois(bbox, ac.signal)
        .then(pois => {
          if (cancelled) return
          setOsmPois(pois)
          osmLayer.clearLayers()
          for (const p of pois) {
            const color = osmPoiColor(p.kind)
            const m = L.circleMarker([p.lat, p.lng], {
              radius: 6,
              color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: 1.5,
            })
            const wiki = p.wikipedia
              ? `<br/><a href="https://wikipedia.org/wiki/${encodeURIComponent(
                  p.wikipedia.replace(' ', '_'),
                )}" target="_blank" rel="noreferrer">Wikipedia</a>`
              : ''
            const web = p.website
              ? `<br/><a href="${p.website}" target="_blank" rel="noreferrer">Site</a>`
              : ''
            m.bindPopup(
              `<strong>${p.name}</strong><br/><span style="opacity:.8">${osmPoiLabel(
                p.kind,
              )}</span>${web}${wiki}<br/><a href="${osmBrowseUrl(
                p,
              )}" target="_blank" rel="noreferrer">OpenStreetMap</a>`,
            )
            m.addTo(osmLayer)
          }
          setOsmStatus(pois.length ? `${pois.length} lieux OSM` : 'Aucun POI dans la vue')
        })
        .catch(err => {
          if ((err as Error)?.name === 'AbortError' || cancelled) return
          setOsmStatus('Overpass indisponible')
        })
        .finally(() => {
          if (!cancelled) setOsmLoading(false)
        })
    }

    const onMove = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(refresh, 450)
    }

    map.on('moveend', onMove)
    map.on('zoomend', onMove)
    refresh()

    return () => {
      cancelled = true
      ac.abort()
      if (timer) clearTimeout(timer)
      map.off('moveend', onMove)
      map.off('zoomend', onMove)
    }
  }, [mapReady, osmEnabled])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-[12px] text-zinc-400">
          {locations.length} destinations
          {mapReady && <span className="ml-2 text-emerald-500/80">· carte live</span>}
          {osmPois.length > 0 && (
            <span className="ml-2 text-sky-400/90">· {osmPois.length} OSM</span>
          )}
          {globalCount > 0 && (
            <span className="ml-2 text-zinc-500">· {globalCount} expos feed</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[12px] text-white w-36"
            placeholder="Filtrer ville…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <select
            className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-[12px] text-white"
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
          >
            <option value="all">Toutes régions</option>
            {regions.map(r => (
              <option key={r} value={r}>
                {REGION_COLORS[r]?.label || r}
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
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-1">Fond</span>
        <button
          type="button"
          onClick={() => setOsmEnabled(v => !v)}
          className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
            osmEnabled
              ? 'border-sky-400/50 bg-sky-500/15 text-sky-100'
              : 'border-white/10 text-zinc-500'
          }`}
          title="Musées & galeries OpenStreetMap (Overpass)"
        >
          POI OSM {osmLoading ? '…' : osmEnabled ? 'ON' : 'OFF'}
        </button>
        {(Object.keys(BASEMAPS) as BasemapId[]).map(id => (
          <button
            key={id}
            type="button"
            onClick={() => setBasemap(id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              basemap === id
                ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
                : 'border-white/10 text-zinc-400 hover:border-white/25'
            }`}
          >
            {BASEMAPS[id].label}
          </button>
        ))}
      </div>

      <div className="relative rounded-2xl border border-rose-500/25 overflow-hidden bg-[#0a0a12] shadow-[0_0_40px_rgba(244,63,94,0.08)]">
        <div
          ref={mapElRef}
          className="w-full h-[min(62vh,520px)] min-h-[320px] z-0"
          role="application"
          aria-label="Carte mondiale OpenStreetMap et destinations art"
        />

        {!mapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a12]/90 text-zinc-400 text-sm">
            Chargement de la carte…
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a12]/95 text-rose-400 text-sm px-4 text-center">
            Impossible de charger Leaflet : {mapError}
          </div>
        )}

        <div className="absolute top-2 left-2 z-[400] rounded-lg bg-black/55 backdrop-blur-sm border border-white/10 px-2.5 py-2 text-[10px] text-zinc-300 space-y-1">
          <p className="uppercase tracking-wider text-zinc-500 mb-1">Légende</p>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-400" /> Musée OSM
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-400" /> Galerie
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400" /> Centre d'art
          </div>
          {Object.entries(REGION_COLORS).map(([key, v]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: v.fill, boxShadow: `0 0 6px ${v.fill}` }}
              />
              <span>{v.label}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-2 left-3 z-[400] pointer-events-none max-w-[75%]">
          <p className="text-[10px] text-zinc-300/90 bg-black/50 rounded-md px-2 py-1 backdrop-blur-sm">
            {basemap === 'relief' && 'Relief OpenTopoMap'}
            {basemap === 'color' && 'CARTO Voyager'}
            {basemap === 'satellite' && 'Satellite Esri'}
            {basemap === 'dark' && 'Nuit CARTO'}
            {basemap === 'osm' && 'Tuiles OpenStreetMap'}
            {osmStatus ? ` · ${osmStatus}` : ''}
            {' · '}© OSM contributors
          </p>
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {selected.city}{' '}
                <span className="text-zinc-500 text-sm font-normal">{selected.country}</span>
              </h3>
              <p className="text-[13px] text-zinc-400">{selected.focus}</p>
            </div>
            <button
              type="button"
              className="text-[11px] text-zinc-500"
              onClick={() => {
                setSelected(null)
                setExpos([])
              }}
            >
              Fermer
            </button>
          </div>
          <MapMuseumEnter city={selected.city} country={selected.country} />
          {expos.length > 0 && (
            <ul className="space-y-1 text-[12px] text-zinc-400">
              {expos.slice(0, 6).map(ex => (
                <li key={ex.id} className="flex gap-2 items-center">
                  <span className={`text-[10px] border rounded px-1 ${statusBadge(ex.status)}`}>
                    {ex.status}
                  </span>
                  {ex.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
