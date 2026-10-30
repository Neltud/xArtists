import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Carte mondiale — satellite Esri (défaut) + Leaflet (sans clé API).
 * locations optionnel : défaut = hubs culturels mondiaux.
 * Monuments capitales artistiques en relief CSS.
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

/** Glyphs monument par capitale artistique — relief CSS (pas WebGL). */
const MONUMENT_GLYPH: Record<string, string> = {
  paris: '🏛️',
  london: '🏛️',
  nyc: '🗽',
  tokyo: '🏯',
  florence: '🏛️',
  madrid: '🏛️',
  berlin: '🏛️',
  amsterdam: '🖼️',
  vienna: '🎼',
  rome: '🏟️',
  la: '🎬',
  sao: '🏛️',
  seoul: '🏯',
  shanghai: '🏙️',
  sydney: '🎭',
  cairo: '🔺',
  lagos: '🎨',
  mumbai: '🕌',
  mexico: '🏛️',
  istanbul: '🕌',
}

function monumentIconHtml(loc: ArtLocation): string {
  const style = regionStyle(loc.region)
  const glyph = MONUMENT_GLYPH[loc.id] || '◆'
  const city = String(loc.city || '').replace(/[<>&]/g, '')
  return `<div class="xa-monument" style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px);filter:drop-shadow(0 4px 8px rgba(0,0,0,.6));">
    <div style="width:20px;height:26px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,${style.stroke} 0%,${style.fill} 65%,#111 100%);border:1px solid rgba(255,255,255,.4);display:flex;align-items:flex-start;justify-content:center;font-size:12px;line-height:18px;box-shadow:0 8px 14px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.3);">${glyph}</div>
    <div style="margin-top:3px;padding:2px 6px;border-radius:999px;background:rgba(0,0,0,.78);border:1px solid rgba(255,255,255,.22);color:#fafafa;font:600 9px/1.2 system-ui,sans-serif;white-space:nowrap;max-width:92px;overflow:hidden;text-overflow:ellipsis;">${city}</div>
  </div>`
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
  xaUsePhraseLocale()

  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<LeafletNS>(null)
  const layerRef = useRef<LeafletNS>(null)
  const tileRef = useRef<LeafletNS>(null)
  const [mapReady, setMapReady] = useState(false)
  const [basemap, setBasemap] = useState<BasemapId>('satellite')
  const [cityFilter, setCityFilter] = useState('')
  const [region, setRegion] = useState<string>('all')
  const [osmPois, setOsmPois] = useState<OsmPoi[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')

  const baseList = useMemo(() => {
    if (Array.isArray(locations) && locations.length > 0) return locations
    return Array.isArray(DEFAULT_ART_LOCATIONS) ? DEFAULT_ART_LOCATIONS : []
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
    return Array.isArray(list) ? list : []
  }, [baseList, region, cityFilter])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const L = await ensureLeaflet()
        if (cancelled || !mapRef.current) return
        if (mapObj.current) {
          mapObj.current.remove()
          mapObj.current = null
        }
        const map = L.map(mapRef.current, {
          center: [20, 10],
          zoom: 2,
          minZoom: 2,
          maxZoom: 18,
          worldCopyJump: true,
        })
        const bm = BASEMAPS.satellite
        const tile = L.tileLayer(bm.url, {
          attribution: bm.attribution,
          maxZoom: bm.maxZoom,
          subdomains: bm.subdomains,
        }).addTo(map)
        tileRef.current = tile
        const layer = L.layerGroup().addTo(map)
        layerRef.current = layer
        mapObj.current = map
        setMapReady(true)
        setTimeout(() => map.invalidateSize(), 80)
        setTimeout(() => map.invalidateSize(), 400)
      } catch (e) {
        console.error('[ArtWorldMap]', e)
        setMapReady(false)
      }
    })()
    return () => {
      cancelled = true
      if (mapObj.current) {
        try {
          mapObj.current.remove()
        } catch {
          /* */
        }
        mapObj.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapObj.current || !window.L || !tileRef.current) return
    const L = window.L
    const map = mapObj.current
    const bm = BASEMAPS[basemap]
    try {
      map.removeLayer(tileRef.current)
    } catch {
      /* */
    }
    const tile = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: bm.maxZoom,
      subdomains: bm.subdomains,
    }).addTo(map)
    tileRef.current = tile
  }, [basemap, mapReady])

  useEffect(() => {
    if (!mapReady || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    layer.clearLayers()
    ;(filtered || []).forEach(loc => {
      if (loc.lat == null || loc.lng == null) return
      const icon = L.divIcon({
        className: 'xa-monument-icon',
        html: monumentIconHtml(loc),
        iconSize: [88, 44],
        iconAnchor: [44, 40],
        popupAnchor: [0, -36],
      })
      const m = L.marker([loc.lat, loc.lng], { icon })
      m.bindPopup(
        `<strong>${loc.city}</strong> · ${loc.country || ''}<br/><span style="opacity:.7">${loc.focus || ''}</span><br/><span style="opacity:.55;font-size:11px">Capitale artistique · satellite</span>`,
      )
      m.on('click', () => {
        setSelectedCity(loc.city)
        setTravelDestination({
          city: loc.city,
          country: loc.country,
          lat: loc.lat,
          lng: loc.lng,
        })
      })
      m.addTo(layer)
    })
    ;(osmPois || []).forEach(p => {
      const color = osmPoiColor(p.kind)
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 1,
      })
      const match = matchOsmToVirtualMuseum(p)
      const mid = match?.museumId || match?.museum?.id
      const enter = mid
        ? `<br/><a href="#/museum?room=${encodeURIComponent(mid)}">Entrer · musée</a>`
        : ''
      m.bindPopup(`<strong>${p.name || 'POI'}</strong><br/>${osmPoiLabel(p.kind)}${enter}`)
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
          placeholder={xaLocalize("Filtrer ville…")}
          className="rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-zinc-200"
        />
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-zinc-200"
        >
          <option value="all">{xaRender("Toutes régions")}</option>
          {xaRender(Object.entries(REGION_COLORS).map(([k, v]) => (
            <option key={k} value={k}>
              {xaRender(v.label)}
            </option>
          )))}
        </select>
        <span className="text-zinc-500">{xaRender(filtered?.length ?? 0)} {xaRender(" destinations · vue satellite")}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {xaRender(((['satellite'] as BasemapId[])).map(id => (
          <button
            key={id}
            type="button"
            onClick={() => setBasemap(id)}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${
              basemap === id
                ? 'border-lime-400/50 bg-lime-500/15 text-lime-200'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            {xaRender(BASEMAPS[id].label)}
          </button>
        )))}
      </div>

      <div
        ref={mapRef}
        className="w-full h-[min(62vh,520px)] rounded-2xl border border-white/10 overflow-hidden bg-zinc-950"
        style={{ minHeight: 420 }}
      />

      <p className="text-[10px] text-zinc-600">
        {xaRender("Zoom ≥ ")}{xaRender(osmMinZoom())} {xaRender(" → POI OSM · Entrer musée si match · fond Esri satellite · monuments capitales artistiques ")}</p>
      <MapMuseumEnter city={selectedCity || cityFilter || undefined} id="world_map" />
    </div>
  )
}
