/**
 * Checkout + Legal i18n keys (FR / EN / DE / ES / ZH / RU / UK / AR)
 */
import type { Dict } from './types'

export const checkoutLegalFr: Dict = {
  'checkout.title': 'Checkout pack',
  'checkout.close': 'Fermer',
  'checkout.disclaimer':
    "Produit d'acces numerique limite — pas un fond d'investissement. LIA = analytique / paper uniquement. Fiat = prestataires tiers regulés.",
  'checkout.chooseRail': 'Choisir le rail',
  'checkout.rail.crypto': '1 · Crypto direct',
  'checkout.rail.crypto.desc': 'EGLD via xPortal (wallet requis).',
  'checkout.rail.crypto.mintOpen': 'mint ouvert',
  'checkout.rail.crypto.mintSoon': 'mint bientot',
  'checkout.rail.fiat': '2 · Fiat / carte',
  'checkout.rail.fiat.desc':
    'Carte / SEPA via gateway regule. Sans wallet : ID reception temporaire → mint apres claim erd1.',
  'checkout.rail.fiat.ready': 'gateway dispo',
  'checkout.rail.fiat.soon': 'bientot',
  'checkout.rail.card': '💳 Carte bancaire / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.method.stripe': 'Stripe (carte)',
  'checkout.method.paybox': 'Paybox / SEPA',
  'checkout.guestHint': "Sans wallet : un ID temporaire lie le paiement au claim erd1 ulterieur.",
  'checkout.connectXportal': 'Ou connecter xPortal / acces simplifie',
  'checkout.needEgld': "Besoin d'EGLD ? MoonPay ↗",
  'checkout.continueFiat': 'Continuer · {amount} € fiat',
  'checkout.continueCrypto': 'Continuer · {amount} EGLD',
  'checkout.or': 'Ou',
  'checkout.preview': 'apercu appareil (0 € · pas un achat)',
  'checkout.legalLink': 'Mentions legales',
  'checkout.msg.fiatNotConfigured': 'Rail fiat non configure (Stripe / Paybox / Access API).',
  'checkout.msg.cryptoNeedsWallet': 'Le rail crypto exige xPortal / erd1.',
  'checkout.msg.mintSoon': 'Mint pack on-chain bientot. Prix : {amount} EGLD.',
  'checkout.msg.redirectStripe': 'Redirection Stripe…',
  'checkout.msg.redirectPaybox': 'Redirection Paybox / e-Transactions…',
  'checkout.msg.guestPay': "Paiement lie a l'ID {id} — claim erd1 apres confirmation…",
  'checkout.msg.moonpayFail': 'MoonPay indisponible',
  'checkout.msg.moonpayOk': 'MoonPay ouvert — recharge EGLD puis reviens.',
  'checkout.msg.previewNeedWallet': "Connecte un wallet pour lier l'apercu.",
  'checkout.priceLine': '{egld} EGLD · ≈ {eur} €',
  'packCheckout.guestPreview':
    "Mode invite : connecte xPortal pour lier l'apercu a ton adresse (sans paiement).",
  'packCheckout.previewDone': 'Apercu « {id} » — pas un achat. Salle : {room}.',
  'packCheckout.guestSelect': 'Invite — la salle « {room} » necessite un pack (crypto ou fiat).',
  'packCheckout.selected': 'Pack selectionne :',
  'packCheckout.buy': 'Acheter / Checkout',
  'packCheckout.change': 'Changer',
  'packCheckout.connectFirst': 'Connecte xPortal avant le checkout.',
  'packCheckout.crypto': 'Crypto',
  'packCheckout.fiat': 'Fiat',
  'packCheckout.cryptoLine': '{amount} EGLD · xPortal',
  'packCheckout.fiatLine': '{amount} € · carte / SEPA',
  'packCheckout.mintLive': 'mint LIVE',
  'packCheckout.mintSoon': 'mint bientot',
  'packCheckout.gatewayOn': 'gateway on',
  'packCheckout.soon': 'bientot',
  'packCheckout.liaNote':
    'LIA = analyse & paper trading uniquement — pas de compte titres ni broker dans le checkout.',
  'packCheckout.myRooms': 'Mes salles (apercu)',
  'packCheckout.room.pulse': 'Salle Pulse — signaux & flux live',
  'packCheckout.room.yield': 'Salle Yield — farming & liquidite $TRO',
  'packCheckout.room.sentinel': 'Salle Sentinel — alertes & garde-fous',
  'legal.sectionLabel': 'Juridique',
  'legal.title': 'Mentions legales',
  'legal.subtitle': 'Editeur · interface non-custodiale · MultiversX mainnet',
  'legal.siretMissing': 'SIRET editeur non renseigne dans la config.',
  'legal.tab.mentions': 'Mentions',
  'legal.tab.terms': 'Terms',
  'legal.tab.cgu': 'Conditions',
  'legal.tab.privacy': 'Confidentialite',
  'legal.tab.risk': 'Risques',
  'legal.tab.process': 'Processus',
  'legal.terms.1.title': '1 · Nature logicielle',
  'legal.terms.1.body':
    "xArtists est une interface logicielle decentralisee. Ce n'est pas une plateforme de courtage ni un CASP MiCA, sauf prestataire tiers identifie (paiement fiat).",
  'legal.terms.2.title': '2 · Marches & exoneration',
  'legal.terms.2.body':
    "Les prix $TRO / EGLD sont informatifs. Aucun conseil financier. L'editeur n'est pas responsable des pertes liees a la volatilite.",
  'legal.terms.3.title': '3 · Token $TRO',
  'legal.terms.3.body':
    "$TRO est un jeton d'utilite et de gouvernance. Pas un produit d'investissement a rendement garanti.",
  'legal.terms.4.title': '4 · Fiat & tiers',
  'legal.terms.4.body':
    'Paiements carte / SEPA via entites tiers regulees (Stripe, Paybox). xArtists ne conserve pas les donnees de carte.',
  'legal.terms.5.title': '5 · LIA & paper',
  'legal.terms.5.body':
    'LIA est analytique ; mode public = paper trading educatif. Aucun depot de tresorerie utilisateur requis en mode paper.',
  'legal.mentions.editor': 'Editeur du site',
  'legal.mentions.hosting': 'Hebergement',
  'legal.mentions.contact': 'Contact',
  'legal.mentions.hostingBody': 'Lectures de chaine via API publiques MultiversX.',
  'legal.mentions.liaWallet': 'Wallet protocole LIA (ops, ≠ wallet utilisateur) :',
  'legal.cgu.title': "Conditions d'utilisation",
  'legal.cgu.intro': "L'acces a la dApp vaut acceptation des presentes. Service fourni en l'etat.",
  'legal.cgu.packs':
    "Packs — pas un fond d'investissement. Acquisition = acces produit + fonds ops LIA (paper), sans depot utilisateur.",
  'legal.cgu.lia': 'Trading LIA — simulation / paper par defaut.',
  'legal.cgu.sig': 'Signature TX uniquement via le wallet utilisateur. Aucune cle privee stockee.',
  'legal.cgu.noLiaWallet': "Interdiction d'utiliser le wallet protocole LIA comme session utilisateur.",
  'legal.privacy.title': 'Confidentialite',
  'legal.privacy.1': 'Pas de compte e-mail obligatoire pour parcourir la dApp.',
  'legal.privacy.2': 'Adresses wallet : localStorage + API publiques MultiversX.',
  'legal.privacy.3': 'Paiements carte : politiques Stripe / Paybox / tiers.',
  'legal.privacy.4': 'ID invite fiat : local, lie au claim erd1 ulterieur.',
  'legal.risk.title': 'Avertissements',
  'legal.risk.1': 'Crypto / NFT : risque de perte en capital. Pas un conseil en investissement.',
  'legal.risk.2': 'Simulation ≠ performance reelle.',
  'legal.risk.3': 'Verifiez adresses et montants avant toute signature.',
  'legal.risk.4': 'Bugs et congestions reseau possibles.',
  'legal.process.title': 'Processus produit',
  'legal.process.1': 'Connexion — xPortal, extension, Web Wallet, ou ID temporaire fiat.',
  'legal.process.2': 'Checkout — crypto on-chain ou fiat tiers + webhook mint.',
  'legal.process.3': 'Stake / market — chaque action exige une signature explicite.',
  'legal.nav.home': 'Accueil',
  'legal.nav.packs': 'Packs',
}

