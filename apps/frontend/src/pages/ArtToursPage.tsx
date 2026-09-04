import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import ArtWorldMap from '../components/ArtWorldMap'
import ErrorBoundary from '../components/ErrorBoundary'
import { museumTravelHref } from '../lib/travelBridge'
import {
  buildMuseumNetwork,
  museumIdForCity,
  type VirtualMuseum,
} from '../lib/museumWorldCatalog'

type City = { id: string; label: string; focus?: string; score?: number; note?: string }
type Tour = { id: string; title: string; duration?: string; includes?: string[] }

type Doc = {
  name?: string
  list_eur_from?: number
  scope_v1?: string[]
  not_v1?: string[]
  cities?: City[]
  sample_tours?: Tour[]
  not_an_ai_agent_pack?: boolean
}

/** Service culturel — PAS un pack agent IA. */
export default function ArtToursPage() {
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Doc | null>(null)
  const museums = useMemo(
    () => buildMuseumNetwork(import.meta.env.BASE_URL || '/').filter(m => m.id !== 'xartists'),
    []
  )

  useEffect(() => {
    let c = false
    const urls = [
      `${import.meta.env.BASE_URL}data/art_tours.json`,
      'https://raw.githubusercontent.com/Neltud/xArtists/main/data/art_tours.json',
    ]
    ;(async () => {
      for (const url of urls) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`)
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

  const enterCity = (cityLabel: string) => {
    const mid = museumIdForCity(cityLabel) || 'louvre'
    const m = museums.find(x => x.id === mid)
    navigate(
      museumTravelHref({
        id: mid,
        city: cityLabel,
        focus: m?.name,
        space: 'world_tour',
        source: 'tours',
        museumId: mid,
      })
    )
  }

  return (
    <div className="animate-fade-in space-y-5 pb-10 max-w-4xl">
      <PageGuide page="tours" />
      <header className="space-y-1">
        <p className="section-label text-rose-400/80">Culture</p>
        <h1 className="page-title">Art Tours</h1>
        <p className="page-sub inline-flex flex-wrap items-center gap-1">
          Service culturel — sélectionnez une ville → salle 3D
          <InfoTip>
            <strong className="text-white block mb-1">Art Tours</strong>
            <span className="text-zinc-400">
              Carte + musées (Louvre, Ermitage…). Séparé de Pulse · Yield · Sentinel.
            </span>
          </InfoTip>
        </p>
      </header>

      {/* Accès direct musées */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-300">Entrer dans un musée 3D</h2>
        <p className="text-[11px] text-zinc-600">
          Plans inspirés des typologies réelles (enfilade Louvre, nef Orsay, salon Ermitage…).
        </p>
        <div className="flex flex-wrap gap-2">
          {museums.slice(0, 16).map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => enterMuseum(m)}
              className="rounded-2xl border border-white/10 bg-black/30 hover:border-rose-400/40 hover:bg-rose-500/10 px-3 py-2 text-left min-w-[8.5rem] transition-colors"
            >
              <p className="text-[12px] font-semibold text-white truncate">{m.name}</p>
              <p className="text-[10px] text-zinc-500">{m.city}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-300">Carte mondiale</h2>
        <p className="text-[11px] text-zinc-600">
          Clic marqueur → expos · bouton <strong className="text-zinc-400">Entrer</strong> → visite 3D
        </p>
        <ErrorBoundary>
          <ArtWorldMap />
        </ErrorBoundary>
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
