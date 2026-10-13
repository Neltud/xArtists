import type { Dict, Lang } from './types'

const homeFr = {
  'home.kicker': "xArtists · salle d'accueil",
  'home.title': 'Entre dans les pièces',
  'home.lead': 'Comme au musée : chaque panneau est une porte. Clique pour changer de salle.',
  'home.plan': 'Plan du musée (liste)',
  'home.also': 'Aussi',
  'home.contracts': 'Contrats mainnet',
  'home.hall.hint': 'Glisse pour tourner · clique une porte illustrée',
  'home.dome.badge': 'Dôme 360° · MultiversX',
  'home.dome.loading': 'Dôme 360°…',
  'home.card.gallery.title': 'Galerie & Dôme 3D',
  'home.card.gallery.blurb': "Entrée directe dans la scène d'exposition WebGL.",
  'home.card.lia.title': 'LIA Hub (Command Center)',
  'home.card.lia.blurb': 'Salle de contrôle réservée aux holders de Packs Agent NFT.',
  'home.card.tca.title': 'TCA Academy',
  'home.card.tca.blurb': 'Module 1 Sfumato & certification Zero-Trust.',
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
  'home.dome.badge': '360° Dome · MultiversX',
  'home.dome.loading': '360° Dome…',
  'home.card.gallery.title': 'Gallery & 3D Dome',
  'home.card.gallery.blurb': 'Direct entry into the WebGL exhibition scene.',
  'home.card.lia.title': 'LIA Hub (Command Center)',
  'home.card.lia.blurb': 'Control room reserved for Agent Pack NFT holders.',
  'home.card.tca.title': 'TCA Academy',
  'home.card.tca.blurb': 'Module 1 Sfumato & Zero-Trust certification.',
  'nav.lia': 'LIA',
  'nav.studio': 'Studio',
  'lia.title': 'LIA Hub',
  'lia.subtitle': 'Paper signals · live tape · shadow',
}

const networkFr = {
  'net.offline': 'Hors ligne — cache local actif',
  'net.rateLimit': 'Limite API MultiversX atteinte — nouvel essai dans un instant',
  'net.error': 'Réseau indisponible — données en cache',
  'net.retry': 'Réessayer',
}

const networkEn = {
  'net.offline': 'Offline — local cache active',
  'net.rateLimit': 'MultiversX API rate limit — retry shortly',
  'net.error': 'Network unavailable — cached data',
  'net.retry': 'Retry',
}

const ccFr = {
  'cc.strategy.title': 'Programmateur de stratégie',
  'cc.strategy.soft': 'Prudent / Soft',
  'cc.strategy.balanced': 'Équilibré',
  'cc.strategy.aggressive': 'Agressif',
  'cc.cadence': 'Cadence (signaux / h)',
  'cc.blueRibbon': 'Seuil Blue Ribbon',
  'cc.intents': 'Journal d\'intents',
  'cc.sign': '⚡ Examiner & Signer xPortal',
  'cc.disclaimer':
    'Pas de dépôt. Fonds d\'arbitrage via mint. Rewards discrétionnaires. Non-custodial.',
}

const ccEn = {
  'cc.strategy.title': 'Strategy scheduler',
  'cc.strategy.soft': 'Cautious / Soft',
  'cc.strategy.balanced': 'Balanced',
  'cc.strategy.aggressive': 'Aggressive',
  'cc.cadence': 'Cadence (signals / h)',
  'cc.blueRibbon': 'Blue Ribbon threshold',
  'cc.intents': 'Intent log',
  'cc.sign': '⚡ Review & Sign with xPortal',
  'cc.disclaimer':
    'No deposit. Arb funds via mint. Discretionary rewards. Non-custodial.',
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
  ...networkFr,
  ...ccFr,
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
  ...networkEn,
  ...ccEn,
}

/** Secondary locales: EN base + partial native overrides (t() falls back EN→FR). */
const es: Dict = {
  ...en,
  'nav.home': 'Inicio',
  'nav.museum': 'Museo',
  'nav.market': 'Mercado',
  'nav.wallet': 'Cartera',
  'common.connect': 'Conectar',
  'lang.label': 'Idioma',
  'home.dome.badge': 'Cúpula 360° · MultiversX',
  'home.card.gallery.title': 'Galería y Cúpula 3D',
  'home.card.tca.title': 'Academia TCA',
}

const de: Dict = {
  ...en,
  'nav.home': 'Start',
  'nav.museum': 'Museum',
  'nav.market': 'Markt',
  'nav.wallet': 'Wallet',
  'common.connect': 'Verbinden',
  'lang.label': 'Sprache',
  'home.dome.badge': '360°-Kuppel · MultiversX',
  'home.dome.loading': '360°-Kuppel…',
  'home.card.gallery.title': 'Galerie & 3D-Kuppel',
  'home.card.gallery.blurb': 'Direkter Einstieg in die WebGL-Ausstellung.',
  'home.card.lia.title': 'LIA Hub (Command Center)',
  'home.card.lia.blurb': 'Kontrollraum für Agent-Pack-NFT-Inhaber.',
  'home.card.tca.title': 'TCA Akademie',
  'home.card.tca.blurb': 'Modul 1 Sfumato & Zero-Trust-Zertifizierung.',
  'net.offline': 'Offline — lokaler Cache aktiv',
  'net.rateLimit': 'MultiversX-API-Limit — bitte kurz warten',
  'net.retry': 'Erneut versuchen',
}

const ru: Dict = { ...en, 'nav.home': 'Главная', 'lang.label': 'Язык' }
const uk: Dict = { ...en, 'nav.home': 'Головна', 'lang.label': 'Мова' }
const zh: Dict = {
  ...en,
  'nav.home': '首页',
  'nav.museum': '博物馆',
  'lang.label': '语言',
  'home.dome.badge': '360° 穹顶 · MultiversX',
  'home.card.gallery.title': '画廊与 3D 穹顶',
  'home.card.tca.title': 'TCA 学院',
}
const ar: Dict = { ...en, 'nav.home': 'الرئيسية', 'lang.label': 'اللغة' }

export const DICTS: Record<Lang, Dict> = { fr, en, es, de, ru, uk, zh, ar }
