/**
 * LIA Intent P0 — small STRUCTURED public type contract (not the old NLP core).
 * Runtime/QuoteGate lives in services/access-api/src/liaSimple.mjs and is
 * intentionally not a browser import or a signable mandate.
 */
export type PackTier = 'pulse' | 'yield' | 'sentinel'
export type SimpleIntent =
  | { type: 'BUY_PACK'; packTier: 'pulse'; amountEur: '110'; userAddress: string }
  | { type: 'BUY_PACK'; packTier: 'yield'; amountEur: '75'; userAddress: string }
  | { type: 'BUY_PACK'; packTier: 'sentinel'; amountEur: '50'; userAddress: string }

export type PaperPackQuote = {
  id: string
  packTier: PackTier
  asset: 'EUR'
  amountEur: '110' | '75' | '50'
  amountCents: number
  estimatedEgld: string
  rateEurPerEgld: string
  rule: 'Rule1'
  balanceChecked: false
  gasChecked: false
  payable: false
  issuedAtMs: number
  expiresAtMs: number
}

export type PreparedSimpleIntent = {
  ok: true
  status: 'ready'
  mode: 'paper'
  paperMode: true
  requiresConfirmation: true
  confirmationId: string
  quote: PaperPackQuote
  plan: {
    action: 'BUY_PACK'
    tier: PackTier
    quoteId: string
    mode: 'paper'
    recipient: string
    paymentSubmitted: false
    nftMinted: false
  }
}

export type SimplePaperReceipt = {
  ok: true
  status: 'paper_success'
  mode: 'paper'
  paperMode: true
  simulated: true
  auditId: string
  confirmationId: string
  quoteId: string
  packTier: PackTier
  paymentVerified: false
  deliveryVerified: false
  nftMinted: false
  chainStatus: 'not_submitted'
  txHash: null
  accessGranted: false
  amountChargedCents: 0
  replayed: boolean
}

export type SimpleIntentHttpRequest =
  | { action: 'prepare'; intent: SimpleIntent }
  | { action: 'confirm'; confirmationId: string }
  | { action: 'cancel'; confirmationId: string }

/**
 * P0 is forcibly paper-only; there is intentionally NO paperMode:false option,
 * no signed mandate, no free-text classifier and no live execution API.
 */
