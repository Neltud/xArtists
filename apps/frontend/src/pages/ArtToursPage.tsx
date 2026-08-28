import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'

type City = { id: string; label: string; focus?: string; score?: number; note?: string }
type Tour = { id: string; title: string; duration?: string; includes?: string[] }

type Doc = {
  name?: string
  list_eur_from?: number
  scope_v1?: string[]
  not_v1?: string[]
  cities?: City[]
  sample_tours?: Tour[]
  cta?: string
  not_an_ai_agent_pack?: boolean
}

/** Service culturel — pas un pack agent IA. */
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
      <PageGuide page="gallery" />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400/80">Service culturel</p>
          <h1 className="text-3xl font-black">{doc?.name || 'Tours artistiques'}</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Visites, expositions, itinéraires galeries — <strong className="text-zinc-300">pas un pack agent IA</strong>.
            {doc?.list_eur_from != null && (
              <span className="text-rose-200/90"> À partir de {doc.list_eur_from} €.</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/gallery" className="btn-secondary text-xs py-2 px-3">
            Galerie
          </Link>
          <Link to="/studio" className="btn-secondary text-xs py-2 px-3">
            Studio
          </Link>
          <Link to="/agents" className="btn-primary text-xs py-2 px-3">
            Packs IA →
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-50/90">
        Les packs agents restent <strong>Pulse · Yield · Sentinel</strong>. Ce module organise des expériences
        artistiques réelles / phygitales.
      </div>

      <section className="grid sm:grid-cols-2 gap-3">
        <div className="card">
          <h2 className="font-bold text-sm mb-2">Inclus v1</h2>
          <ul className="text-xs text-zinc-400 space-y-1 list-disc pl-4">
            {(doc?.scope_v1 || []).map(s => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-bold text-sm mb-2">Hors scope</h2>
          <ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4">
            {(doc?.not_v1 || []).map(s => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Villes</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(doc?.cities || []).map(city => (
            <div key={city.id} className="card border-rose-500/15">
              <p className="font-bold">{city.label}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{city.focus}</p>
              {city.score != null && (
                <p className="text-[10px] text-rose-300/80 mt-2 mono">score {city.score}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Exemples de tours</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {(doc?.sample_tours || []).map(t => (
            <div key={t.id} className="card">
              <p className="font-bold text-sm">{t.title}</p>
              <p className="text-[11px] text-zinc-500">{t.duration}</p>
              <ul className="text-xs text-zinc-400 mt-2 space-y-1 list-disc pl-4">
                {(t.includes || []).map(i => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-zinc-500">{doc?.cta}</p>
    </div>
  )
}
