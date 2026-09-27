/**
 * Carte mondiale — plan horizontal (Leaflet) + OSM (sans clé API).
 * POI Overpass · match salles museumWorldCatalog.
 * Basemaps: OSM standard / relief OpenTopo — pas de Carto (évite API KEY REQUIRED).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { matchOsmToVirtualMuseum, museumTravelFromOsm } from '../lib/osmMuseumMatch'
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

type BasemapId = 'osm' | 'relief' | 'satellite' | 'dark'

/** Tuiles sans API key (évite watermark « API KEY REQUIRED ») */
const BASEMAPS: Record<
  BasemapId,
  { label: string; url: string; attribution: string; maxZoom: number; subdomains?: string }
> = {
  osm: {
    label: 'Plan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: 'abc',
  },
  relief: {
    label: 'Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    subdomains: 'abc',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18,
  },
  dark: {
    label: 'Nuit',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · CARTO',
    maxZoom: 19,
    subdomains: 'abcd',
  },
}

async function ensureLeaflet(): Promise<LeafletNS> {
  if (window.L) return window.L
  await new Promise<void>((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Leaflet load failed'))
    document.head.appendChild(s)
  })
  return window.L!
}

export default function ArtWorldMap({ locations }: { locations: ArtLocation[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<LeafletNS>(null)
  const layerRef = useRef<LeafletNS>(null)
  const tileRef = useRef<LeafletNS>(null)
  const [mapReady, setMapReady] = useState(false)
  const [basemap, setBasemap] = useState<BasemapId>('osm')
  const [cityFilter, setCityFilter] = useState('')
  const [region, setRegion] = useState<string>('all')
  const [osmPois, setOsmPois] = useState<OsmPoi[]>([])
  const [exFeed, setExFeed] = useState<ArtExhibition[]>([])
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    let list = locations
    if (region !== 'all') list = list.filter(l => l.region === region)
    if (cityFilter.trim()) {
      const q = cityFilter.toLowerCase()
      list = list.filter(
        l =>
          l.city.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q) ||
          l.focus.toLowerCase().includes(q),
      )
    }
    return list
  }, [locations, region, cityFilter])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const L = await ensureLeaflet()
        if (cancelled || !mapRef.current) return
        if (mapObj.current) return
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
    if (tileRef.current) {
      map.removeLayer(tileRef.current)
    }
    const tile = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: bm.maxZoom,
      subdomains: bm.subdomains || 'abc',
    }).addTo(map)
    tileRef.current = tile
  }, [basemap, mapReady])

  useEffect(() => {
    loadExhibitionFeed().then(setExFeed).catch(() => setExFeed([]))
  }, [])

  // markers destinations
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
        `<strong>${loc.city}</strong> · ${loc.country}<br/><span style="opacity:.7">${loc.focus}</span>`,
      )
      m.on('click', () => {
        setTravelDestination({ city: loc.city, country: loc.country, lat: loc.lat, lng: loc.lng })
      })
      m.addTo(layer)
    })
  }, [filtered, mapReady])

  // OSM POIs when zoomed
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
        setOsmPois(pois)
      } catch {
        setOsmPois([])
      }
    }
    map.on('moveend', onMove)
    return () => {
      map.off('moveend', onMove)
    }
  }, [mapReady])

  useEffect(() => {
    if (!mapReady || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    // re-add osm markers on top
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
  }, [osmPois, mapReady])

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
        Zoom ≥ {osmMinZoom} → POI OSM · popup Entrer musée si match catalogue · tuiles OSM sans clé API
      </p>
      <MapMuseumEnter />
    </div>
  )
}
