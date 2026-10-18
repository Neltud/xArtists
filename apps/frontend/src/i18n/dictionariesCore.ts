import type { Dict, Lang } from './types'

/** Home — tone protocol (soul-aligned), not museum-only */
const homeFr = {
  'home.kicker': 'xArtists · infrastructure RWA',
  'home.title': 'Packs agents, signaux & salles ops',
  'home.lead':
    'Accès non-custodial sur MultiversX. Packs Pulse · Yield · Sentinel, galerie certifiée et Command Center pour les holders.',
  'home.plan': 'Carte des modules',
  'home.also': 'Aussi',
  'home.contracts': 'Contrats mainnet',
  'home.hall.hint': 'Glisser pour orienter · cliquer une porte',
  'home.rwa.kicker': 'Infrastructure RWA · MultiversX',
  'home.rwa.lead': 'Musée · Command · Packs · Market — un parcours clair',
  'home.dome.badge': 'Dôme 360° · MultiversX',
  'home.dome.loading': 'Chargement du dôme…',
  'home.card.gallery.title': 'Galerie & dôme 3D',
  'home.card.gallery.blurb': 'Scène d’exposition WebGL et collection certifiée.',
  'home.card.lia.title': 'LIA Hub (Command Center)',
  'home.card.lia.blurb': 'Salle d’ops réservée aux détenteurs de packs agent.',
  'home.card.tca.title': 'TCA Academy',
  'home.card.tca.blurb': 'Module 1 Sfumato et certification zero-trust.',
  'home.stat.packs': 'Packs',
  'home.stat.signals': 'Intensité signaux',
  'home.stat.mode': 'Mode',
  'home.stat.modeValue': 'Paper · non-custodial',
  'home.cta.packs': 'Voir les packs',
  'home.cta.gallery': 'Ouvrir la galerie',
  'nav.lia': 'LIA',
  'nav.studio': 'Studio',
  'lia.title': 'LIA Hub',
  'lia.subtitle': 'Signaux paper · tape live · shadow',
}

const homeEn = {
  'home.kicker': 'xArtists · RWA infrastructure',
  'home.title': 'Agent packs, signals & ops rooms',
  'home.lead':
    'Non-custodial access on MultiversX. Pulse · Yield · Sentinel packs, certified gallery, and Command Center for holders.',
  'home.plan': 'Module map',
  'home.also': 'Also',
  'home.contracts': 'Mainnet contracts',
  'home.hall.hint': 'Drag to orient · click a door',
  'home.rwa.kicker': 'RWA infrastructure · MultiversX',
  'home.rwa.lead': 'Museum · Command · Packs · Market — one clear path',
  'home.dome.badge': '360° dome · MultiversX',
  'home.dome.loading': 'Loading dome…',
  'home.card.gallery.title': 'Gallery & 3D dome',
  'home.card.gallery.blurb': 'WebGL exhibition scene and certified collection.',
  'home.card.lia.title': 'LIA Hub (Command Center)',
  'home.card.lia.blurb': 'Ops room reserved for agent pack holders.',
  'home.card.tca.title': 'TCA Academy',
  'home.card.tca.blurb': 'Module 1 Sfumato and zero-trust certification.',
  'home.stat.packs': 'Packs',
  'home.stat.signals': 'Signal intensity',
  'home.stat.mode': 'Mode',
  'home.stat.modeValue': 'Paper · non-custodial',
  'home.cta.packs': 'View packs',
  'home.cta.gallery': 'Open gallery',
  'nav.lia': 'LIA',
  'nav.studio': 'Studio',
  'lia.title': 'LIA Hub',
  'lia.subtitle': 'Paper signals · live tape · shadow',
}

const onboardFr = {
  'onboard.kicker': 'Bienvenue',
  'onboard.title': 'xArtists en 30 secondes',
  'onboard.lead':
    'Démo paper sur MultiversX. Explore librement — aucun fonds client n’est déposé ni géré pour toi.',
  'onboard.step1': 'Galerie — salles 3D et collection',
  'onboard.step2': 'Packs — Pulse · Yield · Sentinel uniquement',
  'onboard.step3': 'Tours — carte culture (hors packs IA)',
  'onboard.cta.gallery': 'Ouvrir la galerie',
  'onboard.skip': 'Continuer sans guide',
}

const onboardEn = {
  'onboard.kicker': 'Welcome',
  'onboard.title': 'xArtists in 30 seconds',
  'onboard.lead':
    'Paper demo on MultiversX. Explore freely — no client funds are deposited or managed for you.',
  'onboard.step1': 'Gallery — 3D halls and collection',
  'onboard.step2': 'Packs — Pulse · Yield · Sentinel only',
  'onboard.step3': 'Tours — culture map (not an AI pack)',
  'onboard.cta.gallery': 'Open the gallery',
  'onboard.skip': 'Continue without guide',
}

