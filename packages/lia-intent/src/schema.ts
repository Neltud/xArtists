import { bech32 } from 'bech32'
import { z } from 'zod'

export const IntentTypeSchema = z.enum([
  'BUY_PACK', 'MINT_NFT', 'SWAP', 'STAKE', 'BRIDGE',
  'ESCROW_CREATE', 'ESCROW_RELEASE', 'TRANSFER', 'QUERY_STATUS', 'UNKNOWN',
])
export const PackTierSchema = z.enum(['pulse', 'yield', 'sentinel'])
export const PaymentRailSchema = z.enum(['eur_paybox', 'egld_multiversx'])
export const AddressSchema = z.string().regex(/^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/).refine(value => {
  try {
    const decoded = bech32.decode(value)
    return decoded.prefix === 'erd' && bech32.fromWords(decoded.words).length === 32
  } catch { return false }
}, 'Invalid MultiversX bech32 checksum or payload')
export const AtomicAmountSchema = z.string().regex(/^(0|[1-9]\d{0,77})$/)
const amount = z.string().regex(/^(0|[1-9]\d{0,17})(\.\d{1,18})?$/)
  .refine(value => /[1-9]/.test(value), 'Amount must be positive')
const fiatAmount = z.string().regex(/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/)
  .refine(value => /[1-9]/.test(value), 'Amount must be positive')
const asset = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/)
const reference = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/)
const slippage = z.number().int().min(0).max(500)
const deadline = z.number().int().nonnegative().safe()
const base = { confidence: z.number().finite().min(0).max(1) }

