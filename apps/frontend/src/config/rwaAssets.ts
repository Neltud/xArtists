/**
 * Actifs RWA / phygital dans xArtists — taxonomie produit.
 * Escrow on-chain = P2 (rwa_escrow_bridge null) ; metadata + Studio dès maintenant.
 */

export type RwaClass =
  | 'physical_art'
  | 'edition_print'
  | 'collectible'
  | 'media_pin'
  | 'certificate'

export type RwaAssetType = {
  id: RwaClass
  label: string
  description: string
  /** Peut déclencher reward 1 TRO max (œuvre réelle) */
  troRewardEligible: boolean
  /** Nécessite attestation / escrow pour claim « delivery » */
  needsEscrow: boolean
  studioFlow: string
}

export const RWA_ASSET_TYPES: RwaAssetType[] = [
  {
    id: 'physical_art',
    label: 'Œuvre physique',
    description: 'Peinture, sculpture, objet — jeton = titre + promesse de détention / livraison.',
    troRewardEligible: true,
    needsEscrow: true,
    studioFlow: 'Studio → metadata physical:true → pin IPFS → mint → list Market',
  },
  {
    id: 'edition_print',
    label: 'Édition limitée',
    description: 'Tirage numéroté lié à un master ; supply bornée on-chain.',
    troRewardEligible: true,
    needsEscrow: true,
    studioFlow: 'Collection + max supply → mint editions',
  },
  {
    id: 'collectible',
    label: 'Collectible phygital',
    description: 'Objet + NFC/QR optionnel ; burn/redeem policy documentée.',
    troRewardEligible: true,
    needsEscrow: true,
    studioFlow: 'Metadata attributes + redeem_url',
  },
  {
    id: 'media_pin',
    label: 'Média permanent (IPFS/Arweave)',
    description: 'Vidéo/audio pinné — pas RWA physique ; pas de reward TRO « physique ».',
    troRewardEligible: false,
    needsEscrow: false,
    studioFlow: 'Pinata pin → CID dans metadata',
  },
  {
    id: 'certificate',
    label: 'Certificat / provenance',
    description: 'Attestation d’authenticité ; peut pointer vers escrow ou entrepôt partenaire.',
    troRewardEligible: false,
    needsEscrow: false,
    studioFlow: 'Lien attestation + hash document',
  },
]

export const RWA_USER_JOURNEY = [
  'Artiste : Studio marque l’actif (physical / edition / media)',
  'Pin IPFS (Pinata) — CID immutable dans metadata',
  'Mint NFT (minter SC / mxpy) — collection xArtists',
  'List Market — fee + royalty ; flag isPhysical visible',
  'Acheteur : Buy → ownership on-chain',
  'Si physique : escrow / shipping off-chain + status metadata (P2 SC)',
  'Reward 1 TRO max : uniquement œuvre réelle, trigger vente (anti-spam)',
] as const
