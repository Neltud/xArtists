/**
 * Bridge front → LIA Intent Protocol (LIP-1).
 * Mirror of packages/lia-intelligence (no monorepo alias required for Vite GH Pages build).
 */

export type LipChain = 'ethereum' | 'polygon' | 'base' | 'multiversx' | 'arbitrum'

export type LipIntentType =
  | 'TRANSFER'
  | 'SWAP'
  | 'STAKE'
  | 'MINT'
  | 'LIST'
  | 'SEARCH'
  | 'RESERVE'
  | 'BALANCE'
  | 'INFO'
  | 'UNKNOWN'

export type LipFamily = 'FINANCIAL' | 'CREATIVE' | 'TRAVEL' | 'INFO' | 'UNKNOWN'

export interface LipIntent {
  protocol: 'LIP-1'
  intent_type: LipIntentType
  family: LipFamily
  raw: string
  chain: LipChain
  amount_atomic: string
  decimals: 6 | 18
  asset: string
  target_address?: string
  reason: string
  confidence_score: number
  requires_human_approval: boolean
  sealed: boolean
  created_at: string
}

export interface GuardianVerdict {
  allowed: boolean
  code: string
  message: string
  risk_score: number
}

const HUMAN_THRESHOLD = 1000

function decimalsForChain(chain: LipChain): 6 | 18 {
  return chain === 'multiversx' ? 6 : 18
}

function toAtomic(amountHuman: string, decimals: 6 | 18): string {
  const [whole, frac = ''] = amountHuman.split('.')
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  return `${whole.replace(/^0+/, '') || '0'}${padded}`.replace(/^0+/, '') || '0'
}

function familyOf(t: LipIntentType): LipFamily {
  if (t === 'TRANSFER' || t === 'SWAP' || t === 'STAKE') return 'FINANCIAL'
  if (t === 'MINT' || t === 'LIST') return 'CREATIVE'
  if (t === 'SEARCH' || t === 'RESERVE') return 'TRAVEL'
  if (t === 'BALANCE' || t === 'INFO') return 'INFO'
  return 'UNKNOWN'
}

function detectChain(raw: string): LipChain {
  const s = raw.toLowerCase()
  if (/multiversx|mvx|egld|erd1/.test(s)) return 'multiversx'
  if (/polygon|matic/.test(s)) return 'polygon'
  if (/\bbase\b/.test(s)) return 'base'
  if (/arbitrum/.test(s)) return 'arbitrum'
  return 'ethereum'
}

export function parseToLip(raw: string): LipIntent {
  const text = raw.trim()
  const chain = detectChain(text)
  const decimals = decimalsForChain(chain)
  let intent_type: LipIntentType = 'UNKNOWN'
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
  } else if (/\b(vol|flight|hôtel|hotel|réserv|tour|expo)\b/i.test(text)) {
    intent_type = 'SEARCH'
    confidence = 0.7
    reason = 'Recherche travel / culture'
  } else if (/\b(envoie|envoyer|send|transfer)\b/i.test(text)) {
    intent_type = 'TRANSFER'
    confidence = 0.7
    reason = 'Transfert'
  } else if (/\b(info|aide|help)\b/i.test(text)) {
    intent_type = 'INFO'
    confidence = 0.85
    reason = 'Information'
  }

  const amt = text.match(/(\d+(?:[.,]\d+)?)/)
  if (amt) amountHuman = amt[1].replace(',', '.')

  const ethAddr = text.match(/0x[a-fA-F0-9]{40}/)
  const erd = text.match(/erd1[a-z0-9]{58}/i)
  if (ethAddr) target_address = ethAddr[0]
  if (erd) target_address = erd[0]

  if (intent_type === 'TRANSFER' && (!target_address || amountHuman === '0')) {
    intent_type = 'UNKNOWN'
    confidence = 0.4
    reason = 'Transfert ambigu — préciser montant, actif et adresse'
  }

  const requires_human_approval = Number(amountHuman) >= HUMAN_THRESHOLD

  return {
    protocol: 'LIP-1',
    intent_type,
    family: familyOf(intent_type),
    raw: text,
    chain,
    amount_atomic: toAtomic(amountHuman, decimals),
    decimals,
    asset: /\$tro|\btro\b/i.test(text) ? 'TRO' : /egld/i.test(text) ? 'EGLD' : 'UNKNOWN',
    target_address,
    reason,
    confidence_score: confidence,
    requires_human_approval,
    sealed: false,
    created_at: new Date().toISOString(),
  }
}

export function evaluateGuardian(intent: LipIntent): GuardianVerdict {
  if (/\b(ceo|admin|bypass|ordonne)\b/i.test(intent.raw)) {
    return {
      allowed: false,
      code: 'AUTHORITY_SPOOF',
      message: 'Seule une signature wallet valide une commande.',
      risk_score: 0.9,
    }
  }
  const expected = decimalsForChain(intent.chain)
  if (intent.decimals !== expected) {
    return {
      allowed: false,
      code: 'DECIMAL_MISMATCH',
      message: `Attendu ${expected} décimales pour ${intent.chain}`,
      risk_score: 0.95,
    }
  }
  if (intent.intent_type === 'UNKNOWN') {
    return {
      allowed: false,
      code: 'UNKNOWN_INTENT',
      message: intent.reason,
      risk_score: 0.3,
    }
  }
  if (intent.requires_human_approval) {
    return {
      allowed: true,
      code: 'HUMAN_APPROVAL_REQUIRED',
      message: `Montant ≥ ${HUMAN_THRESHOLD} — validation humaine requise avant exécution live.`,
      risk_score: 0.65,
    }
  }
  return { allowed: true, code: 'OK', message: 'Guardian pass (paper)', risk_score: 0.1 }
}

export type LipResolve =
  | { ok: true; intent: LipIntent; guardian: GuardianVerdict }
  | { ok: false; intent: LipIntent; guardian: GuardianVerdict; clarify: string }

export function resolveLip(raw: string): LipResolve {
  const intent = parseToLip(raw)
  const guardian = evaluateGuardian(intent)
  if (!guardian.allowed || intent.intent_type === 'UNKNOWN') {
    return {
      ok: false,
      intent,
      guardian,
      clarify:
        guardian.message ||
        'Précisez action, montant, actif et chaîne (ex: « solde TRO » ou « tours paris »).',
    }
  }
  return { ok: true, intent, guardian }
}

/** Map LIP → route dApp existante */
export function lipToRoute(intent: LipIntent): string | null {
  switch (intent.intent_type) {
    case 'BALANCE':
      return '/wallet'
    case 'SWAP':
    case 'STAKE':
      return '/trading'
    case 'MINT':
    case 'LIST':
      return '/marketplace'
    case 'SEARCH':
    case 'RESERVE':
      return '/tours'
    case 'TRANSFER':
      return '/tip'
    case 'INFO':
      return '/entity'
    default:
      return null
  }
}