export const checkoutLegalEn: Dict = {
  'checkout.title': 'Pack checkout',
  'checkout.close': 'Close',
  'checkout.disclaimer':
    'Limited digital access product — not an investment fund. LIA = analytics / paper only. Fiat = regulated third-party providers.',
  'checkout.chooseRail': 'Choose payment rail',
  'checkout.rail.crypto': '1 · Direct crypto',
  'checkout.rail.crypto.desc': 'EGLD via xPortal (wallet required).',
  'checkout.rail.crypto.mintOpen': 'mint open',
  'checkout.rail.crypto.mintSoon': 'mint soon',
  'checkout.rail.fiat': '2 · Fiat / card',
  'checkout.rail.fiat.desc':
    'Card / SEPA via regulated gateway. Without wallet: temporary receive ID → mint after erd1 claim.',
  'checkout.rail.fiat.ready': 'gateway ready',
  'checkout.rail.fiat.soon': 'coming soon',
  'checkout.rail.card': '💳 Bank card / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.method.stripe': 'Stripe (card)',
  'checkout.method.paybox': 'Paybox / SEPA',
  'checkout.guestHint': 'Without wallet: a temporary ID links payment to a later erd1 claim.',
  'checkout.connectXportal': 'Or connect xPortal / simplified access',
  'checkout.needEgld': 'Need EGLD? MoonPay ↗',
  'checkout.continueFiat': 'Continue · {amount} € fiat',
  'checkout.continueCrypto': 'Continue · {amount} EGLD',
  'checkout.or': 'Or',
  'checkout.preview': 'device preview (0 € · not a purchase)',
  'checkout.legalLink': 'Legal notices',
  'checkout.msg.fiatNotConfigured': 'Fiat rail not configured (Stripe / Paybox / Access API).',
  'checkout.msg.cryptoNeedsWallet': 'Crypto rail requires xPortal / erd1.',
  'checkout.msg.mintSoon': 'On-chain pack mint coming soon. Price: {amount} EGLD.',
  'checkout.msg.redirectStripe': 'Redirecting to Stripe…',
  'checkout.msg.redirectPaybox': 'Redirecting to Paybox / e-Transactions…',
  'checkout.msg.guestPay': 'Payment linked to ID {id} — claim erd1 after confirmation…',
  'checkout.msg.moonpayFail': 'MoonPay unavailable',
  'checkout.msg.moonpayOk': 'MoonPay opened — top up EGLD then come back.',
  'checkout.msg.previewNeedWallet': 'Connect a wallet to link the preview.',
  'checkout.priceLine': '{egld} EGLD · ≈ {eur} €',
  'packCheckout.guestPreview':
    'Guest mode: connect xPortal to link the preview to your address (no payment).',
  'packCheckout.previewDone': 'Preview "{id}" — not a purchase. Room: {room}.',
  'packCheckout.guestSelect': 'Guest — room "{room}" needs a pack (crypto or fiat).',
  'packCheckout.selected': 'Selected pack:',
  'packCheckout.buy': 'Buy / Checkout',
  'packCheckout.change': 'Change',
  'packCheckout.connectFirst': 'Connect xPortal before checkout.',
  'packCheckout.crypto': 'Crypto',
  'packCheckout.fiat': 'Fiat',
  'packCheckout.cryptoLine': '{amount} EGLD · xPortal',
  'packCheckout.fiatLine': '{amount} € · card / SEPA',
  'packCheckout.mintLive': 'mint LIVE',
  'packCheckout.mintSoon': 'mint soon',
  'packCheckout.gatewayOn': 'gateway on',
  'packCheckout.soon': 'soon',
  'packCheckout.liaNote':
    'LIA = analysis & paper trading only — no securities account or broker in checkout.',
  'packCheckout.myRooms': 'My rooms (preview)',
  'packCheckout.room.pulse': 'Pulse room — live signals & flow',
  'packCheckout.room.yield': 'Yield room — farming & $TRO liquidity',
  'packCheckout.room.sentinel': 'Sentinel room — alerts & guardrails',
  'legal.sectionLabel': 'Legal',
  'legal.title': 'Legal notices',
  'legal.subtitle': 'Publisher · non-custodial interface · MultiversX mainnet',
  'legal.siretMissing': 'Publisher SIRET not set in config.',
  'legal.tab.mentions': 'Notices',
  'legal.tab.terms': 'Terms',
  'legal.tab.cgu': 'Conditions',
  'legal.tab.privacy': 'Privacy',
  'legal.tab.risk': 'Risks',
  'legal.tab.process': 'Process',
  'legal.terms.1.title': '1 · Software nature',
  'legal.terms.1.body':
    'xArtists is a decentralized open-source software interface. Not a brokerage or MiCA CASP, except identified third-party fiat providers.',
  'legal.terms.2.title': '2 · Markets & disclaimer',
  'legal.terms.2.body':
    '$TRO / EGLD prices are informational. No financial advice. Publisher not liable for volatility losses.',
  'legal.terms.3.title': '3 · $TRO token',
  'legal.terms.3.body':
    '$TRO is a utility and governance token. Not sold as an investment product with guaranteed yield.',
  'legal.terms.4.title': '4 · Fiat & third parties',
  'legal.terms.4.body':
    'Card / SEPA via regulated third parties (Stripe, Paybox). xArtists does not store card data.',
  'legal.terms.5.title': '5 · LIA & paper',
  'legal.terms.5.body':
    'LIA is analytics; default public mode is educational paper trading. No user cash deposit required in paper mode.',
  'legal.mentions.editor': 'Site publisher',
  'legal.mentions.hosting': 'Hosting',
  'legal.mentions.contact': 'Contact',
  'legal.mentions.hostingBody': 'Chain reads via public MultiversX APIs.',
  'legal.mentions.liaWallet': 'LIA protocol wallet (ops, ≠ user wallet):',
  'legal.cgu.title': 'Terms of use',
  'legal.cgu.intro': 'Accessing the dApp means you accept these terms. Service provided as is.',
  'legal.cgu.packs':
    'Packs — not an investment fund. Purchase funds product access and LIA ops fund (paper), with no user cash deposit.',
  'legal.cgu.lia': 'LIA trading — simulation / paper by default.',
  'legal.cgu.sig': 'TX signing only via the user wallet. No private keys stored.',
  'legal.cgu.noLiaWallet': 'Do not use the LIA protocol wallet as a user session.',
  'legal.privacy.title': 'Privacy',
  'legal.privacy.1': 'No mandatory email account to browse the dApp.',
  'legal.privacy.2': 'Wallet addresses: localStorage + public MultiversX APIs.',
  'legal.privacy.3': 'Card payments: Stripe / Paybox / third-party policies.',
  'legal.privacy.4': 'Guest fiat ID: local, linked to a later erd1 claim.',
  'legal.risk.title': 'Warnings',
  'legal.risk.1': 'Crypto / NFT: risk of capital loss. Not investment advice.',
  'legal.risk.2': 'Simulation ≠ real performance.',
  'legal.risk.3': 'Check addresses and amounts before any signature.',
  'legal.risk.4': 'Bugs and network congestion may occur.',
  'legal.process.title': 'Product process',
  'legal.process.1': 'Connect — xPortal, extension, Web Wallet, or temporary fiat ID.',
  'legal.process.2': 'Checkout — on-chain crypto or third-party fiat + mint webhook.',
  'legal.process.3': 'Stake / market — every action needs an explicit signature.',
  'legal.nav.home': 'Home',
  'legal.nav.packs': 'Packs',
}

