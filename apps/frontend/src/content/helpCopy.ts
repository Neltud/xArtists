/**
 * Textes des bulles d’info (InfoTip) + guides de page (PageGuide).
 * Règle : honnête, pas de SC « live » fictif, pas de confusion LIA / user.
 */

export const HELP = {
  /* ——— Concepts globaux ——— */
  lia_vs_user:
    « LIA désigne le wallet protocole (ops, paper trading, trésorerie affichée). Ton portefeuille personnel n’apparaît que sur « Mon wallet » après Connect (extension / Web Wallet). Ne jamais envoyer de fonds « perso » en pensant alimenter LIA, ni l’inverse. »,

  sc_pending:
    « Les smart contracts nft-marketplace et agents-marketplace ne sont considérés live qu’après déploiement mainnet et vérification du codeHash. Tant que le bandeau amber est visible, List / Buy / Bid on-chain restent volontairement bloqués pour éviter de fausses transactions. »,

  live_trading:
    « Flag LIA_LIVE_TRADING = 0 par défaut : LIA ne signe pas de trades réels. Boards, séries et scénarios sont en mode paper jusqu’à preuve de micro-trades et signature utilisateur validées. Aucune promesse de performance. »,

  tro_token:
    « $TRO (identifiant ESDT TRO-94c925, nom TUDURIORIGINAL) est le token d’utilité et de culture xArtists. Plafond produit : 500 000 TRO. Illiquide à ce stade : ce n’est ni une part de fonds d’investissement, ni un rendement promis, ni un équivalent cash de la treasury. »,

  fees_3pct:
    « Une fois le marketplace déployé avec FEE_BPS = 300, chaque achat prélève 3 % de frais : 97 % partent au vendeur, 3 % restent sur le contrat jusqu’à claimFees (owner). Le détail du split fondation (Mission / Reserve / Ops) est décrit dans la policy treasury. »,

  gsn_vs_packs:
    « GreenSmoke (GSN) : agents de prévision utilisés pour scorer le marché avant décision LIA. Packs LIA : sous-agents Vellum limités, vendus séparément (cible tarifaire 5–25 €). Ce sont deux produits distincts — ne pas les confondre dans l’UI ni dans le pricing. »,

  profit_lock:
    « Sur un gain net réalisé, environ 70 % est verrouillé (locked) et ne peut pas financer de nouveaux trades via le ledger ; environ 30 % reste compoundable. Objectif : éviter la spirale « gains → levier → drawdown ». »,

  guardian:
    « Le Guardian (couche risque) s’exécute avant le moteur de trading. Il peut refuser un size-up si le levier, le drawdown ou l’intensité de compound dépassent les seuils. Toujours « Guardian before Brain ». »,

  oracle:
    « Les prix EGLD et tokens viennent surtout de l’indexeur MultiversX (économie réseau + tokens, reflétant l’activité DEX on-chain), avec références secondaires. xArtists n’a pas déployé d’oracle Chainlink dédié. Ne pas trader live sur une seule source périmée. »,

  dao_readonly:
    « L’onglet DAO affiche informations $TRO et gouvernance en lecture. Le vote on-chain n’est pas simulé : aucun message « Vote envoyé » tant que la signature sdk-dapp et le contrat de vote ne sont pas branchés de façon fiable. »,

  studio:
    « Le Studio guide l’artiste : métadonnées, pin IPFS (Pinata), préparation au mint. Le mint on-chain automatique dépend du minter / commandes mxpy et d’une signature wallet utilisateur — pas du wallet LIA protocole. »,

  bid_offer:
    « Les enchères (placeBid / acceptBid / withdrawBid) nécessitent un marketplace redéployé avec ces endpoints. « Offer » type escrow n’a pas encore d’endpoint dédié : ne pas saisir d’identifiant de listing inventé. »,

  portfolio_scenarios:
    « Les projections sur 365 jours (différents taux de trades gagnants) sont purement illustratives. Hypothèses fixes (ex. taille de trade, +1 % / −0,8 %). Ce n’est ni un historique audité ni une promesse de rendement. »,

  hatom:
    « Hatom est un protocole de lending / yield sur MultiversX. Un health factor affiché à 999 signifie en pratique « non disponible » ou absence de position emprunt — ce n’est pas un score de performance maximal. »,

  editions:
    « xArtists Editions est une lettre mensuelle (art, culture, technologie, édito vision). Abonnement éditorial : ce n’est pas un produit financier ni un staking. »,

  ads:
    « L’espace publicitaire fonctionne par enchères sur quelques emplacements premium (opt-in, slots limités). Les revenus visent la treasury mission. Ce n’est pas un investissement ni un tip confondu avec un placement. »,

  soul:
    « Soul / preuves zk sont marqués expérimentaux (souvent testnet). Aucun transfert automatique de fonds utilisateurs via bridge expérimental. Zone isolée dans la navigation. »,

  /* ——— Actions / boutons ——— */
  connect_wallet:
    « Utilise l’extension MultiversX ou le Web Wallet pour une vraie session de signature. Coller une adresse erd1 sans session ne permet pas de signer List / Buy. Évite le wallet LIA protocole comme session utilisateur. »,

  list_nft:
    « Lister un NFT envoie une transaction vers le smart contract marketplace (si live). Sans codeHash valide, le bouton reste désactivé. Les frais de listing éventuels sont indiqués dans la config produit. »,

  buy_nft:
    « Acheter paie le prix affiché (+ structure de fees du SC). Le NFT est transféré selon la logique du contrat. Impossible tant que le marketplace n’est pas déployé et vérifié. »,

  buy_agent:
    « L’achat d’un pack agent (sous-agent Vellum) dépend du SC agents-marketplace. Après paiement on-chain prévu : accès limité (clé API / slot), éventuel badge NFT, reçu — pas la propriété de LIA protocole. »,

  tip_protocol:
    « Un tip est un don volontaire vers le protocole ou la mission artistique. Ce n’est pas un ticket d’investissement, ni une part de la performance LIA. »,

  burn_tro:
    « Un mécanisme de burn $TRO sur vente (ex. 1 % documenté) n’est actif on-chain que lorsque le marketplace live l’implémente. Jusque-là, toute mention de burn est policy produit, pas exécution garantie. »,

  treasury_split:
    « La policy prévoit de répartir fees, tips et PnL live entre Mission, Reserve, Ops et incentives. Mission et Reserve doivent d’abord exister comme wallets publics ; aujourd’hui beaucoup reste concentré sur LIA ops. »,

  micro_trade:
    « Un micro-trade peut être ignoré si le gain attendu net (après frais et gaz) est trop faible. LIA évite de brûler du gaz pour un edge négatif. »,

  defense_mode:
    « Mode DEFENSE / RISK_OFF : pas de nouveau BUY. Activé notamment si régime GSN risk-off, fear & greed très bas, ou drawdown élevé. Capital préservé en priorité. »,

  ipfs_pinata:
    « Les médias (image, vidéo, audio) destinés à un NFT durable doivent être épinglés (IPFS Pinata / équivalent). Une vidéo YouTube seule n’est pas un stockage on-chain permanent. »,

  phygital:
    « Œuvre phygital : lien entre NFT et objet physique. Le verrouillage physique peut être un flag métadonnées ; le blocage d’achat on-chain dépend du design escrow / marketplace. »,
} as const

