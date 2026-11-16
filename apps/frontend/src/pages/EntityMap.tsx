import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

/** Public entry points only. Historical operations and compliance reviews belong in private documentation. */
export default function EntityMap() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const entries = [
    { to: '/explore/museum', icon: '🏛️', title: fr ? 'Musée' : 'Museum',
      description: fr ? 'Découvrir les œuvres et les expositions.' : 'Discover artworks and exhibitions.' },
    { to: '/create/studio', icon: '🎨', title: fr ? 'Créer une œuvre' : 'Create an artwork',
      description: fr ? 'Importer une image, une vidéo ou une musique.' : 'Upload an image, video or music file.' },
    { to: '/create/gallery', icon: '🖼️', title: fr ? 'Ma galerie 3D' : 'My 3D gallery',
      description: fr ? 'Préparer une exposition personnalisée.' : 'Prepare a personalized exhibition.' },
    { to: '/explore/market', icon: '✦', title: fr ? 'Marketplace' : 'Marketplace',
      description: fr ? 'Explorer les œuvres et leurs informations.' : 'Explore artworks and their details.' },
    { to: '/intelligence/xorus', icon: '◈', title: 'xOrus',
      description: fr ? 'Consulter les analyses et signaux disponibles.' : 'Read available analysis and signals.' },
    { to: '/workspace/account', icon: '👤', title: fr ? 'Mon compte' : 'My account',
      description: fr ? 'Accéder à mon espace personnel.' : 'Access your personal space.' },
  ]
  return (
    <main className="animate-fade-in mx-auto max-w-5xl space-y-7 px-4 pb-24 pt-6 sm:px-7" data-testid="public-ecosystem">
      <header className="space-y-2">
        <p className="section-label">xArtists</p>
        <h1 className="section-title display text-2xl">{fr ? 'Découvrir xArtists' : 'Discover xArtists'}</h1>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--xa-text-secondary)]">
          {fr ? 'L’art, les galeries et les outils de création au même endroit. Choisissez ce que vous voulez faire.'
            : 'Art, galleries and creative tools in one place. Choose what you want to do.'}
        </p>
      </header>
      <nav aria-label={fr ? 'Explorer xArtists' : 'Explore xArtists'} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(entry => (
          <Link key={entry.to} to={entry.to}
            className="card flex min-h-[134px] flex-col gap-2 rounded-2xl border border-[color:var(--xa-border)] p-5 transition-colors hover:border-emerald-500/40">
            <span aria-hidden="true" className="text-2xl">{entry.icon}</span>
            <span className="text-base font-semibold text-[color:var(--xa-text)]">{entry.title}</span>
            <span className="text-sm text-[color:var(--xa-text-secondary)]">{entry.description}</span>
          </Link>
        ))}
      </nav>
      <p className="text-xs leading-6 text-[color:var(--xa-text-secondary)]">
        {fr ? 'La consultation et la préparation ne valent ni publication NFT, ni offre de vente. Les actions nécessitant une signature sont confirmées séparément.'
          : 'Browsing and preparation do not mint NFTs or list items for sale. Actions requiring a signature are confirmed separately.'}
      </p>
    </main>
  )
}
