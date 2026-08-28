import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import ToursScopeBanner from '../components/ToursScopeBanner'

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

/** Service culturel complet — PAS un pack agent IA / travel agent. */
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
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400/80">Service culturel</p>
        <h1 className="text-3xl font-black">Tours artistiques</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Expositions, visites guidées, parcours art — pas un agent IA
        </p>
      </header>

      <ToursScopeBanner />

      {doc && (
        <div className="card space-y-3 text-sm text-zinc-300">
          {doc.name && <p className="font-bold text-white">{doc.name}</p>}
          {doc.list_eur_from != null && (
            <p className="text-zinc-400">À partir de {doc.list_eur_from} €</p>
          )}
          {Array.isArray(doc.scope_v1) && (
            <ul className="list-disc pl-5 text-zinc-400">
              {doc.scope_v1.map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {Array.isArray(doc.cities) && doc.cities.length > 0 && (
            <div>
              <p className="text-xs uppercase text-zinc-500 mb-1">Villes</p>
              <ul className="flex flex-wrap gap-2">
                {doc.cities.map(c => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300"
                  >
                    {c.label}
                    {c.focus ? ` · ${c.focus}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(doc.sample_tours) && doc.sample_tours.length > 0 && (
            <div>
              <p className="text-xs uppercase text-zinc-500 mb-1">Exemples</p>
              <ul className="space-y-2">
                {doc.sample_tours.map(t => (
                  <li key={t.id} className="border-b border-white/5 pb-2">
                    <span className="text-white font-medium">{t.title}</span>
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

      {!doc && (
        <p className="text-sm text-zinc-500">
          Catalogue tours en chargement / bientôt enrichi. Service distinct des packs NFT.
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        <Link to="/gallery" className="btn-secondary py-2 px-3">
          Galerie
        </Link>
        <Link to="/agents" className="btn-secondary py-2 px-3">
          Packs IA (autre offre)
        </Link>
      </div>
    </div>
  )
}