export type HelpKey = keyof typeof HELP

/** Guides d’en-tête par route */
export const PAGE_GUIDE: Record<
  string,
  { title: string; body: string; tips?: HelpKey[] }
> = {
  dashboard: {
    title: 'Dashboard protocole',
    body: 'Tableau de bord LIA ops : soldes, réputation, packs Vellum, statut risque. Ce n’est pas le portefeuille de l’utilisateur connecté.',
    tips: ['lia_vs_user', 'sc_pending', 'live_trading', 'tro_token'],
  },
  wallet: {
    title: 'Mon wallet',
    body: 'Soldes et tokens de l’adresse que tu as connectée. Pour la trésorerie et le book LIA, ouvre Portfolio protocole.',
    tips: ['lia_vs_user', 'connect_wallet', 'hatom'],
  },
  portfolio: {
    title: 'Portfolio LIA (protocole)',
    body: 'Vue trésorerie / positions du protocole (MultiversX + multi-chain visible). Les scénarios de rendement sont paper et illustratifs.',
    tips: ['lia_vs_user', 'portfolio_scenarios', 'oracle', 'treasury_split'],
  },
  trading: {
    title: 'Trading & Board LIA',
    body: 'Modes de marché, board, analyses et paper trades. L’exécution live reste coupée tant que les gates sécurité ne sont pas validées.',
    tips: ['live_trading', 'guardian', 'profit_lock', 'defense_mode', 'gsn_vs_packs', 'micro_trade'],
  },
  marketplace: {
    title: 'Marketplace NFT',
    body: 'Achat, vente et enchères d’œuvres. Les actions on-chain s’activent seulement après deploy et codeHash du contrat marketplace.',
    tips: ['sc_pending', 'fees_3pct', 'bid_offer', 'list_nft', 'buy_nft'],
  },
  agents: {
    title: 'Agents & packs LIA',
    body: 'Sous-agents Vellum commercialisés (packs limités). Distinct des agents GreenSmoke de prévision affichés pour le scoring.',
    tips: ['gsn_vs_packs', 'sc_pending', 'buy_agent'],
  },
  gallery: {
    title: 'Galerie xArtists',
    body: 'Catalogue des collections et NFT. Consultation libre ; la galerie n’est pas intitulée au nom d’un artiste unique.',
    tips: ['studio', 'phygital'],
  },
  studio: {
    title: 'Studio artiste',
    body: 'Parcours pour publier une œuvre : fichiers, métadonnées, pin IPFS, préparation mint. Signature avec ton wallet, pas LIA ops.',
    tips: ['studio', 'ipfs_pinata', 'sc_pending', 'connect_wallet'],
  },
  dao: {
    title: 'DAO $TRO',
    body: 'Informations de gouvernance et du token. Lecture seule tant que le vote on-chain n’est pas branché sans ambiguïté.',
    tips: ['dao_readonly', 'tro_token', 'treasury_split'],
  },
  tro: {
    title: 'Token $TRO',
    body: 'Fiche utilitaire $TRO : identité on-chain, plafond 500 000, liens explorer / swap. Pas un prospectus de fonds.',
    tips: ['tro_token', 'burn_tro', 'oracle'],
  },
  tip: {
    title: 'Tip / soutenir',
    body: 'Envoi volontaire pour soutenir le protocole ou la mission artistique. Aucun rendement en contrepartie contractuelle.',
    tips: ['tip_protocol', 'lia_vs_user'],
  },
  hatom: {
    title: 'Hatom / yield',
    body: 'Contexte lending et yield MultiversX (positions, HF). LIA peut utiliser Hatom en mode YIELD paper ou live selon flags.',
    tips: ['hatom', 'live_trading', 'oracle'],
  },
  ads: {
    title: 'Espace publicitaire',
    body: 'Enchères pour des emplacements limités sur la dApp. Opt-in, modération, revenus orientés mission — pas un produit d’investissement.',
    tips: ['ads', 'treasury_split'],
  },
  editions: {
    title: 'xArtists Editions',
    body: 'Lettre mensuelle art × culture × technologie et vision xArtists. Contenu éditorial uniquement.',
    tips: ['editions'],
  },
  soul: {
    title: 'Soul (expérimental)',
    body: 'Module isolé (zk / testnet). Aucune promesse mainnet ni bridge automatique de fonds utilisateurs.',
    tips: ['soul'],
  },
  burnify: {
    title: 'Burnify (expérimental)',
    body: 'Zone expérimentale liée aux mécanismes de burn. Vérifier toujours le statut on-chain avant d’envoyer des tokens.',
    tips: ['burn_tro', 'soul'],
  },
}

/** Textes courts pour boutons désactivés */
export const DISABLED_REASON = {
  no_sc: 'Smart contract non déployé ou codeHash non vérifié.',
  no_wallet: 'Connecte un wallet signant (extension ou Web Wallet).',
  lia_ops_blocked: 'Le wallet protocole LIA ne doit pas être utilisé comme session acheteur.',
  no_listing_id: 'Identifiant de listing manquant — index on-chain pas encore complet.',
  paper_only: 'Action paper uniquement (LIA_LIVE_TRADING=0).',
  dao_vote_off: 'Vote on-chain non activé — lecture seule.',
} as const