export const checkoutLegalDe: Dict = {
  ...checkoutLegalEn,
  'checkout.title': 'Pack-Checkout',
  'checkout.close': 'Schließen',
  'checkout.chooseRail': 'Zahlungsweg wählen',
  'checkout.rail.card': '💳 Bankkarte / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.continueFiat': 'Weiter · {amount} € Fiat',
  'checkout.continueCrypto': 'Weiter · {amount} EGLD',
  'packCheckout.buy': 'Kaufen / Checkout',
  'packCheckout.connectFirst': 'xPortal vor dem Checkout verbinden.',
  'legal.title': 'Impressum & Rechtliches',
  'legal.sectionLabel': 'Rechtliches',
  'legal.nav.home': 'Start',
  'legal.nav.packs': 'Packs',
}

export const checkoutLegalEs: Dict = {
  ...checkoutLegalEn,
  'checkout.title': 'Checkout del pack',
  'checkout.close': 'Cerrar',
  'checkout.chooseRail': 'Elegir vía de pago',
  'checkout.rail.card': '💳 Tarjeta bancaria / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.continueFiat': 'Continuar · {amount} € fiat',
  'checkout.continueCrypto': 'Continuar · {amount} EGLD',
  'packCheckout.buy': 'Comprar / Checkout',
  'packCheckout.connectFirst': 'Conecta xPortal antes del checkout.',
  'legal.title': 'Avisos legales',
  'legal.sectionLabel': 'Legal',
  'legal.nav.home': 'Inicio',
  'legal.nav.packs': 'Packs',
}