const networkFr = {
  'net.offline': 'Hors ligne — cache local actif',
  'net.rateLimit': 'Limite API MultiversX atteinte — nouvel essai dans un instant',
  'net.error': 'Réseau indisponible — données en cache',
  'net.retry': 'Réessayer',
  'net.timeout': 'Délai réseau dépassé — cache local',
  'net.okCache': 'Données mises en cache',
}

const networkEn = {
  'net.offline': 'Offline — local cache active',
  'net.rateLimit': 'MultiversX API rate limit — retry shortly',
  'net.error': 'Network unavailable — cached data',
  'net.retry': 'Retry',
  'net.timeout': 'Network timeout — local cache',
  'net.okCache': 'Data served from cache',
}

const ccFr = {
  'cc.strategy.title': 'Programmateur de stratégie',
  'cc.strategy.soft': 'Prudent',
  'cc.strategy.balanced': 'Équilibré',
  'cc.strategy.aggressive': 'Agressif',
  'cc.cadence': 'Cadence (signaux / h)',
  'cc.blueRibbon': 'Seuil Blue Ribbon',
  'cc.intents': 'Journal d’intents',
  'cc.sign': 'Examiner et signer (xPortal)',
  'cc.disclaimer':
    'Pas de dépôt client. Fonds d’arbitrage via mint. Rewards discrétionnaires. Non-custodial.',
}

const ccEn = {
  'cc.strategy.title': 'Strategy scheduler',
  'cc.strategy.soft': 'Cautious',
  'cc.strategy.balanced': 'Balanced',
  'cc.strategy.aggressive': 'Aggressive',
  'cc.cadence': 'Cadence (signals / h)',
  'cc.blueRibbon': 'Blue Ribbon threshold',
  'cc.intents': 'Intent log',
  'cc.sign': 'Review & sign (xPortal)',
  'cc.disclaimer':
    'No client deposit. Arb funds via mint. Discretionary rewards. Non-custodial.',
}

/** Packs — commercial EUR aligned (110 / 75 / 50) */
const packsFr = {
  'packs.title': 'Packs agents',
  'packs.lead':
    'Trois niveaux d’accès. Prix catalogue serveur. Mode paper par défaut — aucun fonds client.',
  'packs.pulse.name': 'Pulse Pack (Gold)',
  'packs.pulse.tagline': 'Signaux HF · Command Center complet · TCA · LIA',
  'packs.pulse.price': '110 €',
  'packs.yield.name': 'Yield Pack (Silver)',
  'packs.yield.tagline': 'Sleeve DeFi · LP · claim · stake agent',
  'packs.yield.price': '75 €',
  'packs.sentinel.name': 'Sentinel Pack (Platinum)',
  'packs.sentinel.tagline': 'Veille · RWA · alertes risque · zero-trust',
  'packs.sentinel.price': '50 €',
  'packs.cta.buy': 'Choisir ce pack',
  'packs.cta.detail': 'Détail',
  'packs.disclaimer':
    'Accès membership / NFT. Pas un produit d’investissement. Prix fixés côté serveur.',
  'sale.title': 'Vente packs',
  'sale.lead':
    'Pulse · Yield · Sentinel — accès board et signaux. Mint dès SC live. Pas de promesse de rendement.',
  'sale.reserve': 'Réserver',
  'sale.bundle': 'Trio',
  'sale.bundle.tagline': 'Les trois packs — lancement',
}

const packsEn = {
  'packs.title': 'Agent packs',
  'packs.lead':
    'Three access tiers. Server-side list prices. Paper mode by default — no client funds.',
  'packs.pulse.name': 'Pulse Pack (Gold)',
  'packs.pulse.tagline': 'HF signals · full Command Center · TCA · LIA',
  'packs.pulse.price': '€110',
  'packs.yield.name': 'Yield Pack (Silver)',
  'packs.yield.tagline': 'DeFi sleeve · LP · claim · agent stake',
  'packs.yield.price': '€75',
  'packs.sentinel.name': 'Sentinel Pack (Platinum)',
  'packs.sentinel.tagline': 'Watch · RWA · risk alerts · zero-trust',
  'packs.sentinel.price': '€50',
  'packs.cta.buy': 'Choose this pack',
  'packs.cta.detail': 'Details',
  'packs.disclaimer':
    'Membership / NFT access. Not an investment product. Prices enforced server-side.',
  'sale.title': 'Pack sale',
  'sale.lead':
    'Pulse · Yield · Sentinel — board and signal access. Mint when SC is live. No yield promise.',
  'sale.reserve': 'Reserve',
  'sale.bundle': 'Trio',
  'sale.bundle.tagline': 'All three packs — launch',
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
  'cc.subtitle': 'Ops holder · salles pack · tableau de bord',
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
  'staking.title': 'Staking et yield',
  'slot.title': 'Slot atelier',
  'slot.lead': 'Mode fun = crédits virtuels. Mode réel bientôt (SC).',
  'slot.spin': 'Tourner',
  ...homeFr,
  ...onboardFr,
  ...networkFr,
  ...ccFr,
  ...packsFr,
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
  'cc.subtitle': 'Holder ops · pack rooms · dashboard',
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
  'staking.title': 'Staking & yield',
  'slot.title': 'Slot studio',
  'slot.lead': 'Fun mode = virtual credits. Real mode soon (SC).',
  'slot.spin': 'Spin',
  ...homeEn,
  ...onboardEn,
  ...networkEn,
  ...ccEn,
  ...packsEn,
}

