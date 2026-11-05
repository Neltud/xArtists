import { useState } from 'react'

/** Off-chain visual preview only. imageUrl must be a trusted, access-controlled media URL.
 * Never pass a raw Google Drive share URL or claim this component mints NFTs.
 */
export type ArtCard3DPreviewProps = {
  imageUrl: string
  title: string
  edition: number
  total?: number
  artist?: string
}

export default function ArtCard3DPreview({
  imageUrl, title, edition, total = 291, artist = 'xArtists',
}: ArtCard3DPreviewProps) {
  const [flipped, setFlipped] = useState(false)
  const editionLabel = String(edition).padStart(4, '0')
  return (
    <section aria-label={`Aperçu 3D de ${title}`} className="mx-auto w-full max-w-sm">
      <div className="relative mx-auto aspect-[3/4] w-full" style={{ perspective: '1100px' }}>
        <div className="relative h-full w-full rounded-3xl transition-transform duration-700 motion-reduce:transition-none"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(-9deg) rotateX(4deg)' }}>
          <div className="absolute inset-0 overflow-hidden rounded-3xl border-4 border-amber-300/70 bg-zinc-950 shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}>
            <img src={imageUrl} alt={title} className="h-full w-full object-contain" loading="lazy"
              referrerPolicy="no-referrer" />
            <div className="absolute bottom-0 w-full bg-black/75 p-3 text-sm text-white">
              {title} · #{editionLabel}/{total}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-4 border-amber-300/70 bg-zinc-900 p-7 text-center text-amber-100"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-xs uppercase tracking-widest">xArtists · 3D Card Preview</p>
            <h3 className="mt-5 font-serif text-2xl">{title}</h3>
            <p className="mt-3 text-sm">{artist}</p>
            <p className="mt-6 text-lg">#{editionLabel} / {total}</p>
            <p className="mt-8 text-xs">Aperçu hors chaîne · non minté · sans certificat de propriété</p>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => setFlipped(v => !v)}
        className="mt-5 min-h-11 w-full rounded-xl border border-amber-100/40 px-4 py-2 text-amber-100 hover:bg-amber-100/10"
        aria-label={flipped ? 'Voir le recto de la carte' : 'Voir le verso de la carte'}>
        {flipped ? 'Voir le recto' : 'Voir le verso'}
      </button>
    </section>
  )
}
