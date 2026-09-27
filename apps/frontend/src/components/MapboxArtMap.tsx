/**
 * Carte Mapbox GL JS (optionnelle) — POI OSM + destinations + entrée musée virtuel.
 * Active si VITE_MAPBOX_TOKEN est défini ; sinon message + fallback Leaflet.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isMapboxConfigured, loadMapboxGL } from '../lib/mapboxLoader'
import {
  fetchOsmCulturalPois,
  osmBrowseUrl,
  osmMinZoom,
  osmPoiColor,
  type OsmPoi,
} from '../lib/osmOverpass'
import { matchOsmToVirtualMuseum, museumTravelFromOsm } from '../lib/osmMuseumMatch'
import { setTravelDestination } from '../lib/travelBridge'

export default function MapboxArtMap() {
  const elRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  const [status, setStatus] = useState('Init…')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isMapboxConfigured()) {
      setError('VITE_MAPBOX_TOKEN absent — utilisez la carte Leaflet / OSM')
      return
    }
    let cancelled = false
    let map: ReturnType<NonNullable<Awaited<ReturnType<typeof loadMapboxGL>>>['Map']> | null =
      null

    ;(async () => {
      try {
        const mapboxgl = await loadMapboxGL()
        if (cancelled || !mapboxgl || !elRef.current) return

        map = new mapboxgl.Map({
          container: elRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [2.35, 48.86],
          zoom: 3,
          attributionControl: true,
        })
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')
        mapRef.current = map

        map.on('load', () => {
          setStatus('Mapbox prêt · zoomez pour POI OSM')
          map!.addSource('osm-pois', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
          map!.addLayer({
            id: 'osm-pois-circle',
            type: 'circle',
            source: 'osm-pois',
            paint: {
              'circle-radius': 7,
              'circle-color': ['get', 'color'],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#0a0a12',
            },
          })

          map!.on('click', 'osm-pois-circle', e => {
            const f = e.features?.[0]
            if (!f?.properties) return
            const poi = JSON.parse(f.properties.poiJson as string) as OsmPoi
            const match = matchOsmToVirtualMuseum(poi)
            const html = `
              <strong>${poi.name}</strong><br/>
              <a href="${osmBrowseUrl(poi)}" target="_blank" rel="noreferrer">OSM</a>
              ${
                match
                  ? `<br/><button id="xart-enter-museum" type="button">Entrer · ${match.museum.name}</button>`
                  : ''
              }
            `
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map!)
            setTimeout(() => {
              const btn = document.getElementById('xart-enter-museum')
              if (btn && match) {
                btn.onclick = () => {
                  setTravelDestination(museumTravelFromOsm(poi, match))
                  navigate(`/museum?museum=${match.museumId}`)
                }
              }
            }, 50)
          })

          const refresh = async () => {
            if (!map) return
            const z = map.getZoom()
            if (z < osmMinZoom()) {
              setStatus(`Zoom ≥ ${osmMinZoom()} pour POI OSM`)
              return
            }
            const b = map.getBounds()
            setStatus('Overpass…')
            const pois = await fetchOsmCulturalPois({
              south: b.getSouth(),
              west: b.getWest(),
              north: b.getNorth(),
              east: b.getEast(),
            })
            const features = pois.map(p => ({
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
              properties: {
                color: osmPoiColor(p.kind),
                poiJson: JSON.stringify(p),
                name: p.name,
              },
            }))
            const src = map.getSource('osm-pois')
            if (src) src.setData({ type: 'FeatureCollection', features })
            setStatus(`${pois.length} lieux OSM`)
          }

          let t: ReturnType<typeof setTimeout> | null = null
          map!.on('moveend', () => {
            if (t) clearTimeout(t)
            t = setTimeout(() => void refresh(), 400)
          })
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Mapbox init failed')
      }
    })()

    return () => {
      cancelled = true
      map?.remove()
      mapRef.current = null
    }
  }, [navigate])

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-[13px] text-amber-100/90">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-zinc-500">{status} · Mapbox GL · cache Overpass v2</p>
      <div
        ref={elRef}
        className="w-full h-[min(62vh,520px)] min-h-[320px] rounded-2xl border border-white/10 overflow-hidden"
      />
    </div>
  )
}
