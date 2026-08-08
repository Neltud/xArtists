/**
 * Textes des bulles d'info (InfoTip) + guides de page (PageGuide).
 * Regle : honnete, pas de SC live fictif, pas de confusion LIA / user.
 */

export const HELP = {
  lia_vs_user:
    "LIA designe le wallet protocole (ops, paper trading, tresorerie affichee). Ton portefeuille personnel n'apparait que sur Mon wallet apres Connect (extension / Web Wallet). Ne jamais envoyer de fonds perso en pensant alimenter LIA, ni l'inverse.",

  sc_pending:
    "Les smart contracts nft-marketplace et agents-marketplace ne sont considers live qu'apres deploiement mainnet et verification du codeHash. Tant que le bandeau amber est visible, List / Buy / Bid on-chain restent volontairement bloques pour eviter de fausses transactions.",

  live_trading:
    "Flag LIA_LIVE_TRADING = 0 par defaut : LIA ne signe pas de trades reels. Boards, series et scenarios sont en mode paper jusqu'a preuve de micro-trades et signature utilisateur validees. Aucune promesse de performance.",

  tro_token:
    "$TRO (identifiant ESDT TRO-94c925, nom TUDURIORIGINAL) est le token d'utilite et de culture xArtists. Plafond produit : 500 000 TRO. Illiquide a ce stade : ce n'est ni une part de fonds d'investissement, ni un rendement promis, ni un equivalent cash de la treasury.",

  fees_3pct:
    "Une fois le marketplace deploye avec FEE_BPS = 300, chaque achat preleve 3 % de frais : 97 % partent au vendeur, 3 % restent sur le contrat jusqu'a claimFees (owner). Le detail du split fondation (Mission / Reserve / Ops) est decrit dans la policy treasury.",

  gsn_vs_packs:
    "GreenSmoke (GSN) : agents de prevision utilises pour scorer le marche avant decision LIA. Packs LIA : sous-agents Vellum limites, vendus separement (cible tarifaire 5-25 EUR). Ce sont deux produits distincts — ne pas les confondre dans l'UI ni dans le pricing.",

  profit_lock:
    "Sur un gain net realise, environ 70 % est verrouille (locked) et ne peut pas financer de nouveaux trades via le ledger ; environ 30 % reste compoundable. Objectif : eviter la spirale gains -> levier -> drawdown.",

  guardian:
    "Le Guardian (couche risque) s'execute avant le moteur de trading. Il peut refuser un size-up si le levier, le drawdown ou l'intensite de compound depassent les seuils. Toujours Guardian before Brain.",

  oracle:
    "Les prix EGLD et tokens viennent surtout de l'indexeur MultiversX (economie reseau + tokens, refletant l'activite DEX on-chain), avec references secondaires. xArtists n'a pas deploye d'oracle Chainlink dedie. Ne pas trader live sur une seule source perimee.",

  dao_readonly:
    "L'onglet DAO affiche informations $TRO et gouvernance en lecture. Le vote on-chain n'est pas simule : aucun message Vote envoye tant que la signature sdk-dapp et le contrat de vote ne sont pas branches de facon fiable.",

  studio:
    "Le Studio guide l'artiste : metadonnees, pin IPFS (Pinata), preparation au mint. Le mint on-chain automatique depend du minter / commandes mxpy et d'une signature wallet utilisateur — pas du wallet LIA protocole.",

  bid_offer:
    "Les encheres (placeBid / acceptBid / withdrawBid) necessitent un marketplace redeploye avec ces endpoints. Offer type escrow n'a pas encore d'endpoint dedie : ne pas saisir d'identifiant de listing invente.",

  portfolio_scenarios:
    "Les projections sur 365 jours (differents taux de trades gagnants) sont purement illustratives. Hypotheses fixes (ex. taille de trade, +1 % / -0,8 %). Ce n'est ni un historique audite ni une promesse de rendement.",

  hatom:
    "Hatom est un protocole de lending / yield sur MultiversX. Un health factor affiche a 999 signifie en pratique non disponible ou absence de position emprunt — ce n'est pas un score de performance maximal.",

  editions:
    "xArtists Editions est une lettre mensuelle (art, culture, technologie, edito vision). Abonnement editorial : ce n'est pas un produit financier ni un staking.",

  ads:
    "L'espace publicitaire fonctionne par encheres sur quelques emplacements premium (opt-in, slots limites). Les revenus visent la treasury mission. Ce n'est pas un investissement ni un tip confondu avec un placement.",

  soul:
    "Soul / preuves zk sont marques experimentaux (souvent testnet). Aucun transfert automatique de fonds utilisateurs via bridge experimental. Zone isolee dans la navigation.",

  connect_wallet:
    "Utilise l'extension MultiversX ou le Web Wallet pour une vraie session de signature. Coller une adresse erd1 sans session ne permet pas de signer List / Buy. Evite le wallet LIA protocole comme session utilisateur.",

  list_nft:
    "Lister un NFT envoie une transaction vers le smart contract marketplace (si live). Sans codeHash valide, le bouton reste desactive. Les frais de listing eventuels sont indiques dans la config produit.",

  buy_nft:
    "Acheter paie le prix affiche (+ structure de fees du SC). Le NFT est transfere selon la logique du contrat. Impossible tant que le marketplace n'est pas deploye et verifie.",

  buy_agent:
    "L'achat d'un pack agent (sous-agent Vellum) depend du SC agents-marketplace. Apres paiement on-chain prevu : acces limite (cle API / slot), eventuel badge NFT, recu — pas la propriete de LIA protocole.",

  tip_protocol:
    "Un tip est un don volontaire vers le protocole ou la mission artistique. Ce n'est pas un ticket d'investissement, ni une part de la performance LIA.",

  burn_tro:
    "Un mecanisme de burn $TRO sur vente (ex. 1 % documente) n'est actif on-chain que lorsque le marketplace live l'implemente. Jusque-la, toute mention de burn est policy produit, pas execution garantie.",

  treasury_split:
    "La policy prevoit de repartir fees, tips et PnL live entre Mission, Reserve, Ops et incentives. Mission et Reserve doivent d'abord exister comme wallets publics ; aujourd'hui beaucoup reste concentre sur LIA ops.",

  micro_trade:
    "Un micro-trade peut etre ignore si le gain attendu net (apres frais et gaz) est trop faible. LIA evite de bruler du gaz pour un edge negatif.",

  defense_mode:
    "Mode DEFENSE / RISK_OFF : pas de nouveau BUY. Active notamment si regime GSN risk-off, fear & greed tres bas, ou drawdown eleve. Capital preserve en priorite.",

  ipfs_pinata:
    "Les medias (image, video, audio) destines a un NFT durable doivent etre epingles (IPFS Pinata / equivalent). Une video YouTube seule n'est pas un stockage on-chain permanent.",

  phygital:
    "Oeuvre phygital : lien entre NFT et objet physique. Le verrouillage physique peut etre un flag metadonnees ; le blocage d'achat on-chain depend du design escrow / marketplace.",
} as const

