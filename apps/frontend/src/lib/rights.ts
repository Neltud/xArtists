/**
 * Couche droits d'auteur — schéma metadata xArtists.
 */
export type RightsLicense =
  | 'all-rights-reserved'
  | 'edition-collector'
  | 'cc-by'
  | 'cc-by-nc'
  | 'cc-by-nc-nd'
  | 'museum-mandate'
  | 'public-domain'

export type RightsAttestation =
  | 'self_declared'
  | 'oauth_platform'
  | 'museum_mandate'
  | 'written_contract'
  | 'public_domain_source'

export type RightsMetadata = {
  creator: string
  copyright_owner: string
  year: number
  license: RightsLicense
  license_uri?: string
  territory: 'WW' | 'EU' | 'FR' | string
  moral_rights: 'retained'
  commercial_use: boolean
  derivatives: boolean
  royalty_bps: number
  attestation: RightsAttestation
  source_url?: string
  attested_at?: string
  report_contact?: string
}

export const LICENSE_LABELS: Record<RightsLicense, string> = {
  'all-rights-reserved': 'Tous droits réservés',
  'edition-collector': 'Édition collector (usage perso)',
  'cc-by': 'CC BY',
  'cc-by-nc': 'CC BY-NC',
  'cc-by-nc-nd': 'CC BY-NC-ND',
  'museum-mandate': 'Mandat musée / institution',
  'public-domain': 'Domaine public',
}

export function defaultRights(partial?: Partial<RightsMetadata>): RightsMetadata {
  const year = new Date().getFullYear()
  return {
    creator: '',
    copyright_owner: '',
    year,
    license: 'edition-collector',
    territory: 'WW',
    moral_rights: 'retained',
    commercial_use: false,
    derivatives: false,
    royalty_bps: 500,
    attestation: 'self_declared',
    report_contact: 'https://discord.gg/QkJgzeyWG',
    ...partial,
  }
}

export function rightsToNftAttributes(r: RightsMetadata): { trait_type: string; value: string }[] {
  return [
    { trait_type: 'Creator', value: r.creator },
    { trait_type: 'Copyright Owner', value: r.copyright_owner || r.creator },
    { trait_type: 'License', value: LICENSE_LABELS[r.license] || r.license },
    { trait_type: 'Year', value: String(r.year) },
    { trait_type: 'Commercial Use', value: r.commercial_use ? 'Yes' : 'No' },
    { trait_type: 'Royalty bps', value: String(r.royalty_bps) },
    { trait_type: 'Attestation', value: r.attestation },
  ]
}
