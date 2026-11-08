/**
 * Public editorial readiness, NOT a payment/mint capability gate.
 * All module routes remain reachable. This is a conservative UX classification:
 * "browse" means read/visit only, never settlement or execution.
 * Unknown modules fail towards "roadmap" rather than pretending to be live.
 */
export type PublicStage = 'browse' | 'preview' | 'roadmap'
const publicStages: Record<string, PublicStage> = {
 app: 'browse',
 maison: 'browse',
 museum: 'browse',
 auction: 'preview',
 rwa: 'preview',
 market: 'browse',
 tours: 'preview',
 analytics: 'preview',
 editions: 'preview',
 venues: 'preview',
 studio: 'preview',
 'nft-factory': 'preview',
 twin: 'preview',
 academy: 'preview',
 ads: 'preview',
 lia: 'preview',
 agents: 'preview',
 command: 'preview',
 lightning: 'preview',
 simulation: 'preview',
 entities: 'preview',
 trading: 'roadmap',
 tro: 'browse',
 'tro-crosschain': 'browse',
 staking: 'roadmap',
 liquidity: 'roadmap',
 hatom: 'roadmap',
 burnify: 'roadmap',
 dao: 'preview',
 sale: 'roadmap',
 tip: 'preview',
 wallet: 'browse',
 portfolio: 'preview',
 packs: 'preview',
 identity: 'preview',
 payments: 'preview',
 history: 'preview',
 status: 'browse',
 legal: 'browse',
 guide: 'browse',
}

export const PUBLIC_STAGE_ORDER: PublicStage[] = ['browse', 'preview', 'roadmap']

export function publicStage(id: string): PublicStage {
 return publicStages[id] ?? 'roadmap'
}
export function stageRank(id: string): number {
 return PUBLIC_STAGE_ORDER.indexOf(publicStage(id))
}
export function readinessCounts(ids: string[]): Record<PublicStage, number> {
 return ids.reduce((totals, id) => {
   totals[publicStage(id)]++
   return totals
 }, {browse: 0, preview: 0, roadmap: 0} as Record<PublicStage, number>)
}

/** Ordered editorial roadmap; issues supply reviewable dependencies, NOT delivery dates. */
export const publicMilestones = [
 {id: 'mint', labelKey: 'roadmapMint', detailKey: 'roadmapMintDetail', issue: 281},
 {id: 'payments', labelKey: 'roadmapPayments', detailKey: 'roadmapPaymentsDetail', issue: 370},
 {id: 'market', labelKey: 'roadmapListings', detailKey: 'roadmapListingsDetail', issue: 428},
 {id: 'dao', labelKey: 'roadmapDao', detailKey: 'roadmapDaoDetail', issue: 393},
 // Cross-chain bridge is deliberately deferred until after MultiversX release 1.
 {id: 'lia', labelKey: 'roadmapLia', detailKey: 'roadmapLiaDetail', issue: 369},
] as const