export type HelpKey = keyof typeof HELP

export const PAGE_GUIDE: Record<
  string,
  { title: string; body: string; tips?: HelpKey[] }
> = {
  dashboard: {
    title: 'Dashboard protocole',
    body: 'Tableau de bord LIA ops : soldes, reputation, packs Vellum, statut risque. Ce n\'est pas le portefeuille de l\'utilisateur connecte.',
    tips: ['lia_vs_user', 'sc_pending', 'live_trading', 'tro_token'],
  },
  wallet: {
    title: 'Mon wallet',
    body: 'Soldes et tokens de l\'adresse que tu as connectee. Pour la tresorerie et le book LIA, ouvre Portfolio protocole.',
    tips: ['lia_vs_user', 'connect_wallet', 'hatom'],
  },
  portfolio: {
    title: 'Portfolio LIA (protocole)',
    body: 'Vue tresorerie / positions du protocole (MultiversX + multi-chain visible). Les scenarios de rendement sont paper et illustratifs.',
    tips: ['lia_vs_user', 'portfolio_scenarios', 'oracle', 'treasury_split'],
  },
  trading: {
    title: 'Trading & Board LIA',
    body: 'Modes de marche, board, analyses et paper trades. L\'execution live reste coupee tant que les gates securite ne sont pas validees.',
    tips: ['live_trading', 'guardian', 'profit_lock', 'defense_mode', 'gsn_vs_packs', 'micro_trade'],
  },
  marketplace: {
    title: 'Marketplace NFT',
    body: 'Achat, vente et encheres d\'oeuvres. Les actions on-chain s\'activent seulement apres deploy et codeHash du contrat marketplace.',
    tips: ['sc_pending', 'fees_3pct', 'bid_offer', 'list_nft', 'buy_nft'],
  },
  agents: {
    title: 'Agents & packs LIA',
    body: 'Sous-agents Vellum commercialises (packs limites). Distinct des agents GreenSmoke de prevision affiches pour le scoring.',
    tips: ['gsn_vs_packs', 'sc_pending', 'buy_agent'],
  },
  gallery: {
    title: 'Galerie xArtists',
    body: 'Catalogue des collections et NFT. Consultation libre ; la galerie n\'est pas intitulee au nom d\'un artiste unique.',
    tips: ['studio', 'phygital'],
  },
  studio: {
    title: 'Studio artiste',
    body: 'Parcours pour publier une oeuvre : fichiers, metadonnees, pin IPFS, preparation mint. Signature avec ton wallet, pas LIA ops.',
    tips: ['studio', 'ipfs_pinata', 'sc_pending', 'connect_wallet'],
  },
  dao: {
    title: 'DAO $TRO',
    body: 'Informations de gouvernance et du token. Lecture seule tant que le vote on-chain n\'est pas branche sans ambiguite.',
    tips: ['dao_readonly', 'tro_token', 'treasury_split'],
  },
  tro: {
    title: 'Token $TRO',
    body: 'Fiche utilitaire $TRO : identite on-chain, plafond 500 000, liens explorer / swap. Pas un prospectus de fonds.',
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
    body: 'Encheres pour des emplacements limites sur la dApp. Opt-in, moderation, revenus orientes mission — pas un produit d\'investissement.',
    tips: ['ads', 'treasury_split'],
  },
  editions: {
    title: 'xArtists Editions',
    body: 'Lettre mensuelle art x culture x technologie et vision xArtists. Contenu editorial uniquement.',
    tips: ['editions'],
  },
  soul: {
    title: 'Soul (experimental)',
    body: 'Module isole (zk / testnet). Aucune promesse mainnet ni bridge automatique de fonds utilisateurs.',
    tips: ['soul'],
  },
  burnify: {
    title: 'Burnify (experimental)',
    body: 'Zone experimentale liee aux mecanismes de burn. Verifier toujours le statut on-chain avant d\'envoyer des tokens.',
    tips: ['burn_tro', 'soul'],
  },
}

export const DISABLED_REASON = {
  no_sc: 'Smart contract non deploye ou codeHash non verifie.',
  no_wallet: 'Connecte un wallet signant (extension ou Web Wallet).',
  lia_ops_blocked: 'Le wallet protocole LIA ne doit pas etre utilise comme session acheteur.',
  no_listing_id: 'Identifiant de listing manquant — index on-chain pas encore complet.',
  paper_only: 'Action paper uniquement (LIA_LIVE_TRADING=0).',
  dao_vote_off: 'Vote on-chain non active — lecture seule.',
} as const
