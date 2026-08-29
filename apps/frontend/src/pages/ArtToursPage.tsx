import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import ToursScopeBanner from '../components/ToursScopeBanner'
import ArtWorldMap from '../components/ArtWorldMap'

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

/** Service culturel — PAS un pack agent IA / travel agent. */
export default function ArtToursPage() {
  const [doc, setDoc] = useState<Doc | null>(null)

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

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="tours" />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400/80 font-semibold">
            Service culturel
          </p>
          <h1 className="display text-3xl sm:text-4xl">Art Tours</h1>
          <p className="muted">Carte mondiale réelle · expos · parcours — pas un pack IA</p>
        </div>
        <Link to="/agents" className="btn-secondary text-xs">
          Packs IA
        </Link>
      </header>

      <ToursScopeBanner />

      <section aria-labelledby="map-title" className="space-y-3">
        <h2 id="map-title" className="display text-lg">
          Carte mondiale réelle
        </h2>
        <p className="text-xs text-zinc-500 -mt-1">
          Fond cartographique OSM / CARTO Dark · zoom, pan, marqueurs artistiques, expos en direct
        </p>
        <ArtWorldMap />
      </section>

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
            {Array.isArray(doc.not_v1) && (
              <div className="pt-2 divider">
                <p className="text-[10px] uppercase text-zinc-600 mb-1">Hors scope</p>
                <ul className="list-disc pl-5 text-zinc-500 text-xs space-y-0.5">
                  {doc.not_v1.map(s => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
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
                    {t.includes && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">{t.includes.join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-zinc-600">
        Packs Agents →{' '}
        <Link to="/agents" className="text-violet-300 underline">
          /agents
        </Link>
      </p>
    </div>
  )
}
