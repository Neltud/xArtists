/**
 * Parcours utilisateurs finalisés — GO_DEMO (paper / lecture chain).
 * SC on-chain = OFF jusqu’à codeHash vérifié.
 */

export type ActionStatus = 'live' | 'paper' | 'gated' | 'soon'

export type UserAction = {
  id: string
  label: string
  path: string
  status: ActionStatus
  needsWallet?: boolean
  note: string
}

/** Actions prioritaires pour la démo live */
export const PRIMARY_ACTIONS: UserAction[] = [
  {
    id: 'browse-museum',
    label: 'Visiter un musée 3D',
    path: '/museum',
    status: 'live',
    note: 'Salles + catalogue Met daily · textures proxy',
  },
  {
    id: 'world-map',
    label: 'Carte monde + POI OSM',
    path: '/tours',
    status: 'live',
    note: 'Zoom ≥10 · Entrer musée si match catalogue',
  },
  {
    id: 'connect-wallet',
    label: 'Connecter xPortal',
    path: '/wallet',
    status: 'live',
    needsWallet: true,
    note: 'Lecture ESDT/NFT · WC allowlist neltud.github.io',
  },
  {
    id: 'daily-points',
    label: 'Points quotidiens',
    path: '/',
    status: 'paper',
    needsWallet: true,
    note: '1 pt / jour · +3 série 7j · localStorage (pas on-chain)',
  },
  {
    id: 'packs',
    label: 'Catalogue packs agents',
    path: '/agents',
    status: 'paper',
    note: 'Produits limités · checkout paper · pas investissement',
  },
  {
    id: 'theater',
    label: 'Ouvrir theater (après pack)',
    path: '/my-packs',
    status: 'paper',
    needsWallet: true,
    note: 'Holder paper client-side · ne pas traiter comme auth SC',
  },
  {
    id: 'slot',
    label: 'Slot paper EGLD/USDC',
    path: '/slot',
    status: 'paper',
    note: 'Accumulation jackpot UI · SC slot non déployé',
  },
  {
    id: 'trading-board',
    label: 'Board LIA paper',
    path: '/trading',
    status: 'paper',
    note: 'Prix live lecture · LIA_LIVE_TRADING=0',
  },
  {
    id: 'tip',
    label: 'Tip LIA / treasury',
    path: '/tip',
    status: 'live',
    needsWallet: true,
    note: 'Tx user-signed · adresses publiques',
  },
  {
    id: 'ads',
    label: 'Espace pub / enchères',
    path: '/ads',
    status: 'paper',
    note: 'Créatives ads_active.json · bid paper jusqu’à SC',
  },
  {
    id: 'venues',
    label: 'Louer un mur / venue',
    path: '/venues',
    status: 'paper',
    note: 'Grille dégressive · SC venue-split après audit',
  },
  {
    id: 'digital-twin',
    label: 'Jumeau sculpture',
    path: '/digital-twin',
    status: 'paper',
    note: 'Upload multi-vue · COLMAP worker optionnel',
  },
  {
    id: 'dao',
    label: 'DAO / vote',
    path: '/dao',
    status: 'gated',
    needsWallet: true,
    note: 'UI power LP+ArtPass · vote on-chain après SC',
  },
  {
    id: 'market',
    label: 'Marketplace list/buy',
    path: '/market',
    status: 'gated',
    needsWallet: true,
    note: 'Fail-closed tant que codeHash null',
  },
  {
    id: 'staking',
    label: 'Stake NFT / TRO',
    path: '/staking',
    status: 'gated',
    needsWallet: true,
    note: 'SC source ready · deploy + verify requis',
  },
]

export const STATUS_LABEL: Record<ActionStatus, string> = {
  live: 'Live',
  paper: 'Paper / démo',
  gated: 'SC requis',
  soon: 'Bientôt',
}
