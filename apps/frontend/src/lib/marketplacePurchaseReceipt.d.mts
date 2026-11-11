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
