/** Guardian — Policy-as-Code (paper / ops). */

import type { GuardianVerdict, LiaIntent } from './types'
import { TRO_POLICY, decimalsForChain } from './constants'

const URGENCY = /\b(immédiat|urgent|maintenant|dep[eê]che|urgence)\b/i
const AUTHORITY = /\b(ceo|admin|support|bypass|ordonne)\b/i

export function evaluateIntent(intent: LiaIntent): GuardianVerdict {
  if (intent.sealed && intent.intent_type === 'UNKNOWN') {
    return { allowed: false, code: 'UNKNOWN_INTENT', message: 'Intention non résolue', risk_score: 0.2 }
  }

  if (AUTHORITY.test(intent.raw)) {
    return {
      allowed: false,
      code: 'AUTHORITY_SPOOF',
      message: 'Seule une signature wallet valide une commande.',
      risk_score: 0.9,
    }
  }

  const decimals = decimalsForChain(intent.chain)
  if (intent.decimals !== decimals) {
    return {
      allowed: false,
      code: 'DECIMAL_MISMATCH',
      message: `Attendu ${decimals} décimales pour ${intent.chain}`,
      risk_score: 0.95,
    }
  }

  try {
    const atomic = BigInt(intent.amount_atomic || '0')
    const threshold =
      BigInt(TRO_POLICY.HUMAN_APPROVAL_THRESHOLD_TRO) * 10n ** BigInt(decimals)
    if (atomic > threshold && !intent.requires_human_approval) {
      return {
        allowed: false,
        code: 'HUMAN_APPROVAL_REQUIRED',
        message: `Montant > ${TRO_POLICY.HUMAN_APPROVAL_THRESHOLD_TRO} TRO — validation humaine.`,
        risk_score: 0.7,
      }
    }
  } catch {
    return { allowed: false, code: 'BAD_AMOUNT', message: 'amount_atomic invalide', risk_score: 0.8 }
  }

  if (URGENCY.test(intent.raw)) {
    return {
      allowed: true,
      code: 'URGENCY_IGNORED',
      message: 'Urgence ignorée — règles inchangées.',
      risk_score: 0.3,
    }
  }

  return { allowed: true, code: 'OK', message: 'Guardian pass', risk_score: 0.1 }
}
