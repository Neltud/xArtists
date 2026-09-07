/** Soft launch — surface produit grand public. */

export const DEMO_MODE = true

export const DEMO_LABEL = 'DÉMO'

export const DEMO_BULLETS = [
  'Exploration libre · wallet en lecture · packs en mode paper.',
  'Galerie 3D + collection · tours culture séparés des packs.',
  '3 packs seulement : Pulse · Yield · Sentinel — pas un fonds.',
  'Trading LIA = board paper. Aucun mouvement de fonds auto.',
] as const

/** Parcours démo recommandé (ordre). */
export const DEMO_PATH = [
  { to: '/museum', label: 'Galerie', hint: 'Visite 3D' },
  { to: '/agents', label: 'Packs', hint: '3 accès IA' },
  { to: '/tours', label: 'Tours', hint: 'Carte art' },
  { to: '/wallet', label: 'Wallet', hint: 'Connecter' },
] as const

export const SOFT_LAUNCH_PATH = [
  { to: '/', label: 'Accueil', emoji: '⌂' },
  { to: '/museum', label: 'Galerie', emoji: '🖼' },
  { to: '/agents', label: 'Packs', emoji: '✦' },
  { to: '/wallet', label: 'Wallet', emoji: '◇' },
  { to: '/tours', label: 'Tours', emoji: '🗺' },
] as const
