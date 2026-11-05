/**
 * xArtists /offres — non-transactional commercial discovery.
 *
 * Public catalog and public issue-form enquiry only (no email collection):
 * NO checkout, payment collection, reservation, order, wallet, mint,
 * NFT certificate, automatic access or entitlement in this page.
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

const PACKS = [
  { id:'pulse', price:110, cap:333, theme:'from-lime-300/15', motif:'⚡' },
  { id:'yield', price:75, cap:500, theme:'from-slate-300/15', motif:'◈' },
  { id:'sentinel', price:50, cap:777, theme:'from-violet-300/15', motif:'◇' },
] as const

const COPY = {
  fr: {
    kicker:'xArtists · Ouverture des demandes',
    title:'Une nouvelle façon d’explorer l’art et l’intelligence.',
    lead:'La Maison xArtists présente ses créations, ses expériences et ses trois packs IA. Découvrez le catalogue et demandez une présentation. Les achats publics et la livraison des NFT Genesis ne sont pas encore ouverts.',
    signal:'Catalogue public · aucune commande ni paiement accepté sur cette page',
    badge:'Tarif catalogue indicatif · achat unique prévu',
    intro:'Les trois packs Genesis',
    detail:'Découvrir le pack',
    enquiry:'Demande publique de présentation',
    descriptions:{
      pulse:'Tableaux de bord, signaux et outils de pilotage IA à découvrir en mode démonstration. Aucun gain financier promis.',
      yield:'Découverte d’outils d’observation DeFi et d’analyse, sans placement ni rendement garanti.',
      sentinel:'Veille, alertes et garde-fous pour explorer les risques et les signaux.',
    },
    delivery:'Édition limitée prévue, sous réserve de la validation des smart contracts, du paiement et de la livraison. Afficher un prix ne crée pas un droit à livraison.',
    how:'Comment rejoindre le lancement ?',
    step1:'Explorez le musée et les packs. Les démonstrations sont sans achat.',
    step2:'Déposez une demande de présentation dans un ticket GitHub public (compte GitHub requis). Ne communiquez aucune adresse email, téléphone, clé, adresse de portefeuille ou information confidentielle.',
    step3:'Une offre ferme, ses conditions, le paiement et la livraison ne seront disponibles qu’après vérification et annonce officielle.',
    contact:'Demande publique sur GitHub',
    social:'Actualités xArtists sur X',
    publicNote:'Le ticket GitHub est visible par tous. Aucune donnée personnelle, clé privée ou commande ne doit y être publiée.',
    artist:'Vous êtes artiste ? Découvrir le Studio',
    museum:'Visiter le Musée',
    whop:'Abonnements Whop : offre distincte',
    whopCopy:'Les éventuels abonnements TCA/Whop sont des services mensuels indépendants des packs Genesis. Aucun abonnement Whop ni NFT n’est inclus dans une demande de présentation.',
    trust:'Transparence avant toute vente',
    trustCopy:'Les NFT ne prouvent pas automatiquement la propriété d’une œuvre physique. Les évaluations IA et les scores de similarité ne sont pas des certificats. Le trading LIA reste en mode paper et aucun rendement n’est garanti.',
    status:'Contact public via GitHub uniquement tant que la messagerie du domaine n’est pas vérifiée. Paiements publics, revendication NFT sur mainnet, enchères et ventes physiques : non activés.',
    docs:'Conditions et état des fonctionnalités',
  },
  en: {
    kicker:'xArtists · Enquiries now open',
    title:'A new way to explore art and intelligence.',
    lead:'The xArtists House showcases its creations, experiences and three AI packs. Explore the catalog and request an introduction. Public purchases and Genesis NFT delivery are not yet available.',
    signal:'Public catalog · no orders or payments are accepted on this page',
    badge:'Indicative catalog price · planned one-time purchase',
    intro:'The three Genesis packs',
    detail:'Explore the pack',
    enquiry:'Public introduction request',
    descriptions:{
      pulse:'Explore AI dashboards, signals and tools in demonstration mode. No financial returns are promised.',
      yield:'Discover DeFi observation and analysis tools, not an investment or guaranteed yield.',
      sentinel:'Monitoring, alerts and safeguards for exploring risks and signals.',
    },
    delivery:'A limited edition is planned, subject to validation of the smart contracts, payment and delivery. A displayed price creates no delivery entitlement.',
    how:'How to join the launch',
    step1:'Explore the museum and packs. Demonstrations do not require a purchase.',
    step2:'Use the public GitHub issue form to request an introduction or propose a partnership (GitHub login required). Do not share email, phone, wallet details, private keys or confidential information.',
    step3:'A binding offer, its terms, payment and delivery will be made available only after verification and an official announcement.',
    contact:'Public enquiry on GitHub',
    social:'xArtists updates on X',
    publicNote:'GitHub issues are visible to everyone. Never post personal data, private keys or a payment order.',
    artist:'Are you an artist? Discover the Studio',
    museum:'Visit the Museum',
    whop:'Whop subscriptions are separate',
    whopCopy:'Any TCA/Whop subscription is a separate monthly service, not a Genesis pack. Requesting an introduction does not include any Whop membership or NFT.',
    trust:'Transparency before any sale',
    trustCopy:'An NFT does not automatically confer legal title to physical art. AI assessments and visual similarity scores are not authenticity certificates. LIA trading remains in paper mode. No financial return is guaranteed.',
    status:'Public contact via GitHub only until the domain email is verified. Public payments, mainnet NFT claims, auctions and physical-art purchases remain disabled.',
    docs:'Terms and feature availability',
  },
} as const

// Dedicated public, non-binding issue form; no PII or payment capture.
const PUBLIC_INTAKE_URL = 'https://github.com/Neltud/xArtists/issues/new?template=commercial-introduction.yml'
const PUBLIC_SOCIAL_URL = 'https://x.com/tudurioriginal'

export default function CommercialLaunchPage() {
  const { lang } = useI18n()
  const c = lang === 'fr' ? COPY.fr : COPY.en

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-24 pt-8 text-zinc-100 sm:px-7 sm:pt-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-100/20 bg-gradient-to-br from-[#201c17] via-[#131820] to-[#080b10] px-6 py-10 sm:px-12 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rounded-full bg-amber-100/[0.05] blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">{c.kicker}</p>
        <h1 className="relative mt-6 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-6xl">{c.title}</h1>
        <p className="relative mt-6 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">{c.lead}</p>
        <p role="status" className="relative mt-6 max-w-2xl rounded-xl border border-amber-200/25 bg-amber-100/[0.06] px-4 py-3 text-sm text-amber-100">{c.signal}</p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <a href={PUBLIC_INTAKE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-full bg-amber-100 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-white">{c.contact}</a>
          <a href={PUBLIC_SOCIAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-full border border-amber-100/40 px-6 py-3 text-sm text-amber-100 hover:bg-amber-100/10">{c.social}</a>
          <Link to="/museum" className="inline-flex min-h-[44px] items-center rounded-full border border-white/25 px-6 py-3 text-sm text-white hover:bg-white/10">{c.museum}</Link>
        </div>
        <p className="relative mt-4 max-w-2xl text-xs leading-5 text-amber-200/85">{c.publicNote}</p>
      </section>

      <section aria-labelledby="commercial-packs">
        <h2 id="commercial-packs" className="font-serif text-3xl text-white">{c.intro}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PACKS.map(pack => (
            <article key={pack.id} className={'rounded-3xl border border-white/10 bg-gradient-to-b ' + pack.theme + ' to-[#0c1015] p-6'}>
              <span aria-hidden="true" className="text-3xl text-amber-100">{pack.motif}</span>
              <h3 className="mt-4 font-serif text-3xl capitalize text-white">{pack.id}</h3>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{pack.price} €</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">{c.badge}</p>
              <p className="mt-5 min-h-24 text-sm leading-6 text-zinc-300">{c.descriptions[pack.id]}</p>
              <p className="mt-3 text-xs leading-5 text-zinc-400">{c.delivery}</p>
              <div className="mt-5 flex flex-col gap-2">
                <Link to={'/packs/' + pack.id} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10">{c.detail}</Link>
                <a href={PUBLIC_INTAKE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white">{c.enquiry}</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="club-news" className="rounded-3xl border border-amber-100/25 bg-[#171a20] p-6 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">xArtists Club + News</p>
        <h2 id="club-news" className="mt-3 font-serif text-3xl text-white">10 € / {lang === 'fr' ? 'mois' : 'month'}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{lang === 'fr'
          ? 'Abonnement numérique hors blockchain, sans NFT. Accès pendant chaque période mensuelle effectivement payée : xArtists TV News, actualités du monde de l’art, magazine et critiques, événements NFT et rencontres, curateurs et veille des ventes et enchères avec liens vers Artprice.'
          : 'Off-chain digital subscription, without an NFT. Access for each successfully paid monthly period: xArtists TV News, art world news, magazine reviews, NFT events and meetings, curators, and art sales and auctions coverage linking to Artprice.'}</p>
        <p role="status" className="mt-4 text-sm font-semibold text-amber-200">{lang === 'fr'
          ? 'Offre annoncée, souscription indisponible : aucun paiement ni droit d’accès activé sur cette page.'
          : 'Offer preview only: subscription checkout is unavailable and no payment or access is activated on this page.'}</p>
        <p className="mt-2 text-xs leading-6 text-zinc-400">{lang === 'fr'
          ? 'Distinct des packs NFT Genesis et de TCA/Whop. Aucun NFT, mint, wallet ou transaction on-chain. Les conditions de renouvellement, d’annulation et de fourniture seront publiées avant ouverture.'
          : 'Separate from Genesis NFT packs and TCA/Whop. No NFT, mint, wallet or on-chain transaction. Renewal, cancellation and delivery terms will be published before launch.'}</p>
      </section>

      <section aria-labelledby="commercial-how" className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-9">
        <h2 id="commercial-how" className="font-serif text-2xl text-white">{c.how}</h2>
        <ol className="mt-5 grid gap-5 text-sm leading-7 text-zinc-300 md:grid-cols-3">
          {[c.step1, c.step2, c.step3].map((step, i) => (
            <li key={step}><span className="mr-2 font-semibold text-amber-200">0{i+1}.</span>{step}</li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-5 text-sm">
          <Link to="/studio" className="text-amber-100 underline underline-offset-4">{c.artist}</Link>
          <Link to="/museum" className="text-amber-100 underline underline-offset-4">{c.museum}</Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="font-serif text-xl text-white">{c.whop}</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">{c.whopCopy}</p>
        </div>
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="font-serif text-xl text-white">{c.trust}</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">{c.trustCopy}</p>
        </div>
      </section>
      <p className="text-sm leading-7 text-amber-100">{c.status}</p>
      <a href="https://xartists.gitbook.io/xartists/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-sm text-zinc-300 underline underline-offset-4">{c.docs}</a>
    </main>
  )
}
