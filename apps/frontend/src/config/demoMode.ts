/** Soft launch — honest product surface until SC verify + optional micro-live. */

export const DEMO_MODE = true

/** Soft launch public banner */
export const DEMO_LABEL = 'SOFT LAUNCH · PAPER'

export const DEMO_BULLETS = [
  'Soft launch paper : board LIA / compounding = JSON Vellum — pas ton compte.',
  'Lectures MultiversX live (prix, soldes, NFTs) quand l’API répond.',
  'Marketplace & mint agents : bloqués tant que codeHash null (fail-closed).',
  'Packs actifs : Pulse · Yield · Sentinel uniquement.',
  'Art Tours = service CULTURE (pas un pack agent).',
  'Musée : catalogue réel + Mydee wallet · achat = intention paper / Guardian.',
  'Trading LIA live OFF (LIA_LIVE_TRADING=0) jusqu’aux preuves ops.',
  'Wallet protocole LIA ≠ wallet utilisateur — jamais coller le wallet ops.',
] as const

/** Critical path for soft-launch QA */
export const SOFT_LAUNCH_PATH = [
  { to: '/', label: 'Accueil', emoji: '⌂' },
  { to: '/wallet', label: 'Wallet', emoji: '◇' },
  { to: '/museum', label: 'Musée', emoji: '🖼' },
  { to: '/tours', label: 'Tours', emoji: '🗺' },
  { to: '/agents', label: 'Packs', emoji: '✦' },
] as const
