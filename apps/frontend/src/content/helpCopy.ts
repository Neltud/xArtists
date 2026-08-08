/**
 * Central explanatory copy for InfoTip / PageGuide.
 * Keep honest: no fake live SC, no LIA=user wallet confusion.
 */

export const HELP = {
  // Global concepts
  lia_vs_user:
    "LIA = wallet protocole (ops / paper trading). Ton wallet Connect = page Mon wallet uniquement. Ne confonds pas les deux.",
  sc_pending:
    "Les smart contracts marketplace / agents ne sont live qu’après deploy mainnet + codeHash vérifié. Sinon List/Buy restent bloqués — c’est volontaire.",
  live_trading:
    "LIA_LIVE_TRADING=0 : LIA ne signe pas de trades réels. Les boards et scénarios sont paper jusqu’aux micro-trades prouvés.",
  tro_token:
    "$TRO (TRO-94c925) est un token d’utilité / culture, supply max produit 500 000. Illiquide : ce n’est ni une part de fonds ni un yield promis.",
  fees_3pct:
    "Après deploy, le marketplace prélève fee_bps=300 (3 %). 97 % vont au vendeur ; 3 % restent sur le SC jusqu’à claimFees (owner).",
  gsn_vs_packs:
    "GreenSmoke = agents de prévision (scores). Packs LIA = sous-agents Vellum limités vendus à part. Ne pas confondre les deux.",
  profit_lock:
    "Sur un gain réalisé, ~70 % est « locked » (pas re-tradé) et ~30 % reste compoundable — anti spirale de levier.",
  guardian:
    "Le Guardian bloque size-up si levier / drawdown / compound trop agressifs (avant le cerveau de trading).",
  oracle:
    "Prix EGLD/tokens via indexeur MultiversX (activité DEX on-chain) + références secondaires. Pas de Chainlink xArtists dédié.",
  dao_readonly:
    "La DAO est en lecture tant que le vote on-chain n’est pas branché de façon fiable (évite un faux « Vote envoyé »).",
  studio:
    "Studio : préparer métadonnées, pin IPFS (Pinata), parcours mint. Le mint auto on-chain dépend du minter SC / mxpy.",
  bid_offer:
    "Bid on-chain nécessite redeploy nft-marketplace avec placeBid. Offer/escrow dédié pas encore d’endpoint — ne saisis pas d’ID fantôme.",
  portfolio_scenarios:
    "Les scénarios 365j sont illustratifs (hypothèses de win-rate). Ce n’est pas une performance passée ni une promesse.",
  hatom:
    "Hatom = yield / lending MultiversX. HF 999 = non disponible ou sans position — pas un score magique.",
  editions:
    "xArtists Editions : lettre mensuelle art / culture / tech. Abonnement éditorial, pas un produit financier.",
  ads:
    "Pub à enchères : emplacements limités, opt-in. Revenus → treasury mission (pas un investissement).",
  soul:
    "Soul / zk = expérimental (souvent testnet). Aucun fonds utilisateur en auto-bridge.",
} as const

export type HelpKey = keyof typeof HELP

/** Short page intros */
export const PAGE_GUIDE: Record<
  string,
  { title: string; body: string; tips?: HelpKey[] }
> = {
  dashboard: {
    title: "Dashboard protocole",
    body: "Vue LIA ops : soldes, réputation, packs. Ce n’est pas ton wallet personnel.",
    tips: ['lia_vs_user', 'sc_pending', 'live_trading'],
  },
  wallet: {
    title: "Mon wallet",
    body: "Soldes de l’adresse Connect uniquement. Portfolio LIA = autre page.",
    tips: ['lia_vs_user', 'hatom'],
  },
  portfolio: {
    title: "Portfolio LIA",
    body: "Trésorerie / book protocole (MVX + multi-chain). Scénarios = paper.",
    tips: ['lia_vs_user', 'portfolio_scenarios', 'oracle'],
  },
  trading: {
    title: "Trading & Board LIA",
    body: "Modes, board, paper trades. Exécution live désactivée par défaut.",
    tips: ['live_trading', 'guardian', 'profit_lock', 'gsn_vs_packs'],
  },
  marketplace: {
    title: "Marketplace NFT",
    body: "Liste, achat, enchères — actifs seulement si le SC est live (codeHash).",
    tips: ['sc_pending', 'fees_3pct', 'bid_offer'],
  },
  agents: {
    title: "Agents LIA",
    body: "Packs sous-agents Vellum (5–25 € cible). Distinct des prévisions GreenSmoke.",
    tips: ['gsn_vs_packs', 'sc_pending'],
  },
  gallery: {
    title: "Galerie xArtists",
    body: "Catalogue collections / NFT. Consultation sans wallet obligatoire.",
    tips: ['studio'],
  },
  studio: {
    title: "Studio artiste",
    body: "Créer, pinner IPFS, préparer mint. Signature wallet user requise pour TX.",
    tips: ['studio', 'sc_pending'],
  },
  dao: {
    title: "DAO $TRO",
    body: "Infos gouvernance et $TRO. Vote on-chain non simulé tant que non branché.",
    tips: ['dao_readonly', 'tro_token'],
  },
  tro: {
    title: "$TRO",
    body: "Token utilitaire xArtists. Cap 500 000. Voir docs/TRO.md.",
    tips: ['tro_token'],
  },
  tip: {
    title: "Tip / soutenir",
    body: "Don volontaire vers le protocole / mission — pas un investissement.",
    tips: ['lia_vs_user'],
  },
  hatom: {
    title: "Hatom",
    body: "Positions yield / lending liées au protocole ou à ton wallet selon contexte.",
    tips: ['hatom', 'live_trading'],
  },
  ads: {
    title: "Espace pub",
    body: "Enchères d’emplacements limités. Transparent, opt-in.",
    tips: ['ads'],
  },
  editions: {
    title: "Editions",
    body: "Newsletter art × culture × tech.",
    tips: ['editions'],
  },
  soul: {
    title: "Soul (expérimental)",
    body: "Zone isolée zk / testnet — pas de fonds users auto.",
    tips: ['soul'],
  },
}
