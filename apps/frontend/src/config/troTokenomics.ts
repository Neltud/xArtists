/**
 * Cadre économique $TRO — paper + cibles on-chain (pas une promesse de performance).
 * Supply max 500_000 · burns déjà effectués hors dApp · emission contrôlée.
 */

export const TRO_TOKENOMICS = {
  ticker: 'TRO-94c925',
  maxSupply: 500_000,
  /** Burns historiques (approx. / à synchroniser explorer) — lecture seule */
  burnedApprox: null as number | null,
  utility: [
    'LP pools éligibles DAO (TRO/USDC, TRO/EGLD, …)',
    'Voting power = valeur LP TRO + ArtPass staked',
    'Accès packs / salle Pulse (paper puis NFT)',
    'Part des loyers d’expo + fees slot → holders via SC rewards',
  ],
  sinks: [
    'Burn part fees marketplace (quand SC ON)',
    'Burn optionnel à l’achat d’espace expo (policy)',
    'Buyback LIA discret depuis treasury (ops, non automatique dans le front)',
  ],
  sources: [
    'Pas d’inflation libre : emission seulement si governance + codeHash vérifié',
    'Revenus réels : packs paper, ads, location salles, tips, slot (EGLD/USDC)',
  ],
  buybackPolicy:
    'Buyback possible depuis treasury LIA (ops) — jamais présenté comme yield garanti. Paper-first jusqu’à GO_LIVE.',
  museumBuy:
    'Achat œuvre depuis musée → listing marketplace SC (OFF tant que codeHash absent) ; sinon deep-link Xoxno / paper intent.',
} as const
