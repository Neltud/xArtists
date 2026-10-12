import type { Dict, Lang } from './types'

const homeFr = {
  'home.kicker': "xArtists · salle d'accueil",
  'home.title': 'Entre dans les pièces',
  'home.lead': 'Comme au musée : chaque panneau est une porte. Clique pour changer de salle.',
  'home.plan': 'Plan du musée (liste)',
  'home.also': 'Aussi',
  'home.contracts': 'Contrats mainnet',
  'home.hall.hint': 'Glisse pour tourner · clique une porte illustrée',
  'nav.lia': 'LIA',
  'nav.studio': 'Studio',
  'lia.title': 'LIA Hub',
  'lia.subtitle': 'Signaux paper · tape live · shadow',
}

const homeEn = {
  'home.kicker': 'xArtists · entrance hall',
  'home.title': 'Enter the rooms',
  'home.lead': 'Like a museum: each panel is a door. Click to change room.',
  'home.plan': 'Museum map (list)',
  'home.also': 'Also',
  'home.contracts': 'Mainnet contracts',
  'home.hall.hint': 'Drag to turn · click an illustrated door',
  'nav.lia': 'LIA',
  'nav.studio': 'Studio',
  'lia.title': 'LIA Hub',
  'lia.subtitle': 'Paper signals · live tape · shadow',
}

const fr: Dict = {
  'nav.home': 'Accueil',
  'nav.museum': 'Musée',
  'nav.market': 'Marché',
  'nav.slot': 'Slot',
  'nav.packs': 'Packs',
  'nav.wallet': 'Wallet',
  'nav.command': 'Command',
  'nav.staking': 'Staking',
  'cc.title': 'Command Center',
  'cc.subtitle': 'Ops holder · salles pack · mur holographique',
  'cc.hub': 'Hub',
  'cc.pulse': 'Pulse',
  'cc.yield': 'Yield',
  'cc.sentinel': 'Sentinel',
  'cc.locked': 'Verrouillé',
  'common.connect': 'Connecter',
  'common.disconnect': 'Déconnecter',
  'common.loading': 'Chargement…',
  'common.error': 'Erreur',
  'common.buy': 'Acheter',
  'lang.label': 'Langue',
  'wallet.title': 'Wallet',
  'wallet.session': 'Session',
  'market.title': 'Marketplace',
  'staking.title': 'Staking & Yield',
  'slot.title': 'Slot Atelier',
  'slot.lead': 'Fun = crédits virtuels. Réel bientôt (SC).',
  'slot.spin': 'Tourner',
  ...homeFr,
}

const en: Dict = {
  'nav.home': 'Home',
  'nav.museum': 'Museum',
  'nav.market': 'Market',
  'nav.slot': 'Slot',
  'nav.packs': 'Packs',
  'nav.wallet': 'Wallet',
  'nav.command': 'Command',
  'nav.staking': 'Staking',
  'cc.title': 'Command Center',
  'cc.subtitle': 'Holder ops · pack rooms · holographic wall',
  'cc.hub': 'Hub',
  'cc.pulse': 'Pulse',
  'cc.yield': 'Yield',
  'cc.sentinel': 'Sentinel',
  'cc.locked': 'Locked',
  'common.connect': 'Connect',
  'common.disconnect': 'Disconnect',
  'common.loading': 'Loading…',
  'common.error': 'Error',
  'common.buy': 'Buy',
  'lang.label': 'Language',
  'wallet.title': 'Wallet',
  'wallet.session': 'Session',
  'market.title': 'Marketplace',
  'staking.title': 'Staking & Yield',
  'slot.title': 'Slot Studio',
  'slot.lead': 'Fun = virtual credits. Real mode soon (SC).',
  'slot.spin': 'Spin',
  ...homeEn,
}

/** Other locales: English base (t() falls back FR/EN for audit keys). */
const es: Dict = { ...en, 'nav.home': 'Inicio', 'nav.museum': 'Museo' }
const ru: Dict = { ...en, 'nav.home': 'Главная' }
const uk: Dict = { ...en, 'nav.home': 'Головна' }
const zh: Dict = { ...en, 'nav.home': '首页' }
const ar: Dict = { ...en, 'nav.home': 'الرئيسية' }

export const DICTS: Record<Lang, Dict> = { fr, en, es, ru, uk, zh, ar }
