/**
 * Tours artistiques — carte + musées 3D (service CULTURE, pas un pack agent).
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InfoTip from '../components/InfoTip'
import ArtWorldMap from '../components/ArtWorldMap'
import MapboxArtMap from '../components/MapboxArtMap'
import { isMapboxConfigured } from '../lib/mapboxLoader'
import ErrorBoundary from '../components/ErrorBoundary'
import CityMuseumDirectory from '../components/museum/CityMuseumDirectory'
import { museumTravelHref } from '../lib/travelBridge'
import { VIRTUAL_MUSEUMS, type VirtualMuseum } from '../lib/museumWorldCatalog'

type ToursDoc = {
  name?: string
  list_eur_from?: number
  scope_v1?: string[]
  cities?: { id: string; label?: string }[]
  sample_tours?: { id: string; title: string; duration?: string }[]
}

export default function ArtToursPage() {
  const navigate = useNavigate()
  const [doc, setDoc] = useState<ToursDoc | null>(null)
  const museums = VIRTUAL_MUSEUMS

  useEffect(() => {
    let c = false
    ;(async () => {
      const urls = [
        `${import.meta.env.BASE_URL || '/'}data/tours.json`,
        `${import.meta.env.BASE_URL || '/'}data/art_tours.json`,
      ]
      for (const u of urls) {
        try {
          const r = await fetch(u)
          if (!r.ok) continue
          const j = await r.json()
          if (!c) setDoc(j)
          return
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const enterCity = (city: string) => {
    navigate(
      museumTravelHref({
        id: city,
        city,
        space: 'world_tour',
        source: 'tours',
      }),
    )
  }

  const enterMuseum = (m: VirtualMuseum) => {
    navigate(
      museumTravelHref({
        id: m.id,
        city: m.city,
        country: m.country,
        focus: m.tagline,
        space: 'world_tour',
        source: 'tours',
        museumId: m.id,
      }),
    )
  }

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">Culture · tours</p>
        <h1 className="section-title display">Tours & carte mondiale</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          OpenStreetMap · Overpass · match salles virtuelles
          {isMapboxConfigured() ? ' · Mapbox GL' : ''}.{' '}
          <InfoTip text="Service culturel — distinct des packs agents IA." />
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Carte mondiale</h2>
        <p className="text-[11px] text-zinc-600">
          Zoom ≥ 10 → POI OSM · popup <strong className="text-zinc-400">Entrer · musée</strong> si match
          catalogue
        </p>
        <ErrorBoundary>
          <ArtWorldMap />
        </ErrorBoundary>
        {isMapboxConfigured() && (
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-cyan-400/80">Mapbox GL</p>
            <ErrorBoundary>
              <MapboxArtMap />
            </ErrorBoundary>
          </div>
        )}
        <CityMuseumDirectory />
      </section>

      {doc?.cities && doc.cities.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-300">Villes du catalogue tours</h2>
          <div className="flex flex-wrap gap-1.5">
            {doc.cities.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => enterCity(c.label || c.id)}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-300 hover:border-rose-400/40 hover:text-white"
              >
                {c.label || c.id}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-300">Musées virtuels</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {museums.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => enterMuseum(m)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-left hover:border-cyan-500/30"
            >
              <span className="text-sm font-medium text-white">{m.name}</span>
              <span className="block text-[11px] text-zinc-500">
                {m.city}
                {m.country ? ` · ${m.country}` : ''}
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-zinc-600">
        <Link to="/museum" className="underline-offset-2 hover:underline">
          Galerie 3D
        </Link>
        {' · '}
        © OpenStreetMap contributors
      </p>
    </div>
  )
}
