export type ArtVariant = { value: string; weight: number }
export type ArtLayer = { name: string; variants: ArtVariant[] }
export type CreatorType = 'human_artist' | 'ai_agent'
export type ArtMetadata = {
  edition: number
  name: string
  description: string
  image: null
  animation_url: null
  attributes: { trait_type: string; value: string }[]
  xartists: {
    collection_type: 'creator_artwork'
    generator_schema: number
    plan_digest: string
    media_state: 'not_generated_or_uploaded'
    mint_state: 'not_minted'
    rights_confirmed_by_creator: boolean
  }
}
export type ArtPlanInput = {
  title: string
  description: string
  quantity: number
  seed: string
  mode: 'template' | 'layers'
  template?: 'chromatic' | 'botanical' | 'monochrome'
  layers?: ArtLayer[]
  creatorType?: CreatorType
  artistAddress?: string
  agentId?: string
  rightsConfirmed?: boolean
  overrides?: Record<string, {
    name?: string
    description?: string
    extraAttributes?: { trait_type: string; value: string }[]
  }>
}
export type ArtCollectionDraft = {
  schemaVersion: number
  mode: 'template' | 'layers'
  template: string | null
  creatorType: CreatorType
  agentId: string | null
  artistAddress: string | null
  title: string
  quantity: number
  layers: ArtLayer[]
  planDigest: string
  editions: ArtMetadata[]
  generationProvider: null
  aiImagesGenerated: 0
  imageOutputReady: false
  artworkRightsVerified: false
  paymentStatus: 'disabled'
  priceQuote: null
  paperCreditsPerImage: number
  paperCreditsTotal: number
  paperCreditQuoteVersion: 'paper-1'
  creditsDebited: false
  moneyCharged: false
  storageReady: false
  mintEnabled: false
  distributorDeployEnabled: false
  status: 'PAPER_METADATA_DRAFT'
  blockers: string[]
}
export const ART_TEMPLATES: Readonly<Record<string, { label: string; layers: ArtLayer[] }>>
export function validateArtLayers(layers: ArtLayer[]): ArtLayer[]
export function validateEditionOverrides(overrides: ArtPlanInput['overrides'], quantity: number, layerNames: string[]): Record<string, unknown>
export function prepareArtCollection(input: ArtPlanInput): Promise<ArtCollectionDraft>
