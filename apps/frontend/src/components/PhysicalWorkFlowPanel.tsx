import { Link } from 'react-router-dom'

/**
 * Physical art provenance discovery only.
 *
 * Legacy merchant fulfillment, customer-wallet binding and carrier webhooks
 * were retired 2026-11-10. No merchant order state, shipping form,
 * wallet signature, uploaded file or confidential buyer data is collected.
 * The historical backend custody ledger remains inaccessible to public writes.
 */
export default function PhysicalWorkFlowPanel() {
  return (
    <section aria-labelledby="physical-provenance-preview"
      className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
        xArtists · Art physique / provenance
      </p>
      <h2 id="physical-provenance-preview" className="mt-3 font-serif text-2xl">
        Documenter une œuvre physique
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        La provenance, la condition, la garde et les éventuels NFT sont des preuves distinctes.
        Les étapes de déclaration, de livraison et de réception exigent des justificatifs et une revue humaine.
      </p>
      <p role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        Registre logistique actuellement indisponible. Aucun service marchand tiers,
        webhook de commande, paiement, transfert NFT ou certificat de valeur n'est actif.
        Les dossiers historiques restent préservés pour audit, sans nouvelle écriture publique.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/studio" className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
          Préparer mon œuvre dans le Studio
        </Link>
        <Link to="/marketplace?tab=rwa" className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:text-zinc-100">
          Explorer l'art physique
        </Link>
      </div>
      <p className="mt-4 text-xs leading-6 text-zinc-600 dark:text-zinc-400">
        Un NFT ne constitue ni un titre de propriété de l'œuvre physique,
        ni une expertise d'authenticité, ni une preuve de réception du colis.
      </p>
    </section>
  )
}
