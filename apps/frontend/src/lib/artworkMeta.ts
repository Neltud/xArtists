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

function safeId(base: FrameItem | { id?: string }): string {
  return (base?.id && String(base.id)) || 'frame-unknown'
}

export function enrichPublicDomainFrame(
  base: FrameItem,
  opts?: { artist?: string; year?: string },
): FrameItem {
  if (!base) {
    return {
      id: 'frame-empty',
      title: 'Œuvre',
      onSale: false,
    }
  }
  const id = safeId(base)
  const artist = opts?.artist || base.artist || base.subtitle?.split('·')[0]?.trim()
  const date = opts?.year || base.date || base.subtitle?.split('·')[1]?.trim()
  const seed = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return {
    ...base,
    id,
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
  if (!base) {
    return {
      id: 'nft-empty',
      title: 'NFT',
      medium: 'digital',
      kind: 'nft',
      onSale: false,
    }
  }
  const id = safeId(base)
  return {
    ...base,
    id,
    artist: base.artist || 'Créateur on-chain',
    medium: 'digital',
    kind: 'nft',
    technique: base.technique || 'NFT · MultiversX',
    dimensions: base.dimensions || 'Résolution native média',
    onSale: base.onSale ?? true,
    priceLabel:
      base.priceLabel ||
      (base.onSale === false ? 'Pas en vente' : base.priceLabel || 'Prix on-chain'),
  }
}
