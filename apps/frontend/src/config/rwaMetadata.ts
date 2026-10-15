/**
 * Certificats de provenance RWA / phygital — modèle métadonnées.
 * Dimensions, médium, Chip ID NFC, certificat on-chain.
 * Complète rwaAssets.ts (taxonomie) avec le schéma machine-readable.
 */

export type RwaMedium =
  | 'oil'
  | 'acrylic'
  | 'mixed_media'
  | 'sculpture'
  | 'print'
  | 'digital_physical'
  | 'other'

export type RwaDimensions = {
  widthCm: number
  heightCm: number
  depthCm?: number
  unit?: 'cm' | 'mm'
}

export type RwaNfcChip = {
  /** Identifiant unique du chip NFC embarqué */
  chipId: string
  /** URI de vérification (HTTPS ou deep-link app) */
  verifyUrl?: string
  /** Hash du payload signé (optionnel) */
  payloadHash?: string
}

export type RwaOnChainCertificate = {
  /** Identifier NFT MultiversX (collection-nonce) */
  nftIdentifier: string
  collection: string
  nonce: number
  /** TX de mint ou d’attestation */
  attestationTx?: string
  /** CID IPFS du PDF / JSON de certificat */
  documentCid?: string
  issuedAt?: string
  issuer?: string
}

export type RwaProvenanceRecord = {
  id: string
  title: string
  artist: string
  year?: number | string
  medium: RwaMedium
  dimensions: RwaDimensions
  /** Description courte (provenance / lieu) */
  provenanceNote?: string
  nfc?: RwaNfcChip
  certificate: RwaOnChainCertificate
  /** Lien vers escrow / entrepôt partenaire (P2) */
  escrowRef?: string
  imageCid?: string
  attributes?: { trait_type: string; value: string | number }[]
}

/** Exemple de record lié à un pack / œuvre physique (template Studio) */
export const RWA_PROVENANCE_TEMPLATE: Omit<RwaProvenanceRecord, 'id' | 'certificate'> = {
  title: '',
  artist: 'NT',
  year: new Date().getFullYear(),
  medium: 'mixed_media',
  dimensions: { widthCm: 0, heightCm: 0, unit: 'cm' },
  provenanceNote: 'Certificat on-chain xArtists — pas un titre de propriété réglementé.',
}

export function buildRwaMetadataJson(rec: RwaProvenanceRecord): Record<string, unknown> {
  return {
    name: rec.title,
    description: rec.provenanceNote || `RWA provenance — ${rec.artist}`,
    image: rec.imageCid ? `ipfs://${rec.imageCid}` : undefined,
    attributes: [
      { trait_type: 'Artist', value: rec.artist },
      { trait_type: 'Medium', value: rec.medium },
      { trait_type: 'Width_cm', value: rec.dimensions.widthCm },
      { trait_type: 'Height_cm', value: rec.dimensions.heightCm },
      ...(rec.dimensions.depthCm != null
        ? [{ trait_type: 'Depth_cm', value: rec.dimensions.depthCm }]
        : []),
      ...(rec.nfc ? [{ trait_type: 'NFC_Chip_ID', value: rec.nfc.chipId }] : []),
      { trait_type: 'Certificate_NFT', value: rec.certificate.nftIdentifier },
      ...(rec.attributes || []),
    ],
    rwa: {
      class: 'physical_art',
      nfc: rec.nfc || null,
      certificate: rec.certificate,
      escrowRef: rec.escrowRef || null,
    },
  }
}

export function validateProvenance(rec: Partial<RwaProvenanceRecord>): string[] {
  const err: string[] = []
  if (!rec.title?.trim()) err.push('title required')
  if (!rec.artist?.trim()) err.push('artist required')
  if (!rec.medium) err.push('medium required')
  if (!rec.dimensions || !(rec.dimensions.widthCm > 0) || !(rec.dimensions.heightCm > 0)) {
    err.push('dimensions width/height > 0 required')
  }
  if (!rec.certificate?.nftIdentifier) err.push('certificate.nftIdentifier required')
  return err
}