export const checkoutLegalZh: Dict = {
  ...checkoutLegalEn,
  'checkout.title': '套餐结账',
  'checkout.close': '关闭',
  'checkout.chooseRail': '选择支付通道',
  'checkout.rail.card': '💳 银行卡 / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.continueFiat': '继续 · {amount} € 法币',
  'checkout.continueCrypto': '继续 · {amount} EGLD',
  'packCheckout.buy': '购买 / 结账',
  'packCheckout.connectFirst': '结账前请连接 xPortal。',
  'legal.title': '法律声明',
  'legal.sectionLabel': '法律',
  'legal.nav.home': '首页',
  'legal.nav.packs': '礼包',
}

export const checkoutLegalRu: Dict = {
  ...checkoutLegalEn,
  'checkout.title': 'Оформление пакета',
  'checkout.close': 'Закрыть',
  'checkout.chooseRail': 'Выбрать способ оплаты',
  'checkout.rail.card': '💳 Банковская карта / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.continueFiat': 'Продолжить · {amount} € fiat',
  'checkout.continueCrypto': 'Продолжить · {amount} EGLD',
  'packCheckout.buy': 'Купить / Оформить',
  'packCheckout.connectFirst': 'Подключите xPortal перед оформлением.',
  'legal.title': 'Юридические сведения',
  'legal.sectionLabel': 'Юридическое',
  'legal.nav.home': 'Главная',
  'legal.nav.packs': 'Пакеты',
}

