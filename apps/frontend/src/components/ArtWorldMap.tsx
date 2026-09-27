/**
 * Carte mondiale — plan horizontal Leaflet + OSM (sans clé API).
 * locations optionnel : défaut = hubs culturels mondiaux.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import MapMuseumEnter from './museum/MapMuseumEnter'
import {
  fetchOsmCulturalPois,
  osmMinZoom,
  osmPoiColor,
  osmPoiLabel,
  type OsmPoi,
} from '../lib/osmOverpass'
import { matchOsmToVirtualMuseum } from '../lib/osmMuseumMatch'
import { setTravelDestination } from '../lib/travelBridge'

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

/** Hubs art mondiaux — plan horizontal (pas de dépendance tours.json) */
export const DEFAULT_ART_LOCATIONS: ArtLocation[] = [
  { id: 'paris', city: 'Paris', country: 'France', lat: 48.86, lng: 2.34, focus: 'Louvre · Orsay · Pompidou', region: 'europe' },
  { id: 'london', city: 'London', country: 'UK', lat: 51.51, lng: -0.13, focus: 'National Gallery · Tate', region: 'europe' },
  { id: 'nyc', city: 'New York', country: 'USA', lat: 40.78, lng: -73.96, focus: 'Met · MoMA', region: 'americas' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.77, focus: 'Mori · National Museum', region: 'asia' },
  { id: 'florence', city: 'Florence', country: 'Italy', lat: 43.77, lng: 11.26, focus: 'Uffizi', region: 'europe' },
  { id: 'madrid', city: 'Madrid', country: 'Spain', lat: 40.41, lng: -3.69, focus: 'Prado · Reina Sofía', region: 'europe' },
  { id: 'berlin', city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.4, focus: 'Museum Island', region: 'europe' },
  { id: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', lat: 52.36, lng: 4.88, focus: 'Rijksmuseum · Van Gogh', region: 'europe' },
  { id: 'vienna', city: 'Vienna', country: 'Austria', lat: 48.2, lng: 16.37, focus: 'Kunsthistorisches', region: 'europe' },
  { id: 'rome', city: 'Rome', country: 'Italy', lat: 41.9, lng: 12.49, focus: 'Vatican · Borghese', region: 'europe' },
  { id: 'la', city: 'Los Angeles', country: 'USA', lat: 34.06, lng: -118.36, focus: 'Getty · LACMA', region: 'americas' },
  { id: 'sao', city: 'São Paulo', country: 'Brazil', lat: -23.56, lng: -46.65, focus: 'MASP', region: 'americas' },
  { id: 'seoul', city: 'Seoul', country: 'Korea', lat: 37.57, lng: 126.98, focus: 'MMCA', region: 'asia' },
  { id: 'shanghai', city: 'Shanghai', country: 'China', lat: 31.23, lng: 121.47, focus: 'Power Station of Art', region: 'asia' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', lat: -33.87, lng: 151.21, focus: 'MCA · AGNSW', region: 'oceania' },
  { id: 'cairo', city: 'Cairo', country: 'Egypt', lat: 30.04, lng: 31.24, focus: 'Egyptian Museum', region: 'africa' },
  { id: 'lagos', city: 'Lagos', country: 'Nigeria', lat: 6.45, lng: 3.39, focus: 'Contemporary hubs', region: 'africa' },
  { id: 'mumbai', city: 'Mumbai', country: 'India', lat: 18.93, lng: 72.83, focus: 'CSMVS', region: 'asia' },
  { id: 'mexico', city: 'Mexico City', country: 'Mexico', lat: 19.43, lng: -99.13, focus: 'Anthropology · Tamayo', region: 'americas' },
  { id: 'istanbul', city: 'Istanbul', country: 'Turkey', lat: 41.01, lng: 28.98, focus: 'Pera · Modern', region: 'europe' },
]

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

type BasemapId = 'osm' | 'relief' | 'satellite'

const BASEMAPS: Record<
  BasemapId,
  { label: string; url: string; attribution: string; maxZoom: number; subdomains?: string }
> = {
  osm: {
    label: 'Plan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abc',
  },
  relief: {
    label: 'Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'OSM · OpenTopoMap',
    maxZoom: 17,
    subdomains: 'abc',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri',
    maxZoom: 18,
  },
}

async function ensureLeaflet(): Promise<LeafletNS> {
  if (window.L) return window.L
  await new Promise<void>((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.setAttribute('data-leaflet', '1')
      document.head.appendChild(link)
    }
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Leaflet load failed'))
    document.head.appendChild(s)
  })
  return window.L!
}

export default function ArtWorldMap({ locations }: { locations?: ArtLocation[] | null }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<LeafletNS>(null)
  const layerRef = useRef<LeafletNS>(null)
  const tileRef = useRef<LeafletNS>(null)
  const [mapReady, setMapReady] = useState(false)
  const [basemap, setBasemap] = useState<BasemapId>('osm')
  const [cityFilter, setCityFilter] = useState('')
  const [region, setRegion] = useState<string>('all')
  const [osmPois, setOsmPois] = useState<OsmPoi[]>([])

  const baseList = useMemo(() => {
    if (Array.isArray(locations) && locations.length > 0) return locations
    return DEFAULT_ART_LOCATIONS
  }, [locations])

  const filtered = useMemo(() => {
    let list = baseList
    if (region !== 'all') list = list.filter(l => l.region === region)
    if (cityFilter.trim()) {
      const q = cityFilter.toLowerCase()
      list = list.filter(
        l =>
          l.city.toLowerCase().includes(q) ||
          (l.country || '').toLowerCase().includes(q) ||
          (l.focus || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [baseList, region, cityFilter])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const L = await ensureLeaflet()
        if (cancelled || !mapRef.current || mapObj.current) return
        const map = L.map(mapRef.current, {
          center: [20, 10],
          zoom: 2,
          minZoom: 1,
          maxZoom: 18,
          worldCopyJump: true,
        })
        const bm = BASEMAPS.osm
        const tile = L.tileLayer(bm.url, {
          attribution: bm.attribution,
          maxZoom: bm.maxZoom,
          subdomains: bm.subdomains || 'abc',
        }).addTo(map)
        tileRef.current = tile
        mapObj.current = map
        layerRef.current = L.layerGroup().addTo(map)
        setMapReady(true)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapObj.current || !window.L) return
    const L = window.L
    const map = mapObj.current
    const bm = BASEMAPS[basemap]
    if (tileRef.current) map.removeLayer(tileRef.current)
    const tile = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: bm.maxZoom,
      subdomains: bm.subdomains || 'abc',
    }).addTo(map)
    tileRef.current = tile
  }, [basemap, mapReady])

  useEffect(() => {
    if (!mapReady || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    layer.clearLayers()
    filtered.forEach(loc => {
      const style = regionStyle(loc.region)
      const m = L.circleMarker([loc.lat, loc.lng], {
        radius: 7,
        color: style.stroke,
        fillColor: style.fill,
        fillOpacity: 0.85,
        weight: 1.5,
      })
      m.bindPopup(
        `<strong>${loc.city}</strong> · ${loc.country || ''}<br/><span style="opacity:.7">${loc.focus || ''}</span>`,
      )
      m.on('click', () => {
        setTravelDestination({
          city: loc.city,
          country: loc.country,
          lat: loc.lat,
          lng: loc.lng,
        })
      })
      m.addTo(layer)
    })
    osmPois.forEach(p => {
      const color = osmPoiColor(p.kind)
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 1,
      })
      const match = matchOsmToVirtualMuseum(p)
      const enter = match
        ? `<br/><a href="#/museum?room=${encodeURIComponent(match.roomId)}">Entrer musée</a>`
        : ''
      m.bindPopup(`<strong>${p.name}</strong><br/>${osmPoiLabel(p.kind)}${enter}`)
      m.addTo(layer)
    })
  }, [filtered, osmPois, mapReady])

  useEffect(() => {
    if (!mapReady || !mapObj.current) return
    const map = mapObj.current
    const onMove = async () => {
      const z = map.getZoom()
      if (z < osmMinZoom) {
        setOsmPois([])
        return
      }
      const b = map.getBounds()
      try {
        const pois = await fetchOsmCulturalPois({
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        })
        setOsmPois(Array.isArray(pois) ? pois : [])
      } catch {
        setOsmPois([])
      }
    }
    map.on('moveend', onMove)
    return () => {
      map.off('moveend', onMove)
    }
  }, [mapReady])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center text-[11px]">
        <input
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          placeholder="Filtrer ville…"
          className="rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-zinc-200"
        />
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-zinc-200"
        >
          <option value="all">Toutes régions</option>
          {Object.entries(REGION_COLORS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <span className="text-zinc-500">{filtered.length} destinations · plan horizontal</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(BASEMAPS) as BasemapId[]).map(id => (
          <button
            key={id}
            type="button"
            onClick={() => setBasemap(id)}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${
              basemap === id
                ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            {BASEMAPS[id].label}
          </button>
        ))}
      </div>

      <div
        ref={mapRef}
        className="w-full h-[min(62vh,520px)] rounded-2xl border border-white/10 overflow-hidden bg-zinc-950"
      />

      <p className="text-[10px] text-zinc-600">
        Zoom ≥ {osmMinZoom} → POI OSM · Entrer musée si match · tuiles OSM sans clé
      </p>
      <MapMuseumEnter />
    </div>
  )
}
