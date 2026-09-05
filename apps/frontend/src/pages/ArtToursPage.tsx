/**
 * Tours artistiques — carte + musées 3D (service CULTURE, pas un pack agent).
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InfoTip from '../components/InfoTip'
import ArtWorldMap from '../components/ArtWorldMap'
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
      try {
        const urls = [
          `${import.meta.env.BASE_URL || '/'}data/tours.json`,
          `${import.meta.env.BASE_URL || '/'}data/art_tours.json`,
        ]
        for (const u of urls) {
          const r = await fetch(u, { cache: 'force-cache' })
          if (!r.ok) continue
          const j = await r.json()
          if (!c) setDoc(j)
          break
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const enterMuseum = (m: VirtualMuseum) => {
    navigate(
      museumTravelHref({
        id: m.id,
        city: m.city,
        country: m.country,
        focus: m.name,
        space: 'world_tour',
        source: 'tours',
        museumId: m.id,
      })
    )
  }

  const enterCity = (city: string) => {
    navigate(
      museumTravelHref({
        id: city,
        city,
        space: 'world_tour',
        source: 'tours',
      })
    )
  }

  return (
    <div className="animate-fade-in pb-12 max-w-5xl mx-auto space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Culture</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Tours artistiques</h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-xl inline-flex flex-wrap items-center gap-1">
          Carte mondiale · musées 3D surréalistes · expos en temps réel
          <InfoTip>
            <strong className="text-white block mb-1">Service CULTURE</strong>
            <span className="text-zinc-400">
              Carte + musées (Louvre, Ermitage…). Séparé de Pulse · Yield · Sentinel.
            </span>
          </InfoTip>
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-300">Entrer dans un musée 3D</h2>
        <p className="text-[11px] text-zinc-600">
          Plans inspirés des typologies réelles — atmosphère surréaliste WebGL.
        </p>
        <div className="flex flex-wrap gap-2">
          {museums.slice(0, 20).map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => enterMuseum(m)}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-rose-500/5 hover:border-rose-400/40 px-3 py-2 text-left min-w-[8.5rem] transition-colors"
            >
              <p className="text-[12px] font-semibold text-white truncate">{m.name}</p>
              <p className="text-[10px] text-zinc-500">{m.city}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Carte mondiale</h2>
        <p className="text-[11px] text-zinc-600">
          Clic marqueur → expos · boutons <strong className="text-zinc-400">Musées 3D</strong> → visite
        </p>
        <ErrorBoundary>
          <ArtWorldMap />
        </ErrorBoundary>
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

      {doc && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card space-y-2 text-sm text-zinc-300">
            {doc.name && <p className="font-bold text-white">{doc.name}</p>}
            {doc.list_eur_from != null && (
              <p className="text-zinc-500 text-xs">À partir de {doc.list_eur_from} €</p>
            )}
            {Array.isArray(doc.scope_v1) && (
              <ul className="list-disc pl-5 text-zinc-400 text-xs space-y-1">
                {doc.scope_v1.map(s => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
          </div>
          {Array.isArray(doc.sample_tours) && doc.sample_tours.length > 0 && (
            <div className="card space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Parcours exemples</p>
              <ul className="space-y-2">
                {doc.sample_tours.map(t => (
                  <li key={t.id} className="border-b border-white/[0.05] pb-2 last:border-0">
                    <span className="text-white font-medium text-sm">{t.title}</span>
                    {t.duration && (
                      <span className="text-zinc-500 text-xs ml-2">{t.duration}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-zinc-600">
        <Link to="/museum" className="text-cyan-300/90 hover:underline">
          Galerie 3D
        </Link>
        {' · '}
        <Link to="/agents" className="text-violet-300/90 hover:underline">
          Packs Agents
        </Link>
      </p>
    </div>
  )
}
