import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TUDURI_WORKS, ATELIER_EXPLORER } from '../config/tuduriAtelier'

type Listing = {
  id: string
  title: string
  listing_type: string
  state: string
  start_bid_cents: number
  high_bid_cents?: number | null
  end_at: string
  currency?: string
}

function apiBase() {
  return ((import.meta.env.VITE_ACCESS_API_BASE as string) || '').replace(/\/$/, '')
}

export default function AuctionPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const base = apiBase()
      if (!base) {
        setEnabled(false)
        setError('La salle est accessible en démonstration, sans enchères réelles.')
        return
      }
      try {
        const cfg = await fetch(`${base}/v1/auction/config`, { cache: 'no-store' })
        if (!cfg.ok) {
          setEnabled(false)
          return
        }
        const j = await cfg.json()
        if (c) return
        setEnabled(Boolean(j.enabled))
        if (!j.enabled) return
        const r = await fetch(`${base}/v1/auction/listings`, { cache: 'no-store' })
        if (r.ok) {
          const data = await r.json()
          if (!c) setListings(Array.isArray(data.listings) ? data.listings : [])
        }
      } catch {
        if (!c) setError('Salle indisponible')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="xa-auction-page mx-auto max-w-3xl px-4 py-8 text-left">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Explore · Auction</p>
      <h1 className="mt-2 text-2xl font-medium text-[var(--xa-text)]">Salle des enchères</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Découvrez des œuvres physiques et des créations liées à des NFT de provenance. Les enchères, paiements en euros et transferts de propriété ne sont pas encore ouverts : chaque lot doit d’abord être vérifié.
      </p>

      <nav aria-label="Découvrir les espaces de vente xArtists" className="mt-5 flex flex-wrap gap-3">
        <Link to="/marketplace" className="inline-flex min-h-[44px] items-center rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-white">
          Explorer la Marketplace
        </Link>
        <Link to="/studio" className="inline-flex min-h-[44px] items-center rounded-xl border border-amber-100/30 px-4 py-3 text-sm text-[var(--xa-text)] hover:bg-[var(--xa-panel2)]">
          Préparer une œuvre au Studio
        </Link>
      </nav>
      <p role="status" className="xa-auction-public-notice mt-3 text-xs leading-relaxed">
        Salle publique consultable. La consultation d'une œuvre ne constitue pas une enchère ni une commande.
        {enabled === false ? ' Aucune enchère ni adjudication réelle n’est acceptée actuellement.' : ''}
      </p>

      <section aria-labelledby="auction-editorial-preview" className="xa-auction-preview mt-7 grid overflow-hidden rounded-3xl border border-amber-200/20 bg-[#151410] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex min-h-[225px] items-center justify-center bg-[#221f1b] p-4">
          <img src={TUDURI_WORKS[0].url} alt={TUDURI_WORKS[0].name} loading="lazy" className="max-h-72 w-full object-contain" />
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">Atelier Tuduri · Exemple éditorial</p>
          <h2 id="auction-editorial-preview" className="mt-3 font-serif text-2xl text-amber-50">Œuvre témoin · {TUDURI_WORKS[0].name}</h2>
          <p className="mt-3 text-xs leading-6 text-zinc-300">
            Illustration d’une future fiche de lot : artiste, état, provenance et documents
            seront vérifiés indépendamment avant toute mise aux enchères.
          </p>
          <p className="mt-3 text-xs font-medium text-amber-200">
            Non proposé à la vente · aucune enchère, prix, garde ni adjudication attestés.
          </p>
          <a href={ATELIER_EXPLORER} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[44px] items-center text-xs text-zinc-100 underline underline-offset-4">
            Consulter la collection sur MultiversX ↗
          </a>
        </div>
      </section>

      {enabled === false && (
        <div className="xa-auction-status mt-6 rounded-2xl p-4 text-sm">
          <p className="font-medium">Enchères en préparation — aucune mise possible</p>
          <p className="mt-2 text-[12px]">Les lots sont présentés pour information. Aucun paiement, transfert de propriété ni adjudication n’est disponible dans cette salle.</p>
          <details className="xa-auction-technical mt-2 text-[12px]"><summary>Détails techniques</summary><p>La fonction d’enchères publiques n’est pas activée. Les contrôles de provenance et les étapes de garde restent à valider avant ouverture.</p></details>
          {error ? <p className="mt-2 text-[11px] text-zinc-500">{error}</p> : null}
        </div>
      )}

      {enabled && listings.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">Aucun lot publié pour le moment.</p>
      )}

      <ul className="mt-6 space-y-3">
        {listings.map((l) => (
          <li
            key={l.id}
            className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] text-amber-50/95">{l.title}</h2>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">{l.state}</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {l.listing_type} · départ {(l.start_bid_cents / 100).toFixed(2)} {l.currency || 'EUR'}
              {l.high_bid_cents != null
                ? ` · enchère ${(l.high_bid_cents / 100).toFixed(2)}`
                : ''}
            </p>
            <p className="mt-1 text-[10px] text-zinc-600">Fin {new Date(l.end_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
