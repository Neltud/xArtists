export type MarketplaceReceiptStatus =
  | 'invalid' | 'unavailable' | 'pending' | 'failed'
  | 'mismatch' | 'delivery_unverified' | 'verified'
export type MarketplaceReceiptResult = Readonly<{
  status: MarketplaceReceiptStatus
  hash?: string
}>
export declare function verifyMarketplacePurchaseReceipt(args?: {
  hash?: string
  address?: string
  request?: typeof fetch
}): Promise<MarketplaceReceiptResult>

export declare function verifyLiveListingReceipt(options:{hash:string;address:string;quote:import('./verifiedMarketplaceBuy.mjs').VerifiedMarketplaceQuote;request?:typeof fetch}):Promise<{status:MarketplaceReceiptStatus;hash?:string}>

export declare function verifySellerListingReceipt(options:{hash:string;address:string;identifier:string;priceAtomic:string;request?:typeof fetch}):Promise<MarketplaceReceiptResult & {listingId?:number}>
