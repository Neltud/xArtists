/** LIA-Brain parser local (rules) — LIP output. LLM adapter optionnel plus tard. */

import type { LiaIntent, IntentType, IntentActionFamily, ChainId } from '../core-protocol/types'
import { decimalsForChain, toAtomic, TRO_POLICY } from '../core-protocol/constants'

function familyOf(t: IntentType): IntentActionFamily {
  if (t === 'TRANSFER' || t === 'SWAP' || t === 'STAKE') return 'FINANCIAL'
  if (t === 'MINT' || t === 'LIST' || t === 'TRANSFER_IP') return 'CREATIVE'
  if (t === 'SEARCH' || t === 'RESERVE' || t === 'PAY_BOOKING') return 'TRAVEL'
  if (t === 'BALANCE' || t === 'INFO') return 'INFO'
  return 'UNKNOWN'
}

function detectChain(raw: string): ChainId {
  const s = raw.toLowerCase()
  if (/multiversx|mvx|egld|erd1/.test(s)) return 'multiversx'
  if (/polygon|matic/.test(s)) return 'polygon'
  if (/\bbase\b/.test(s)) return 'base'
  if (/arbitrum/.test(s)) return 'arbitrum'
  return 'ethereum'
}

export function parseToLip(raw: string): LiaIntent {
  const text = raw.trim()
  const chain = detectChain(text)
  const decimals = decimalsForChain(chain)
  let intent_type: IntentType = 'UNKNOWN'
  let amountHuman = '0'
  let target_address: string | undefined
  let confidence = 0.25
  let reason = 'Intention non résolue'

  if (/\b(solde|balance)\b/i.test(text)) {
    intent_type = 'BALANCE'
    confidence = 0.9
    reason = 'Consultation solde'
  } else if (/\b(swap|échanger)\b/i.test(text)) {
    intent_type = 'SWAP'
    confidence = 0.75
    reason = 'Swap demandé'
  } else if (/\b(stake|staking)\b/i.test(text)) {
    intent_type = 'STAKE'
    confidence = 0.8
    reason = 'Stake demandé'
  } else if (/\b(mint)\b/i.test(text)) {
    intent_type = 'MINT'
    confidence = 0.8
    reason = 'Mint créatif'
  } else if (/\b(vol|flight|hôtel|hotel|réserv)\b/i.test(text)) {
    intent_type = 'SEARCH'
    confidence = 0.7
    reason = 'Recherche travel'
  } else if (/\b(envoie|envoyer|send|transfer)\b/i.test(text)) {
    intent_type = 'TRANSFER'
    confidence = 0.7
    reason = 'Transfert'
  }

  const amt = text.match(/(\d+(?:[.,]\d+)?)/)
  if (amt) amountHuman = amt[1].replace(',', '.')

  const ethAddr = text.match(/0x[a-fA-F0-9]{40}/)
  const erd = text.match(/erd1[a-z0-9]{58}/i)
  if (ethAddr) target_address = ethAddr[0]
  if (erd) target_address = erd[0]

  // Ambiguïté : transfert sans adresse ou montant
  if (intent_type === 'TRANSFER' && (!target_address || amountHuman === '0')) {
    intent_type = 'UNKNOWN'
    confidence = 0.4
    reason = 'Transfert ambigu — préciser montant, actif et adresse'
  }

  const requires_human_approval =
    Number(amountHuman) >= TRO_POLICY.HUMAN_APPROVAL_THRESHOLD_TRO

  return {
    protocol: 'LIP-1',
    intent_type,
    family: familyOf(intent_type),
    raw: text,
    chain,
    amount_atomic: toAtomic(amountHuman, decimals),
    decimals,
    asset: /\$tro|\btro\b/i.test(text) ? TRO_POLICY.SYMBOL : 'UNKNOWN',
    target_address,
    reason,
    confidence_score: confidence,
    requires_human_approval,
    sealed: false,
    created_at: new Date().toISOString(),
  }
}
