import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { TUDURI_WORKS, ATELIER_EXPLORER } from '../config/tuduriAtelier'

const copy = {
  fr: {
    eyebrow: 'Maison xArtists · Art × Intelligence',
    title: 'L’œuvre d’abord. La preuve ensuite.',
    lead: 'Une maison numérique pour explorer l’art, accueillir les créateurs et raconter la provenance sans confondre certificat, propriété physique et droit numérique.',
    explore: 'Entrer dans le musée',
    auction: 'Découvrir les enchères',
    studio: 'Créer au Studio',
    offers: 'Découvrir les offres · demander une présentation',
    chapters: 'Les espaces de la Maison',
    museum: 'Le musée',
    museumDesc: 'Une expérience pour voir les œuvres, leur histoire et leurs collections, sans portefeuille obligatoire.',
    sales: 'La salle des enchères',
    salesDesc: 'Un salon de présentation en préparation. Aucune enchère réelle ni adjudication n’est ouverte.',
    provenance: 'Provenance et œuvres physiques',
    provenanceDesc: 'Documenter condition, titulaire, livraison et acceptation. Un NFT ne vaut pas automatiquement titre de propriété.',
    creation: 'L’atelier',
    creationDesc: 'Un parcours créateur du média à sa fiche, avec signature et publication uniquement lorsque les étapes sont vérifiées.',
    artwork: 'Œuvre à découvrir',
    artworkNote: 'Exemple éditorial issu du catalogue Atelier Tuduri. Cette présence n’est ni une vente, ni une annonce d’enchère, ni une preuve de garde.',
    provenanceLink: 'Voir la collection sur MultiversX',
    trust: 'La confiance se construit étape par étape',
    trustCopy: 'Paiement constaté ≠ NFT livré. Métadonnées ≠ garantie juridique de propriété. Signaux IA ≠ rendement financier.',
    packs: 'Explorer Pulse, Yield et Sentinel',
    packsNote: 'Packs à achat unique, distincts des abonnements TCA. Paiement public et claim NFT toujours soumis à un GO indépendant.',
    manifesto: 'Lire notre manifeste',
    status: 'Exploration publique ouverte · commerce NFT et enchères réelles non activés',
  },
  en: {
    eyebrow: 'Maison xArtists · Art × Intelligence',
    title: 'Art first. Evidence next.',
    lead: 'A digital house to experience art, welcome creators and tell the story of provenance without confusing certificates, physical ownership and digital rights.',
    explore: 'Enter the museum',
    auction: 'Explore auctions',
    studio: 'Create in the Studio',
    offers: 'Explore offers · request an introduction',
    chapters: 'Inside the House',
    museum: 'The museum',
    museumDesc: 'Explore works, stories and collections without needing a wallet to visit.',
    sales: 'The auction room',
    salesDesc: 'A presentation room in development. No real bids, awards or settlements are open.',
    provenance: 'Provenance and physical art',
    provenanceDesc: 'Record condition, ownership, shipping and acceptance. An NFT is not automatically legal title.',
    creation: 'The studio',
    creationDesc: 'A journey from media to artwork profile, with signatures and publication only when each gate is verified.',
    artwork: 'An artwork to explore',
    artworkNote: 'Editorial example from the Tuduri Atelier catalogue. Showing it is not an offer for sale, an auction listing or proof of custody.',
    provenanceLink: 'View the collection on MultiversX',
    trust: 'Trust is earned step by step',
    trustCopy: 'Payment confirmed ≠ NFT delivered. Metadata ≠ legal property title. AI signals ≠ financial returns.',
    packs: 'Explore Pulse, Yield and Sentinel',
    packsNote: 'One-time purchase packs, distinct from TCA subscriptions. Public checkout and NFT claims still require independent approval.',
    manifesto: 'Read our manifesto',
    status: 'Public exploration available · live NFT sales and real auctions not enabled',
  },
} as const

