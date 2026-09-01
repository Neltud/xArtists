/** Soft launch — surface produit grand public. */

export const DEMO_MODE = true

export const DEMO_LABEL = 'DÉMO'

export const DEMO_BULLETS = [
  'Démonstration : exploration libre, wallet en lecture, packs en mode paper.',
  'Galerie 3D unifiée (lieux + votre collection).',
  'Packs Pulse · Yield · Sentinel — pas un fonds, pas de rendement promis.',
  'Art Tours = culture, hors packs agents.',
  'Paiements carte : Stripe / Paybox quand configurés côté serveur.',
] as const

export const SOFT_LAUNCH_PATH = [
  { to: '/', label: 'Accueil', emoji: '⌂' },
  { to: '/museum', label: 'Galerie', emoji: '🖼' },
  { to: '/agents', label: 'Packs', emoji: '✦' },
  { to: '/wallet', label: 'Wallet', emoji: '◇' },
  { to: '/tours', label: 'Tours', emoji: '🗺' },
] as const
