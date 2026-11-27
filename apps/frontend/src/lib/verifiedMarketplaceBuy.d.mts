export type VerifiedMarketplaceQuote = Readonly<{
  listingId: number
  identifier: string
  title?: string
  image?: string|null
  priceAtomic: string
  priceEgld: string
  receiver: string
  sellerHex: string
  royaltyBps: number
  feeBps: number
  checkedAt: number
}>
export declare const VERIFIED_MARKET_SALE: Readonly<{
  marketplace: string
  codeHash: string
  listingId: number
  token: string
  nonce: number
  identifier: string
  maxPriceAtomic: string
}>
export declare function decodeMarketplaceListing(
  data: string, id: number,
): {id: number;token: string;nonce: number;priceAtomic: string;royaltyBps: number;active: boolean;sellerHex: string} | null
export declare function readVerifiedSale(options?: {request?: typeof fetch}): Promise<VerifiedMarketplaceQuote>
export declare function addressHex(address: string): string | null

export declare function listingIdHex(id:number):string
export declare function readVerifiedListing(id:number,options?:{request?:typeof fetch}):Promise<VerifiedMarketplaceQuote>
export declare function listingIdsFromEvents(transactions:unknown):number[]
export declare function readLiveMarketplaceListings(options?:{request?:typeof fetch;from?:number}):Promise<{listings:VerifiedMarketplaceQuote[];limited:boolean;nextFrom:number|null}>