export default function HousePage() {
  const { lang } = useI18n()
  const t = lang === 'fr' ? copy.fr : copy.en
  const feature = TUDURI_WORKS[0]
  const sections = [
    { id: 'museum', n: '01', title: t.museum, desc: t.museumDesc, to: '/museum', icon: '◈' },
    { id: 'auction', n: '02', title: t.sales, desc: t.salesDesc, to: '/auction', icon: '◇' },
    { id: 'rwa', n: '03', title: t.provenance, desc: t.provenanceDesc, to: '/rwa', icon: '▣' },
    { id: 'studio', n: '04', title: t.creation, desc: t.creationDesc, to: '/studio', icon: '✳' },
  ]
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 text-left text-zinc-100 sm:px-7 sm:pt-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/20 bg-gradient-to-br from-[#191715] via-[#11151a] to-[#07090d] p-6 sm:p-12">
        <div className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full border border-amber-200/10 sm:h-96 sm:w-96" aria-hidden="true" />
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">{t.eyebrow}</p>
        <h1 className="relative mt-8 max-w-3xl font-serif text-4xl font-normal leading-tight tracking-tight sm:text-6xl">{t.title}</h1>
        <p className="relative mt-6 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">{t.lead}</p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-[44px] items-center rounded-full bg-amber-100 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300" to="/museum">{t.explore}</Link>
          <Link className="inline-flex min-h-[44px] items-center rounded-full border border-white/30 px-6 py-3 text-sm text-white hover:bg-white/10" to="/auction">{t.auction}</Link>
          <Link className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-6 py-3 text-sm text-white hover:bg-white/10" to="/studio">{t.studio}</Link>
          <Link className="inline-flex min-h-[44px] items-center rounded-full border border-amber-100/40 bg-amber-100/10 px-6 py-3 text-sm text-amber-100 hover:bg-amber-100/20" to="/offres">{t.offers}</Link>
        </div>
      </section>

      <section className="mt-10 sm:mt-16" aria-labelledby="house-chapters">
        <h2 id="house-chapters" className="font-serif text-2xl text-amber-50 sm:text-3xl">{t.chapters}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sections.map(item => (
            <Link key={item.id} to={item.to} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-amber-200/40 hover:bg-white/[0.065] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
              <span className="flex items-center justify-between text-xs text-amber-200/70"><span>{item.n} / xArtists</span><span aria-hidden="true" className="text-2xl">{item.icon}</span></span>
              <h3 className="mt-7 font-serif text-2xl text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{item.desc}</p>
              <span className="mt-5 block text-xs font-semibold text-amber-100" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid overflow-hidden rounded-3xl border border-white/10 bg-[#141312] md:grid-cols-2" aria-labelledby="house-artwork">
        <div className="min-h-[260px] bg-[#22201e]">
          <img src={feature.url} alt={feature.name} loading="lazy" className="h-full max-h-[480px] w-full object-contain" />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/75">Atelier Tuduri · NFTUDURI</p>
          <h2 id="house-artwork" className="mt-4 font-serif text-3xl text-white">{t.artwork}</h2>
          <h3 className="mt-4 text-xl text-amber-50">{feature.name} · {feature.year}</h3>
          <p className="mt-3 text-xs leading-6 text-zinc-400">{feature.id}</p>
          <p className="mt-5 text-sm leading-7 text-zinc-300">{t.artworkNote}</p>
          <a className="mt-6 inline-flex min-h-[44px] items-center text-sm font-semibold text-amber-200 underline underline-offset-4" href={ATELIER_EXPLORER} target="_blank" rel="noopener noreferrer">{t.provenanceLink} ↗</a>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 p-7 sm:p-10" aria-labelledby="house-trust">
        <h2 id="house-trust" className="font-serif text-2xl text-white">{t.trust}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">{t.trustCopy}</p>
        <p className="mt-5 text-sm text-amber-100">{t.status}</p>
        <div className="mt-7 flex flex-wrap gap-4 text-sm">
          <Link to="/agents" className="underline underline-offset-4">{t.packs}</Link>
          <a href="https://xartists.gitbook.io/xartists/presentation/maison-manifeste" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{t.manifesto} ↗</a>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-6 text-zinc-400">{t.packsNote}</p>
      </section>
    </div>
  )
}
