/**
 * Identite editeur — mentions legales (France).
 * SIRET officiel renseigne 2026-09-29.
 */
export const LEGAL_ENTITY = {
  productName: 'xArtists',
  publisherName: 'Nelson Tuduri',
  legalForm: 'Entrepreneur individuel (a confirmer)',
  /** SIRET 14 chiffres — valide Luhn */
  siret: '82418276000028',
  siretStatus: 'ok' as 'missing' | 'ok',
  siretDisplay: '824 182 760 00028',
  siren: '824182760',
  vatNumber: '',
  country: 'France',
  addressLine: 'France — siege a completer si besoin',
  github: 'https://github.com/Neltud/xArtists',
  dapp: 'https://neltud.github.io/xArtists/',
  contact: 'Issues GitHub · Neltud/xArtists',
  contactEmail: '',
  hoster: 'GitHub Pages (GitHub, Inc.) — contenu statique',
  chain: 'MultiversX mainnet',
} as const

export function siretLabel(): string {
  if (LEGAL_ENTITY.siretStatus === 'ok' && LEGAL_ENTITY.siret.length === 14) {
    return LEGAL_ENTITY.siretDisplay || LEGAL_ENTITY.siret
  }
  return LEGAL_ENTITY.siretDisplay
}
