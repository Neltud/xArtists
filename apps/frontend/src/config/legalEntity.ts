/**
 * Identite editeur — mentions legales (France).
 * SIRET : renseigner le numero officiel 14 chiffres des disponible.
 * Ne jamais inventer un SIRET.
 */
export const LEGAL_ENTITY = {
  productName: 'xArtists',
  publisherName: 'Nelson Tuduri',
  /** Forme : entrepreneur individuel / a preciser avec le SIRET */
  legalForm: 'A preciser (EI / SARL / autre)',
  /**
   * SIRET officiel (14 chiffres) — MANQUANT tant que non fourni par l'editeur.
   * Affiche "A completer" sur /legal tant que siretStatus !== 'ok'.
   */
  siret: '',
  siretStatus: 'missing' as 'missing' | 'ok',
  siretDisplay: 'A completer — numero SIRET editeur',
  siren: '',
  vatNumber: '',
  country: 'France',
  addressLine: 'Adresse du siege — a completer',
  github: 'https://github.com/Neltud/xArtists',
  dapp: 'https://neltud.github.io/xArtists/',
  contact: 'Issues GitHub · Neltud/xArtists',
  contactEmail: '',
  hoster: 'GitHub Pages (GitHub, Inc.) — contenu statique',
  chain: 'MultiversX mainnet',
} as const

export function siretLabel(): string {
  if (LEGAL_ENTITY.siretStatus === 'ok' && LEGAL_ENTITY.siret.length === 14) {
    return LEGAL_ENTITY.siret
  }
  return LEGAL_ENTITY.siretDisplay
}
