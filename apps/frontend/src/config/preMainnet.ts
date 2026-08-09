/**
 * Pre-mainnet modules — visible, isolated, no user funds.
 */
export type PreMainnetStatus = 'pre-mainnet' | 'shell' | 'testnet-only'

export type PreMainnetModule = {
  id: string
  route: string
  label: string
  status: PreMainnetStatus
  blurb: string
  acceptUserFunds: false
  notes?: string
}

export const PRE_MAINNET_MODULES: PreMainnetModule[] = [
  {
    id: 'soul',
    route: '/soul-testnet',
    label: 'Soul Protocol',
    status: 'pre-mainnet',
    blurb: 'ZK / multi-chain exploration — settlement xArtists reste MultiversX.',
    acceptUserFunds: false,
  },
  {
    id: 'burnify',
    route: '/burnify',
    label: 'Burnify',
    status: 'shell',
    blurb: 'UI brûlage $TRO — aucune TX tant que SC non vérifié.',
    acceptUserFunds: false,
  },
  {
    id: 'polylia',
    route: '/agents/polylia',
    label: 'Agents Polylia',
    status: 'pre-mainnet',
    blurb: 'Variante agents — pas de marketplace agents live tant que SC null.',
    acceptUserFunds: false,
  },
  {
    id: 'rwa_bridge',
    route: '',
    label: 'RWA / Bridge',
    status: 'pre-mainnet',
    blurb: 'Pont / escrow RWA — scaffold only.',
    acceptUserFunds: false,
  },
]

export const PRE_MAINNET_DISCLAIMER =
  'PRE-MAINNET — module isolé. Aucun dépôt de fonds utilisateurs. MultiversX mainnet reste la couche de règlement xArtists / LIA. Pas un conseil financier.'

export function isPreMainnetRoute(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  return PRE_MAINNET_MODULES.some(
    (m) => m.route && (p === m.route || p.startsWith(m.route + '/'))
  )
}

export function preMainnetModuleFor(pathname: string): PreMainnetModule | undefined {
  const p = pathname.replace(/\/$/, '') || '/'
  return PRE_MAINNET_MODULES.find(
    (m) => m.route && (p === m.route || p.startsWith(m.route + '/'))
  )
}
