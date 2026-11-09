/** Read-only MultiversX mainnet VM getPackPrice, no signing. */
export function getFreshPackPriceAtomic(
  scAddress: string,
  packEnum: number,
  request?: typeof fetch
): Promise<string>

/** Throws if the precise on-chain value differs from approved user-facing catalogue. */
export function requireExactPackQuoteAgreement(
  chainAtomic: string,
  catalogEgldText: string
): string