// Extraction candidates are incomplete by design. They never grant execution permission.
// Every object is strict: model-supplied signatures, actions and mode switches are rejected.
export const CandidateSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...base, type: z.literal('BUY_PACK'), slots: z.strictObject({
    packTier: PackTierSchema.optional(), amount: fiatAmount.optional(),
    currency: z.literal('EUR').optional(), recipient: AddressSchema.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('MINT_NFT'), slots: z.strictObject({
    collection: asset.optional(), recipient: AddressSchema.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('SWAP'), slots: z.strictObject({
    amount: amount.optional(), tokenIn: asset.optional(), tokenOut: asset.optional(),
    maxSlippageBps: slippage.optional(), deadline: deadline.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('STAKE'), slots: z.strictObject({
    amount: amount.optional(), tokenIn: asset.optional(), provider: reference.optional(),
    deadline: deadline.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('BRIDGE'), slots: z.strictObject({
    amount: amount.optional(), tokenIn: asset.optional(), tokenOut: asset.optional(),
    destinationChain: z.enum(['multiversx', 'ethereum', 'polygon', 'solana', 'bnb']).optional(),
    recipient: reference.optional(), maxSlippageBps: slippage.optional(), deadline: deadline.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('ESCROW_CREATE'), slots: z.strictObject({
    amount: amount.optional(), tokenIn: asset.optional(), recipient: AddressSchema.optional(),
    assetId: reference.optional(), deadline: deadline.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('ESCROW_RELEASE'), slots: z.strictObject({
    escrowId: reference.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('TRANSFER'), slots: z.strictObject({
    amount: amount.optional(), tokenIn: asset.optional(), recipient: AddressSchema.optional(),
    deadline: deadline.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('QUERY_STATUS'), slots: z.strictObject({
    mandateId: z.uuid().optional(), orderId: reference.optional(),
  }) }),
  z.strictObject({ ...base, type: z.literal('UNKNOWN'), slots: z.strictObject({}) }),
])

// Actor is supplied by the authenticated host, separately from the request body.
export const ActorSchema = z.strictObject({ userAddress: AddressSchema })
export const CommandRequestSchema = z.strictObject({
  raw: z.string().trim().min(1).max(2000),
  paymentRail: PaymentRailSchema.optional(),
})
export const ConfirmationSchema = z.strictObject({
  mandateId: z.uuid(), digest: z.string().regex(/^[a-f0-9]{64}$/),
})
export const CatalogueSchema = z.strictObject({
  pulse: z.number().int().positive().max(50_000_000),
  yield: z.number().int().positive().max(50_000_000),
  sentinel: z.number().int().positive().max(50_000_000),
})

const ms = z.number().int().nonnegative().safe()
export const QuoteSnapshotSchema = z.strictObject({
  schema: z.literal('xartists.lia.quote.v1'), id: z.uuid(), userAddress: AddressSchema,
  packTier: PackTierSchema, paymentRail: PaymentRailSchema,
  amountCents: z.number().int().positive().safe(),
  payment: z.strictObject({ asset: z.enum(['EUR', 'EGLD']), decimals: z.union([z.literal(2), z.literal(18)]), amountAtomic: AtomicAmountSchema }),
  cryptoAmountAtomic: AtomicAmountSchema, rateEurPerEgld: z.string().regex(/^[0-9]+(\.[0-9]{1,12})?$/),
  marginBpsInternal: z.literal(400), issuedAtMs: ms, expiresAtMs: ms,
  balanceStatus: z.literal('not_checked'),
}).refine(q => q.expiresAtMs > q.issuedAtMs && q.expiresAtMs - q.issuedAtMs <= 30_000,
  'LIA quotes must expire within 30 seconds')
  .refine(q => BigInt(q.cryptoAmountAtomic) > 0n && (q.paymentRail === 'eur_paybox'
    ? q.payment.asset === 'EUR' && q.payment.decimals === 2 && q.payment.amountAtomic === String(q.amountCents)
    : q.payment.asset === 'EGLD' && q.payment.decimals === 18 && q.payment.amountAtomic === q.cryptoAmountAtomic),
  'Payment asset, precision and amount must match the selected rail')

export const PaperMandateSchema = z.strictObject({
  schema: z.literal('xartists.lia.paper_mandate.v1'), id: z.uuid(),
  mode: z.literal('paper'), authorization: z.literal('none'), requiresConfirmation: z.literal(true),
  userAddress: AddressSchema, network: z.literal('multiversx-mainnet'),
  action: z.literal('BUY_PACK'), packTier: PackTierSchema, recipient: AddressSchema,
  quantity: z.literal(1), catalogueDigest: z.string().regex(/^[a-f0-9]{64}$/),
  rawDigest: z.string().regex(/^[a-f0-9]{64}$/), quote: QuoteSnapshotSchema,
  issuedAtMs: ms, expiresAtMs: ms,
}).refine(m => m.userAddress === m.recipient && m.userAddress === m.quote.userAddress &&
  m.packTier === m.quote.packTier && m.expiresAtMs === m.quote.expiresAtMs &&
  m.issuedAtMs === m.quote.issuedAtMs, 'Mandate and quote scope mismatch')

export const StepActionSchema = z.enum(['CREATE_ORDER', 'VERIFY_PAYMENT', 'REQUEST_DELIVERY', 'VERIFY_DELIVERY'])
export const PaperPlanSchema = z.strictObject({
  mandateId: z.uuid(), mode: z.literal('paper'),
  estimatedGas: z.null(), gasStatus: z.literal('not_quoted'),
  steps: z.array(z.strictObject({ id: z.string(), action: StepActionSchema, status: z.literal('pending') })).length(4),
})
export const PaperReceiptSchema = z.strictObject({
  schema: z.literal('xartists.lia.paper_receipt.v1'), mandateId: z.uuid(),
  digest: z.string().regex(/^[a-f0-9]{64}$/), mode: z.literal('paper'), status: z.literal('simulated'),
  paymentVerified: z.literal(false), deliveryVerified: z.literal(false),
  chainStatus: z.literal('not_submitted'), simulatedAtMs: ms,
  steps: z.array(z.strictObject({ id: z.string(), action: StepActionSchema, status: z.literal('simulated') })).length(4),
})

export type IntentType = z.infer<typeof IntentTypeSchema>
export type Candidate = z.infer<typeof CandidateSchema>
export type PackTier = z.infer<typeof PackTierSchema>
export type PaymentRail = z.infer<typeof PaymentRailSchema>
export type Actor = z.infer<typeof ActorSchema>
export type Catalogue = z.infer<typeof CatalogueSchema>
export type QuoteSnapshot = z.infer<typeof QuoteSnapshotSchema>
export type PaperMandate = z.infer<typeof PaperMandateSchema>
export type PaperPlan = z.infer<typeof PaperPlanSchema>
export type PaperReceipt = z.infer<typeof PaperReceiptSchema>
