/**
 * Parse an EGLD amount exactly, without IEEE-754 Number/Math.round.
 * All fund-moving calls must pass the original decimal INPUT STRING.
 * Precision: 18 decimal places (1 EGLD = 10^18 wei).
 */
const DECIMAL = /^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,18})?$/

export function egldTextToWei(value) {
  if (typeof value !== 'string' || !DECIMAL.test(value)) {
    throw new Error('Prix EGLD invalide : saisissez un décimal positif (18 chiffres max après le point).')
  }
  const [whole, fraction = ''] = value.split('.')
  const amount = BigInt(whole) * (10n ** 18n) + BigInt((fraction + '0'.repeat(18)).slice(0, 18))
  if (amount <= 0n) throw new Error('Le montant EGLD doit être supérieur à zéro.')
  return amount.toString()
}
