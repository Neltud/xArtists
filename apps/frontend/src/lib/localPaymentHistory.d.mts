export type LocalPaymentIntent = {
  packId: string
  provider: string
  currency: string
  amount: string
  ts: number | null
  kind: 'Déclaration locale · non vérifiée'
}
export function normalizeLocalPaymentIntent(value: unknown): LocalPaymentIntent | null
export function normalizeLocalPaymentLog(value: unknown): LocalPaymentIntent[]
