/** Types for the paper-only distributor module (not an on-chain SC SDK). */
export type DistributorMode = 'escrow_inventory' | 'lazy_mint'
export type DistributorInput = {
  title: string
  collectionId: string
  mode: DistributorMode
  fixedPriceEgld: string
  inventory?: string[]
  plannedSupply?: number
  metadataUris?: string[]
  artistAddress?: string
  rightsConfirmed?: boolean
  perWalletLimit?: number
}
export type DistributorDraft = {
  schemaVersion: 1
  title: string
  artistAddress: string | null
  collectionId: string
  mode: DistributorMode
  currency: 'EGLD'
  fixedPriceEgld: string
  fixedPriceWei: string
  supplyCap: number
  perWalletLimit: number
  nftInventory: readonly string[]
  metadataUris: readonly string[]
  rightsDeclared: boolean
  kind: 'creator_artwork_not_genesis_pack'
  status: 'PAPER_PREVIEW_ONLY'
  deployment: Readonly<{
    kind: 'dedicated_contract_per_creator'
    contractAddress: null
    deployed: false
    codeHashVerified: false
    creatorWalletSignatureRequired: true
  }>
  randomnessProofVerified: false
  paymentEnabled: false
  mintEnabled: false
  inventoryDepositsEnabled: false
  deliveryVerified: false
  blockers: readonly string[]
}
export type SimulatedDraw = {
  paperOnly: true
  onChainRandomnessVerified: false
  selectedNftId: string
  drawDigest: string
  itemsRemainingAfter: number
  currency: null
  paymentExecuted: false
  nftTransferred: false
  disclaimer: string
}
export function egldPriceToWei(value: string): string
export function normalizeCollectionId(value: string): string
export function normalizeNftInventory(collection: string, entries: string[]): string[]
export function preparePaperDistributor(input: DistributorInput): DistributorDraft
export function simulatePaperDraw(input: {
  collectionId: string
  inventory: string[]
  soldIds?: string[]
  seed: string
  drawNumber?: number
}): Promise<SimulatedDraw>
