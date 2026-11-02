/**
 * TRO cross-chain transparency API (read-only).
 * No Solana mint is attested and NO live bridge exists in xArtists.
 * Untrusted environment variables MUST NOT make this endpoint claim live.
 */
export const TRO_ORIGIN_ID = 'TRO-94c925'
export const TRO_SOURCE_EXPLORER =
  'https://explorer.multiversx.com/tokens/' + TRO_ORIGIN_ID

export function troBridgeStatus() {
  return {
    ok: true,
    asset: '$TRO',
    source: { chain: 'multiversx-mainnet', tokenIdentifier: TRO_ORIGIN_ID,
      explorerUrl: TRO_SOURCE_EXPLORER, confirmation: 'project_configured_identifier' },
    destination: { chain: 'solana-mainnet-beta', mintAddress: null,
      status: 'not_deployed_or_not_verified' },
    bridge: { status: 'disabled', directions: [], quoteAvailable: false,
      transferAvailable: false, custodyEstablished: false,
      auditComplete: false, proofVerified: false, relayerActive: false },
    sale: { directSaleLive: false, paymentAddress: null, orderEndpoint: null,
      price: null, currency: null, rateIsGuaranteed: false },
    prerequisites: [
      'independently verify original TRO issuer, supply and decimals on MultiversX',
      'choose audited MultiversX-Solana interoperability / escrow and multisig governance',
      'independently attest SPL mint, mint authority, decimals, Solana program and finality',
      'deploy and audit escrow or canonical burn-mint controls, replay protection and pause switch',
      'publish supply accounting and independent monitoring before enabling deposits',
      'complete legal, treasury, pricing and consumer-sale compliance checks',
    ],
    noTransferInstructions: true,
  }
}
