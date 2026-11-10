/**
 * xArtists /offres — non-transactional commercial discovery only.
 *
 * NO checkout, payment collection, reservation, order, wallet, mint,
 * NFT certificate, automatic access or entitlement in this page.
 * This page does not implement or link any payment provider checkout.
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

// Owner-selected commercial TARGETS, not VM quotes or Stripe Prices.
// Actual contract readback 2026-11-08: 1 / 5 / 2.5 EGLD. Any price mismatch
// blocks purchases and must never be corrected by silently overpaying.
export const GENESIS_PREVIEW = [
  { id: 'pulse', targetEgld: '33', observedEgld: '1', cap: 333, motif: '⚡' },
  { id: 'yield', targetEgld: '22', observedEgld: '5', cap: 500, motif: '◈' },
  { id: 'sentinel', targetEgld: '11', observedEgld: '2,5', cap: 777, motif: '◇' },
] as const

// Walletless, service-only monthly proposals. Labels are placeholders pending
// owner naming, legal VAT/terms and certified Stripe subscription onboarding.
export const MAINSTREAM_PREVIEW = [
  { sku: 'fiat_379', price: '3,79', level: 1 },
  { sku: 'fiat_579', price: '5,79', level: 2 },
  { sku: 'fiat_979', price: '9,79', level: 3 },
] as const

const COPY = {
  fr: {
    kicker: 'xArtists · Offres en préparation',
    title: 'Explorer l’art. Choisir des services simples.',
    lead: 'Deux univers bien séparés : des abonnements aux services xArtists en euros, sans wallet ni NFT, et des œuvres numériques Genesis à découvrir sur MultiversX.',
    signal: 'Catalogue de présentation · aucune commande ni paiement accepté sur cette page',
    warning: 'Ces prix sont des objectifs, pas des devis exécutables. Aucun abonnement ni achat NFT n’est actuellement ouvert.',
    servicesTitle: 'Services xArtists — sans wallet',
    servicesLead: 'Trois niveaux mensuels prévus via Stripe Nelsonprods. Les tarifs TTC/HT, services détaillés, conditions et noms définitifs sont encore à valider.',
    level: 'Niveau',
    perMonth: 'par mois',
    servicesTag: 'Abonnement EUR · services uniquement',
    servicesWhat: 'Services numériques xArtists ; détail du niveau à confirmer avant ouverture.',
    servicesNoNft: 'Sans NFT, sans pack Genesis, sans mint et sans portefeuille crypto obligatoire.',
    servicesOff: 'Souscription indisponible · aucun paiement actif',
    genesisTitle: 'Genesis — œuvres NFT sur MultiversX',
    genesisLead: 'Trois éditions NFT à achat unique envisagé par signature du wallet. Les prix ci-dessous ne sont pas les montants actuellement appliqués par les contrats.',
    genesisTag: 'Prix EGLD cible · non payable',
    genesisWhat: 'Édition Genesis à découvrir. Achat unique NFT uniquement après preuve on-chain et livraison vérifiée.',
    observed: 'Dernier prix de contrat relevé le 08/11 :',
    mismatch: 'Écart contrat / objectif : vente bloquée',
    packDetails: 'Découvrir l’œuvre',
    enquiry: 'Demande publique de présentation',
    how: 'Comment découvrir xArtists aujourd’hui ?',
    step1: 'Visitez le musée et les pages des packs, sans achat et sans portefeuille.',
    step2: 'Pour présenter un projet ou proposer un partenariat, ouvrez une demande GitHub publique. Compte GitHub requis.',
    step3: 'Ne partagez jamais votre e-mail, téléphone, wallet, clé, commande ou information personnelle dans ce ticket public.',
    contact: 'Faire une demande publique',
    publicNote: 'Le ticket GitHub est visible par tous. Pas de données personnelles ni de demande de paiement.',
    social: 'Actualités sur X',
    museum: 'Visiter le Musée',
    studio: 'Explorer le Studio',
    trust: 'Informations importantes',
    trustCopy: 'Un NFT ne prouve pas automatiquement la propriété juridique d’une œuvre physique. Les analyses IA ne sont aucun certificat d’authenticité. LIA reste en mode démonstration : aucun rendement financier garanti.',
    oldModel: 'Anciennes offres Whop et anciens prix des packs en euros : références historiques, non proposées ici.',
    status: 'Contact public provisoire via GitHub tant que la messagerie du domaine n’est pas certifiée. Paiements publics, mint, ventes NFT et enchères : fermés.',
    docs: 'Documentation et conditions',
  },
  en: {
    kicker: 'xArtists · Offers in preparation',
    title: 'Explore art. Discover simple services.',
    lead: 'Two distinct paths: xArtists service subscriptions in euros without a wallet or NFTs, and Genesis digital artworks to explore on MultiversX.',
    signal: 'Discovery catalogue · no orders or payments are accepted on this page',
    warning: 'These are target prices, not executable quotes. No subscription or NFT purchase is currently available.',
    servicesTitle: 'xArtists services — no wallet needed',
    servicesLead: 'Three proposed monthly tiers via Stripe Nelsonprods. Tax treatment, precise services, terms and final names are not yet confirmed.',
    level: 'Tier',
    perMonth: 'per month',
    servicesTag: 'EUR subscription · services only',
    servicesWhat: 'xArtists digital services; exact tier features to be confirmed before release.',
    servicesNoNft: 'No NFT, no Genesis pack, no mint and no crypto wallet required.',
    servicesOff: 'Subscriptions unavailable · no live payments',
    genesisTitle: 'Genesis — NFT artworks on MultiversX',
    genesisLead: 'Three proposed limited NFT editions, each requiring a separately signed wallet transaction. The targets below do not match the contract prices currently observed.',
    genesisTag: 'EGLD price target · not payable',
    genesisWhat: 'Explore a Genesis edition. NFT purchase only after on-chain evidence and confirmed delivery.',
    observed: 'Last observed contract price on Nov 8:',
    mismatch: 'Contract / target mismatch: sales blocked',
    packDetails: 'Explore the artwork',
    enquiry: 'Public introduction request',
    how: 'How can you explore xArtists now?',
    step1: 'Visit the museum and pack pages without purchase or a wallet.',
    step2: 'To introduce a project or partnership, use the public GitHub request form. GitHub login required.',
    step3: 'Never share your email, phone, wallet, keys, order or personal information in that public ticket.',
    contact: 'Submit a public enquiry',
    publicNote: 'GitHub issues are public. Do not post personal information or payment details.',
    social: 'Updates on X',
    museum: 'Visit the Museum',
    studio: 'Explore the Studio',
    trust: 'Important information',
    trustCopy: 'An NFT does not automatically prove legal ownership of physical art. AI assessments are not authenticity certificates. LIA remains in demonstration mode. No financial return is guaranteed.',
    oldModel: 'Former Whop plans and the old euro-priced NFT catalogue are historical references, not current offers.',
    status: 'Public contact is temporarily via GitHub until domain email delivery is certified. Public payments, mint, NFT sales and auctions are disabled.',
    docs: 'Documentation and terms',
  },
} as const

// Public issue form only — never capture or transmit personal/payment data.
const PUBLIC_INTAKE_URL = 'https://github.com/Neltud/xArtists/issues/new?template=commercial-introduction.yml'
const PUBLIC_SOCIAL_URL = 'https://x.com/tudurioriginal'

export default function CommercialLaunchPage() {
  const { lang } = useI18n()
  const c = lang === 'fr' ? COPY.fr : COPY.en

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-24 pt-8 text-zinc-900 dark:text-zinc-100 sm:px-7 sm:pt-14">
      <header className="rounded-[2rem] border border-zinc-200 bg-white px-6 py-10 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:px-12 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">{c.kicker}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">{c.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-700 dark:text-zinc-300">{c.lead}</p>
        <p role="status" className="mt-5 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">{c.signal}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a className="inline-flex min-h-[44px] items-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-950" href="#commercial-services">{c.servicesTitle}</a>
          <a className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold dark:border-zinc-600" href="#commercial-genesis">{c.genesisTitle}</a>
          <Link className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold dark:border-zinc-600" to="/museum">{c.museum}</Link>
        </div>
      </header>

      <section id="commercial-services" aria-labelledby="services-heading" className="scroll-mt-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Stripe · EUR</p>
        <h2 id="services-heading" className="mt-2 font-serif text-3xl">{c.servicesTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.servicesLead}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {MAINSTREAM_PREVIEW.map(tier => (
            <article key={tier.sku} data-sku={tier.sku} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{c.level} {tier.level}</p>
              <h3 className="mt-3 text-4xl font-semibold tabular-nums">{tier.price} €</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{c.perMonth}</p>
              <p className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{c.servicesTag}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.servicesWhat}</p>
              <p className="mt-4 rounded-xl bg-zinc-100 px-3 py-3 text-sm leading-6 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">{c.servicesNoNft}</p>
              <p role="status" className="mt-5 text-sm font-semibold text-amber-800 dark:text-amber-200">{c.servicesOff}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="commercial-genesis" aria-labelledby="genesis-heading" className="scroll-mt-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">MultiversX · EGLD</p>
        <h2 id="genesis-heading" className="mt-2 font-serif text-3xl">{c.genesisTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.genesisLead}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {GENESIS_PREVIEW.map(pack => (
            <article key={pack.id} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <span aria-hidden="true" className="text-3xl">{pack.motif}</span>
              <h3 className="mt-4 font-serif text-2xl capitalize">{pack.id}</h3>
              <p className="mt-2 text-4xl font-semibold tabular-nums">{pack.targetEgld} EGLD</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{c.genesisTag}</p>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.genesisWhat}</p>
              <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{c.observed} {pack.observedEgld} EGLD</p>
              <p role="status" className="mt-2 text-sm font-semibold text-amber-800 dark:text-amber-200">{c.mismatch}</p>
              <Link to={'/packs/' + pack.id} className="mt-5 inline-flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-600">{c.packDetails}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900 sm:p-9" aria-labelledby="commercial-how">
        <h2 id="commercial-how" className="font-serif text-2xl">{c.how}</h2>
        <ol className="mt-5 grid gap-5 text-sm leading-7 text-zinc-700 dark:text-zinc-300 md:grid-cols-3">
          {[c.step1, c.step2, c.step3].map((step, i) => (
            <li key={step}><span className="mr-2 font-semibold">0{i + 1}.</span>{step}</li>
          ))}
        </ol>
        <p className="mt-6 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{c.warning}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={PUBLIC_INTAKE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">{c.contact}</a>
          <a href={PUBLIC_SOCIAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 px-5 py-3 text-sm dark:border-zinc-600">{c.social}</a>
          <Link to="/studio" className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 px-5 py-3 text-sm dark:border-zinc-600">{c.studio}</Link>
        </div>
        <p className="mt-4 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{c.publicNote}</p>
      </section>

      <aside className="rounded-2xl border border-zinc-200 p-6 text-sm leading-6 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
        <h2 className="font-semibold text-zinc-900 dark:text-white">{c.trust}</h2>
        <p className="mt-2">{c.trustCopy}</p>
        <p className="mt-2">{c.oldModel}</p>
        <p className="mt-3 font-semibold">{c.status}</p>
        <a href="https://xartists.gitbook.io/xartists/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center underline underline-offset-4">{c.docs}</a>
      </aside>
    </main>
  )
}