const es: Dict = {
  ...en,
  'nav.home': 'Inicio',
  'nav.museum': 'Museo',
  'nav.market': 'Mercado',
  'nav.packs': 'Packs',
  'nav.wallet': 'Cartera',
  'common.connect': 'Conectar',
  'common.buy': 'Comprar',
  'lang.label': 'Idioma',
  'home.kicker': 'xArtists · infraestructura RWA',
  'home.title': 'Packs de agentes, señales y salas ops',
  'home.lead':
    'Acceso no custodial en MultiversX. Packs Pulse · Yield · Sentinel, galería certificada y Command Center para holders.',
  'home.rwa.kicker': 'Infraestructura RWA · MultiversX',
  'home.cta.packs': 'Ver packs',
  'home.cta.gallery': 'Abrir galería',
  'onboard.kicker': 'Bienvenido',
  'onboard.title': 'xArtists en 30 segundos',
  'onboard.skip': 'Continuar sin guía',
  'packs.title': 'Packs de agentes',
  'packs.pulse.name': 'Pulse Pack (Gold)',
  'packs.yield.name': 'Yield Pack (Silver)',
  'packs.sentinel.name': 'Sentinel Pack (Platinum)',
  'packs.cta.buy': 'Elegir este pack',
  'packs.disclaimer':
    'Acceso membership / NFT. No es un producto de inversión. Precios fijados en servidor.',
}

const de: Dict = {
  ...en,
  'nav.home': 'Start',
  'nav.museum': 'Museum',
  'nav.market': 'Markt',
  'nav.packs': 'Packs',
  'nav.wallet': 'Wallet',
  'common.connect': 'Verbinden',
  'common.buy': 'Kaufen',
  'lang.label': 'Sprache',
  'home.kicker': 'xArtists · RWA-Infrastruktur',
  'home.title': 'Agent-Packs, Signale & Ops-Räume',
  'home.lead':
    'Non-custodial auf MultiversX. Pulse · Yield · Sentinel, zertifizierte Galerie und Command Center für Holder.',
  'home.rwa.kicker': 'RWA-Infrastruktur · MultiversX',
  'home.rwa.lead': 'Räume betreten — Museum · Command · Packs · Market',
  'home.cta.packs': 'Packs ansehen',
  'home.cta.gallery': 'Galerie öffnen',
  'onboard.kicker': 'Willkommen',
  'onboard.title': 'xArtists in 30 Sekunden',
  'onboard.skip': 'Ohne Guide fortfahren',
  'net.offline': 'Offline — lokaler Cache aktiv',
  'net.rateLimit': 'MultiversX-API-Limit — bitte kurz warten',
  'net.retry': 'Erneut versuchen',
  'packs.title': 'Agent-Packs',
  'packs.pulse.name': 'Pulse Pack (Gold)',
  'packs.yield.name': 'Yield Pack (Silver)',
  'packs.sentinel.name': 'Sentinel Pack (Platinum)',
  'packs.cta.buy': 'Dieses Pack wählen',
  'packs.disclaimer':
    'Membership / NFT-Zugang. Kein Anlageprodukt. Preise serverseitig fest.',
}

const ru: Dict = {
  ...en,
  'nav.home': 'Главная',
  'nav.packs': 'Пакеты',
  'lang.label': 'Язык',
  'home.title': 'Пакеты агентов, сигналы и ops',
  'packs.title': 'Пакеты агентов',
  'common.buy': 'Купить',
}
const uk: Dict = {
  ...en,
  'nav.home': 'Головна',
  'nav.packs': 'Пакети',
  'lang.label': 'Мова',
  'home.title': 'Пакети агентів, сигнали та ops',
  'packs.title': 'Пакети агентів',
  'common.buy': 'Купити',
}
const zh: Dict = {
  ...en,
  'nav.home': '首页',
  'nav.museum': '博物馆',
  'nav.packs': '礼包',
  'lang.label': '语言',
  'home.kicker': 'xArtists · RWA 基础设施',
  'home.title': '智能体礼包、信号与运营室',
  'home.rwa.kicker': 'RWA 基础设施 · MultiversX',
  'home.cta.packs': '查看礼包',
  'onboard.kicker': '欢迎',
  'packs.title': '智能体礼包',
  'common.buy': '购买',
}
const ar: Dict = {
  ...en,
  'nav.home': 'الرئيسية',
  'nav.packs': 'الباقات',
  'lang.label': 'اللغة',
  'home.title': 'باقات الوكلاء والإشارات وغرف التشغيل',
  'packs.title': 'باقات الوكلاء',
  'common.buy': 'شراء',
}

export const DICTS: Record<Lang, Dict> = { fr, en, es, de, ru, uk, zh, ar }
