/**
 * xArtists /offres — non-transactional commercial discovery only.
 *
 * NO checkout, payment collection, reservation, order, wallet, mint,
 * NFT certificate, automatic access or entitlement in this page.
 * This page does not implement or link any payment provider checkout.
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { GENESIS_PREVIEW, MAINSTREAM_PREVIEW, XORUS_ANALYSIS_TRACKS_PREVIEW } from '../config/commercialTargets'
import { useCommercialCatalog } from '../hooks/useCommercialCatalog'
import { COMMUNITY_CONTACTS } from '../config/communityLinks'

const COPY = {
  fr: {
    kicker: 'xArtists · Offres en préparation',
    title: 'Explorer l’art. Choisir des services simples.',
    lead: 'Deux univers bien séparés : des abonnements aux services xArtists en euros, sans wallet ni NFT, et des œuvres numériques Genesis à découvrir sur MultiversX.',
    signal: 'Catalogue de présentation · aucune commande ni paiement accepté sur cette page',
    warning: 'Ces montants sont des objectifs, pas des devis exécutables. Aucun abonnement ni achat NFT n’est ouvert. Politique Genesis : devis EUR/EGLD au moment de la signature, TTL prévu 180 secondes, base EUR non encore définie.',
    servicesTitle: 'Analyses xArtists — sans wallet',
    servicesLead: 'Trois niveaux de prix mensuels en euros, sans wallet et sans NFT. Les analyses existent comme trois domaines de recherche distincts : aucune correspondance niveau → rapport n’est encore certifiée.',
    level: 'Niveau',
    perMonth: 'TTC / mois',
    servicesTag: 'Abonnement EUR · services uniquement',
    servicesWhat: 'Prix cible d’un service futur. Accès, fréquence de publication, quotas et prestations de ce niveau seront précisés avant toute commande.',
    servicesNoNft: 'Sans NFT, sans pack Genesis, sans mint et sans portefeuille crypto obligatoire.',
    servicesOff: 'Souscription indisponible · aucun paiement actif',
    checking: 'Vérification des offres auprès du serveur…',
    apiVerified: 'Statut serveur vérifié · les abonnements restent fermés',
    apiUnavailable: 'Statut serveur indisponible · tarifs indicatifs non vérifiés en direct, aucune commande possible',
    pricingNote: 'Montants prévus uniquement · ne constituent ni un prix contractuel ni une autorisation de paiement.',
    tracksTitle: 'Ce que xOrus prépare comme analyses',
    tracksLead: 'Trois domaines de travail distincts des niveaux de prix. Nous vendrons nos propres synthèses et interprétations, jamais les données brutes collectées. Aucune prestation par niveau ni licence source n’est encore certifiée.',
    trackStatus: 'Recherche / paper · rapport privé non commercialisé',
    trackSee: 'Explorer les agents',
    genesisTitle: 'Genesis — œuvres NFT sur MultiversX',
    genesisLead: 'Trois éditions NFT en préparation : les plafonds cibles 33 / 22 / 11 EGLD ne sont pas des prix de contrat, ni des montants à signer. Aucun achat n’est disponible.',
    genesisTag: 'Plafond EGLD cible · non payable',
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
    publicNote: 'Le ticket GitHub est visible par tous. Pas de données personnelles ni de demande de paiement ; l’adresse de contact du domaine n’est pas encore certifiée.',
    social: 'Actualités sur X',
    communityTitle: 'Contacts communautaires',
    communityLead: 'Discord et Telegram servent aux échanges publics, pas aux demandes privées de support ou aux paiements.',
    communityPending: 'Lien officiel à confirmer',
    communitySafety: 'Ne communiquez jamais votre phrase secrète, mot de passe ou informations de paiement sur Discord ou Telegram.',
    museum: 'Visiter le Musée',
    studio: 'Explorer le Studio',
    trust: 'Informations importantes',
    trustCopy: 'Un NFT ne prouve pas automatiquement la propriété juridique d’une œuvre physique. Les analyses IA ne sont aucun certificat d’authenticité. xOrus reste en mode paper : aucun rendement financier garanti.',
    oldModel: 'Anciennes offres Whop et anciens prix des packs en euros : références historiques, non proposées ici.',
    status: 'Contact public provisoire via GitHub tant que la messagerie du domaine n’est pas certifiée. Paiements publics, mint, ventes NFT et enchères : fermés.',
    docs: 'Documentation et conditions',
  },
  en: {
    kicker: 'xArtists · Offers in preparation',
    title: 'Explore art. Discover simple services.',
    lead: 'Two distinct paths: xArtists service subscriptions in euros without a wallet or NFTs, and Genesis digital artworks to explore on MultiversX.',
    signal: 'Discovery catalogue · no orders or payments are accepted on this page',
    warning: 'These are price targets, not executable quotes. No subscriptions or NFTs are for sale. Genesis policy: fresh EUR/EGLD quote at signing, planned 180-second TTL; EUR base price not yet established.',
    servicesTitle: 'xArtists analysis — no wallet needed',
    servicesLead: 'Three planned EUR monthly price tiers, without a wallet or NFTs. Analysis covers three separate research tracks; tier-to-report benefits are not yet certified',
    level: 'Tier',
    perMonth: 'incl. VAT / month',
    servicesTag: 'EUR subscription · services only',
    servicesWhat: 'Target pricing for a future service. Access, publication frequency, quotas and benefits must be specified before orders open.',
    servicesNoNft: 'No NFT, no Genesis pack, no mint and no crypto wallet required.',
    servicesOff: 'Subscriptions unavailable · no live payments',
    checking: 'Checking the server catalogue…',
    apiVerified: 'Server status verified · subscriptions remain closed',
    apiUnavailable: 'Server status unavailable · target prices not verified live, orders disabled',
    pricingNote: 'Planned amounts only · neither contract prices nor payment authorization.',
    tracksTitle: 'Analysis xOrus is preparing',
    tracksLead: 'Three research tracks distinct from the price tiers. We aim to sell our derived commentary and analysis, not collected raw data. Tier benefits and supplier commercial rights are not yet certified.',
    trackStatus: 'Research / paper · private reports not for sale',
    trackSee: 'Explore the agents',
    genesisTitle: 'Genesis — NFT artworks on MultiversX',
    genesisLead: 'Three planned NFT editions: target ceilings of 33 / 22 / 11 EGLD are neither contract prices nor amounts to sign. Purchases remain closed.',
    genesisTag: 'EGLD target ceiling · not payable',
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
    publicNote: 'GitHub issues are public. Never post personal or payment details; the domain mailbox is not certified.',
    social: 'Updates on X',
    communityTitle: 'Community contacts',
    communityLead: 'Discord and Telegram are public community channels, not private support or payment channels.',
    communityPending: 'Official link awaiting confirmation',
    communitySafety: 'Never share your recovery phrase, password or payment information on Discord or Telegram.',
    museum: 'Visit the Museum',
    studio: 'Explore the Studio',
    trust: 'Important information',
    trustCopy: 'An NFT does not automatically prove legal ownership of physical art. AI assessments are not authenticity certificates. xOrus remains in paper mode. No financial return is guaranteed.',
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
  const { catalog, status: catalogStatus } = useCommercialCatalog()
  const statusMessage = catalogStatus === 'verified' ? c.apiVerified : catalogStatus === 'loading' ? c.checking : c.apiUnavailable

  return (
    <main className="xa-offers-page mx-auto w-full max-w-6xl space-y-12 px-4 pb-28 pt-8 text-zinc-900 dark:text-zinc-100 sm:px-7 sm:pt-14">
      <header className="xa-offers-hero rounded-3xl border border-zinc-200 bg-white px-5 py-9 dark:border-zinc-700 dark:bg-zinc-900 sm:px-12 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">{c.kicker}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-3xl leading-tight sm:text-5xl">{c.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-700 dark:text-zinc-300">{c.lead}</p>
        <p role="status" className="xa-offers-status mt-6 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">{c.signal}</p>
        <div className="xa-offers-actions mt-7 flex flex-wrap gap-3">
          <a className="inline-flex min-h-[44px] items-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-950" href="#commercial-services">{c.servicesTitle}</a>
          <a className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold dark:border-zinc-600" href="#commercial-genesis">{c.genesisTitle}</a>
          <Link className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold dark:border-zinc-600" to="/museum">{c.museum}</Link>
        </div>
      </header>

      <section id="commercial-services" aria-labelledby="services-heading" className="xa-offers-section scroll-mt-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Stripe · EUR</p>
        <h2 id="services-heading" className="mt-2 font-serif text-3xl">{c.servicesTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.servicesLead}</p>
        <p role="status" aria-live="polite" data-testid="commercial-server-status"
          className="mt-4 text-sm font-medium text-amber-900 dark:text-amber-200">{statusMessage}</p>
        <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-3">
          {MAINSTREAM_PREVIEW.map(tier => (
            <article key={tier.sku} data-sku={tier.sku} className="xa-offers-card flex min-w-0 flex-col rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{c.level} {tier.level}</p>
              <h3 className="mt-3 text-3xl font-semibold tabular-nums sm:text-4xl">{catalog
                ? (catalog.monthly_services.find(item => item.sku === tier.sku)?.target_cents ?? tier.cents) / 100
                  && new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    .format((catalog.monthly_services.find(item => item.sku === tier.sku)?.target_cents ?? tier.cents) / 100)
                : tier.price} €</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{c.perMonth}</p>
              <p className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{c.servicesTag}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.servicesWhat}</p>
              <p className="mt-4 rounded-xl bg-zinc-100 px-3 py-3 text-sm leading-6 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">{c.servicesNoNft}</p>
              <p role="status" className="mt-auto pt-5 text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">{c.servicesOff}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-6 text-zinc-600 dark:text-zinc-400">{c.pricingNote}</p>
      </section>

      <section id="commercial-tracks" aria-labelledby="commercial-tracks-title" className="xa-offers-section scroll-mt-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">xOrus · Intelligence</p>
        <h2 id="commercial-tracks-title" className="mt-2 font-serif text-3xl">{c.tracksTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">{c.tracksLead}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {XORUS_ANALYSIS_TRACKS_PREVIEW.map(track => (
            <article key={track.id} data-analysis-track={track.id}
              className="xa-offers-card flex flex-col rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
              <h3 className="font-serif text-xl">{lang === 'fr' ? track.frName : track.enName}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                {lang === 'fr' ? track.frDescription : track.enDescription}
              </p>
              <p role="status" className="mt-4 text-xs font-semibold text-amber-900 dark:text-amber-200">{c.trackStatus}</p>
              <Link to="/intelligence/agents" className="mt-auto pt-5 text-sm font-semibold underline underline-offset-4">
                {c.trackSee}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="commercial-genesis" aria-labelledby="genesis-heading" className="xa-offers-section scroll-mt-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">MultiversX · EGLD</p>
        <h2 id="genesis-heading" className="mt-2 font-serif text-3xl">{c.genesisTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.genesisLead}</p>
        <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-3">
          {GENESIS_PREVIEW.map(pack => (
            <article key={pack.id} className="xa-offers-card flex min-w-0 flex-col rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
              <span aria-hidden="true" className="text-3xl">{pack.motif}</span>
              <h3 className="mt-4 font-serif text-2xl capitalize">{pack.id}</h3>
              <p className="mt-2 text-3xl font-semibold tabular-nums sm:text-4xl">{pack.targetEgld} EGLD</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.genesisTag}</p>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.genesisWhat}</p>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.observed} {pack.observedEgld} EGLD</p>
              <p role="status" className="mt-2 mb-5 text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">{c.mismatch}</p>
              <Link to={'/packs/' + pack.id} className="xa-offers-link mt-auto inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:text-white">{c.packDetails}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="xa-offers-steps rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-9" aria-labelledby="commercial-how">
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
        <section className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-700" aria-labelledby="xa-community-title">
          <h3 id="xa-community-title" className="font-semibold text-zinc-900 dark:text-zinc-100">{c.communityTitle}</h3>
          <p className="mt-2 text-sm leading-6">{c.communityLead}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {(['discord', 'telegram'] as const).map(network => COMMUNITY_CONTACTS[network]
              ? <a key={network} href={COMMUNITY_CONTACTS[network]!} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold dark:border-zinc-600">{network === 'discord' ? 'Discord' : 'Telegram'} ↗</a>
              : <span key={network} className="inline-flex min-h-[44px] items-center rounded-full border border-dashed border-zinc-300 px-5 py-3 text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">{network === 'discord' ? 'Discord' : 'Telegram'} · {c.communityPending}</span>)}
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{c.communitySafety}</p>
        </section>
      </section>

      <aside className="xa-offers-trust rounded-3xl border border-zinc-200 p-5 text-sm leading-7 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 sm:p-7">
        <h2 className="font-semibold text-zinc-900 dark:text-white">{c.trust}</h2>
        <p className="mt-2">{c.trustCopy}</p>
        <p className="mt-2">{c.oldModel}</p>
        <p className="mt-3 font-semibold">{c.status}</p>
        <a href="https://xartists.gitbook.io/xartists/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center underline underline-offset-4">{c.docs}</a>
      </aside>
    </main>
  )
}
