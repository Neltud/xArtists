import type { LiaIntent } from '../core-protocol/types'
import { evaluateIntent } from '../core-protocol/guardian'
import { parseToLip } from './parser'

export type ResolveResult =
  | { ok: true; intent: LiaIntent; guardian: ReturnType<typeof evaluateIntent> }
  | { ok: false; intent: LiaIntent; guardian: ReturnType<typeof evaluateIntent>; clarify: string }

export function resolveIntent(raw: string): ResolveResult {
  const intent = parseToLip(raw)
  const guardian = evaluateIntent(intent)
  if (intent.intent_type === 'UNKNOWN' || !guardian.allowed) {
    return {
      ok: false,
      intent,
      guardian,
      clarify:
        guardian.message ||
        'Précisez l’action, le montant, l’actif et la chaîne (ex: « envoie 5 TRO à erd1… »).',
    }
  }
  return { ok: true, intent, guardian }
}
