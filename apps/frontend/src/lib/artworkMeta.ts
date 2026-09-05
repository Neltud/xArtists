/** Enrichissement métadonnées œuvres (public domain / NFT). */
import type { FrameItem } from '../components/museum/MuseumCorridor'

const TECHNIQUES = [
  'Huile sur toile',
  'Tempera sur bois',
  'Huile sur panneau',
  'Fresque (transfert)',
  'Encre et lavis',
  'Pastel',
]

export function enrichPublicDomainFrame(
  base: FrameItem,
  opts?: { artist?: string; year?: string }
): FrameItem {
  const artist = opts?.artist || base.artist || base.subtitle?.split('·')[0]?.trim()
  const date = opts?.year || base.date || base.subtitle?.split('·')[1]?.trim()
  const seed = base.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return {
    ...base,
    artist,
    date,
    technique: base.technique || TECHNIQUES[seed % TECHNIQUES.length],
    medium: base.medium || 'physical',
    kind: base.kind || 'painting',
    dimensions: base.dimensions || `${70 + (seed % 80)} × ${90 + (seed % 60)} cm (env.)`,
    onSale: false,
    priceLabel: 'Collection musée — non à vendre',
    license: base.license || 'Met Open Access / domaine public',
    provenance: base.provenance || base.collection,
  }
}

export function enrichNftFrame(base: FrameItem): FrameItem {
  return {
    ...base,
    artist: base.artist || 'Créateur on-chain',
    medium: 'digital',
    kind: 'nft',
    technique: base.technique || 'NFT · MultiversX',
    dimensions: base.dimensions || 'Résolution native média',
    onSale: base.onSale ?? true,
    priceLabel: base.priceLabel || (base.onSale === false ? 'Pas en vente' : 'Sur demande / paper'),
    license: 'Propriété tokenisée',
  }
}

/** Sculptures procédurales placées au centre de salle */
export function sculptureCatalog(museumId: string): FrameItem[] {
  const items: FrameItem[] = [
    {
      id: `sculp-${museumId}-1`,
      title: 'Figure debout (étude)',
      artist: 'Atelier xArtists',
      date: '2026',
      technique: 'Forme 3D procédurale',
      medium: 'digital',
      kind: 'sculpture',
      dimensions: 'h. ~1,8 m (échelle salle)',
      onSale: false,
      priceLabel: 'Installation — non à vendre',
      collection: museumId,
      description: 'Sculpture virtuelle au centre de la salle — interaction E / Inspecter.',
      license: 'Démo xArtists',
    },
    {
      id: `sculp-${museumId}-2`,
      title: 'Buste contemplatif',
      artist: 'Atelier xArtists',
      date: '2026',
      technique: 'Mesh 3D',
      medium: 'digital',
      kind: 'sculpture',
      dimensions: 'h. ~1,2 m',
      onSale: true,
      priceEur: 120,
      priceLabel: '120 € · intention paper',
      collection: museumId,
      description: 'Édition numérique — intention d’achat paper tant que SC non live.',
      license: 'Démo',
    },
  ]
  return items
}
