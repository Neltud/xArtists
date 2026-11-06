import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

/**
 * Curated xArtists artworks provided by the owner via private Google Drive.
 * Public exhibition media ONLY: never infer sale/listing/mint/ownership from these files.
 */
export const DRIVE_EXHIBITION = [
  { id: 'xArtists0279', file: 'xArtists0279.png', alt: 'Œuvre xArtists 0279 — composition rouge et noire, personnage géométrique, blanc et or' },
  { id: 'xArtists0269', file: 'xArtists0269.png', alt: 'Œuvre xArtists 0269 — visage abstrait, traits blancs et dorés sur fond rouge sombre' },
  { id: 'xArtists0291', file: 'xArtists0291.png', alt: 'Œuvre xArtists 0291 — portrait pixel-art monochrome aux reflets jaunes' },
  { id: 'xArtists0286', file: 'xArtists0286.png', alt: 'Œuvre xArtists 0286 — portrait graphique sur fond rouge profond' },
] as const

const srcFor = (file: string) => new URL('art/drive/' + file, new URL(import.meta.env.BASE_URL, window.location.origin)).href

export default function DriveArtShowcase({ compact = false }: { compact?: boolean }) {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  return (
    <section className={'xa-drive-exhibition ' + (compact ? 'is-compact' : '')}
      aria-labelledby={compact ? 'xa-drive-museum-title' : 'xa-drive-home-title'}>
      <div className="xa-drive-exhibition-head">
        <div>
          <p className="xa-eyebrow">{fr ? 'Collection xArtists · Œuvres originales' : 'xArtists collection · Original artworks'}</p>
          <h2 id={compact ? 'xa-drive-museum-title' : 'xa-drive-home-title'}>
            {fr ? 'L’art au cœur de l’expérience' : 'Art at the heart of the experience'}
          </h2>
          <p>{fr
            ? 'Sélection d’œuvres issues de l’atelier xArtists. Présentation artistique uniquement, sans offre de vente ou mint implicite.'
            : 'Selected works from the xArtists studio. Artistic exhibition only; no implied listing, sale or mint.'}</p>
        </div>
        {!compact && <Link to="/museum" className="xa-drive-exhibition-link">
          {fr ? 'Explorer le musée' : 'Explore the museum'} <span aria-hidden="true">↗</span>
        </Link>}
      </div>
      <div className="xa-drive-exhibition-works" role="list" aria-label={fr ? 'Œuvres sélectionnées' : 'Selected artworks'}>
        {DRIVE_EXHIBITION.map((work, i) =>
          <figure className="xa-drive-exhibition-work" role="listitem" key={work.id} style={{ '--xa-art-index': i } as React.CSSProperties}>
            <img src={srcFor(work.file)} alt={work.alt} decoding="async" loading={compact ? 'lazy' : i === 0 ? 'eager' : 'lazy'} />
            <figcaption><span>xArtists</span><strong>{work.id.slice(-4)}</strong></figcaption>
          </figure>)}
      </div>
    </section>
  )
}