export const checkoutLegalUk: Dict = {
  ...checkoutLegalEn,
  'checkout.title': 'Оформлення пакета',
  'checkout.close': 'Закрити',
  'checkout.chooseRail': 'Обрати спосіб оплати',
  'checkout.rail.card': '💳 Банківська картка / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.continueFiat': 'Продовжити · {amount} € fiat',
  'checkout.continueCrypto': 'Продовжити · {amount} EGLD',
  'packCheckout.buy': 'Купити / Оформити',
  'packCheckout.connectFirst': 'Підключіть xPortal перед оформленням.',
  'legal.title': 'Юридичні відомості',
  'legal.sectionLabel': 'Юридичне',
  'legal.nav.home': 'Головна',
  'legal.nav.packs': 'Пакети',
}

export const checkoutLegalAr: Dict = {
  ...checkoutLegalEn,
  'checkout.title': 'إتمام شراء الباقة',
  'checkout.close': 'إغلاق',
  'checkout.chooseRail': 'اختر مسار الدفع',
  'checkout.rail.card': '💳 بطاقة بنكية / SEPA',
  'checkout.rail.web3': '⚡ Web3 MultiversX (EGLD)',
  'checkout.continueFiat': 'متابعة · {amount} € عملة ورقية',
  'checkout.continueCrypto': 'متابعة · {amount} EGLD',
  'packCheckout.buy': 'شراء / إتمام',
  'packCheckout.connectFirst': 'صل xPortal قبل الإتمام.',
  'legal.title': 'الإشعارات القانونية',
  'legal.sectionLabel': 'قانوني',
  'legal.nav.home': 'الرئيسية',
  'legal.nav.packs': 'الباقات',
}

export function checkoutLegalFor(lang: string): Dict {
  switch (lang) {
    case 'en':
      return checkoutLegalEn
    case 'de':
      return checkoutLegalDe
    case 'es':
      return checkoutLegalEs
    case 'zh':
      return checkoutLegalZh
    case 'ru':
      return checkoutLegalRu
    case 'uk':
      return checkoutLegalUk
    case 'ar':
      return checkoutLegalAr
    case 'fr':
      return checkoutLegalFr
    default:
      return checkoutLegalEn
  }
}
