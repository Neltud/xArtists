import { useEffect, useState } from 'react'
import { getAccessApiBase } from '../../lib/stripe'

/**
 * Artprice by Artmarket.com: official source links, NOT a data feed or
 * endorsement. Paid records require a written B2B data license.
 * No scraping, valuations, backend keys, analytics or cross-site embeds.
 */
const ART_PRICE_OFFICIAL_REPORT =
  'https://fr.artprice.com/artprice-news/13751/le-rapport-mondial-du-marche-de-l-art-2025-par-artprice-la-reprise-tant-attendue-semble-avoir-commence'
const ART_PRICE_CONTEMPORARY_2026 =
  'https://fr.artprice.com/artprice-reports/le-marche-de-lart-contemporain-2026'
const ART_PRICE_OFFICIAL_SITE = 'https://fr.artprice.com/'

export default function ArtpriceOfficialPanel() {
  const base = getAccessApiBase()
  const [status, setStatus] = useState<'checking' | 'pending_license' | 'unavailable'>('checking')

  useEffect(() => {
    if (!/^https:\/\//.test(base)) { setStatus('pending_license'); return }
    const controller = new AbortController()
    fetch(base + '/v1/artprice/status', { cache: 'no-store', signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error('artprice_status_unavailable')
        const body = await r.json() as { licensed?: boolean; records_available?: boolean }
        // No unverified provider data is displayed, even if a remote response
        // claims enabled; an integration audit and legal grant are required.
        setStatus(body.licensed === false && body.records_available === false
          ? 'pending_license' : 'unavailable')
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('unavailable') })
    return () => controller.abort()
  }, [base])

  return (
    <section aria-labelledby="artprice-reference-title"
      className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:text-zinc-300">
        Référence externe officielle · Artprice by Artmarket.com
      </p>
      <h2 id="artprice-reference-title" className="mt-2 font-serif text-2xl">
        Le marché de l’art, à la source
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        Retrouvez les analyses publiées directement par Artprice. Les résultats
        d’enchères détaillés, cotes d’artistes et historiques payants ne sont pas
        reproduits ici : xArtists n’a pas encore de licence de redistribution
        ni de flux de données contractuellement vérifié.
      </p>
      <p role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        {status === 'checking' ? 'Contrôle de disponibilité des données…' :
          status === 'pending_license' ? 'Connexion aux données Artprice : licence officielle en attente. Aucune cote ou estimation publiée.' :
            'Connexion aux données Artprice indisponible ou non certifiée. Aucune cote affichée.'}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={ART_PRICE_CONTEMPORARY_2026} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
          Lire le rapport officiel Artprice 2026
        </a>
        <a href={ART_PRICE_OFFICIAL_REPORT} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
          Lire le rapport officiel Artprice 2025
        </a>
        <a href={ART_PRICE_OFFICIAL_SITE} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:text-zinc-100">
          Consulter Artprice
        </a>
      </div>
      <p className="mt-4 text-xs leading-6 text-zinc-600 dark:text-zinc-400">
        Lien vers un service tiers indépendant. Ni partenariat Artprice ni
        expertise de valeur ou recommandation d’achat ne sont revendiqués.
      </p>
    </section>
  )
}
