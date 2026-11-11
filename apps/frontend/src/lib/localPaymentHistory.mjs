/** Browser history is untrusted display data, never payment or ownership evidence. */
export function normalizeLocalPaymentIntent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const text = (input, fallback) => typeof input === 'string' && input.trim()
    ? input.slice(0, 160) : fallback
  const amount = typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount >= 0
    ? String(value.amount) : typeof value.amount === 'string' && /^\d{1,12}(?:\.\d{1,18})?$/.test(value.amount)
      ? value.amount : '—'
  return {
    packId: text(value.packId, 'Pack'),
    provider: text(value.provider, 'local'),
    currency: text(value.currency, 'EUR'),
    amount,
    ts: typeof value.ts === 'number' && Number.isFinite(value.ts) && value.ts > 0 &&
      value.ts <= 8640000000000000 ? value.ts : null,
    kind: 'Déclaration locale · non vérifiée',
  }
}
export function normalizeLocalPaymentLog(value) {
  return Array.isArray(value) ? value.slice(-100).map(normalizeLocalPaymentIntent).filter(Boolean) : []
}
