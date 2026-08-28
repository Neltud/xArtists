/**
 * v3.0 — Doctrine / Guardian Engine
 * Intercepte chaque Intent avant exécution blockchain.
 */
import type { Intent, ValidationIssue, ValidationResult } from '../types/intent'
import { canonicalIntentType } from '../types/intent'

const MAX_AMOUNT_DIGITS = 36
const MAX_SLIPPAGE_BPS = 500
const MIN_GAS = 50_000
const MAX_GAS = 600_000_000
const ERD1 = /^erd1[a-z0-9]{58}$/i

/** Actifs reconnus (conformité — liste ouverte extensible) */
const KNOWN_ASSETS = new Set([
  'EGLD',
  'WEGLD',
  'USDC',
  'USDT',
  'TRO',
  'TRO-94C925',
  'MEX',
  'MEX-455C57',
])

function isNonNegativeIntegerString(s: string): boolean {
  return /^[0-9]+$/.test(s)
}

function normAsset(a: string): string {
  return (a || '').toUpperCase().trim()
}

export class DoctrineEngine {
  validateIntent(intent: Intent): ValidationResult {
    const issues: ValidationIssue[] = []
    const type = canonicalIntentType(intent.type)

    // —— 1. SYNTAXE ——
    if (!intent.type || type === 'UNKNOWN') {
      issues.push({
        level: 'SYNTAX',
        code: 'UNKNOWN_TYPE',
        message: 'Type d’intention inconnu ou manquant.',
      })
    }
    if (intent.chain !== 'multiversx') {
      issues.push({
        level: 'SYNTAX',
        code: 'CHAIN_UNSUPPORTED',
        message: 'MultiversX uniquement dans ce provider.',
      })
    }
    if (!intent.amount || !isNonNegativeIntegerString(intent.amount)) {
      issues.push({
        level: 'SYNTAX',
        code: 'AMOUNT_NOT_ATOMIC',
        message: 'amount doit être une chaîne entière atomic (BigInt), pas de float.',
      })
    } else if (intent.amount.length > MAX_AMOUNT_DIGITS) {
      issues.push({
        level: 'SYNTAX',
        code: 'AMOUNT_TOO_LONG',
        message: 'Montant atomic anormalement long.',
      })
    }
    if (!intent.timestamp) {
      issues.push({ level: 'SYNTAX', code: 'NO_TIMESTAMP', message: 'timestamp requis.' })
    }

    const needsTarget = type === 'TRANSFER' || type === 'TIP'
    if (needsTarget && !intent.targetAddress) {
      issues.push({
        level: 'SYNTAX',
        code: 'MISSING_TARGET',
        message: 'Transfert/tip : targetAddress erd1 requis.',
      })
    }
    if (intent.targetAddress && !ERD1.test(intent.targetAddress)) {
      issues.push({
        level: 'SYNTAX',
        code: 'BAD_ERD_ADDRESS',
        message: 'Adresse cible erd1… invalide.',
      })
    }
    if (type === 'SWAP' && (!intent.assetFrom || !intent.assetTo)) {
      issues.push({
        level: 'SYNTAX',
        code: 'SWAP_ASSETS',
        message: 'Swap : assetFrom et assetTo requis.',
      })
    }

    // —— 2. ACTIFS ——
    for (const key of ['assetFrom', 'assetTo'] as const) {
      const raw = intent[key]
      if (!raw) continue
      const n = normAsset(raw)
      const ok =
        KNOWN_ASSETS.has(n) ||
        n.startsWith('TRO') ||
        n.startsWith('MEX') ||
        /^[A-Z0-9]+-[A-F0-9]{6}$/i.test(raw)
      if (!ok && type !== 'INFO' && type !== 'BALANCE_QUERY') {
        issues.push({
          level: 'ASSET',
          code: 'ASSET_UNKNOWN',
          message: `Actif non listé pour conformité stricte: ${raw}`,
        })
      }
    }

    // —— 3. SÉCURITÉ ——
    const reason = (intent.metadata?.reason || '').toLowerCase()
    if (/bypass|ordonne|ceo|admin override|drain|force live/.test(reason)) {
      issues.push({
        level: 'SECURITY',
        code: 'AUTHORITY_SPOOF',
        message: 'Formulation refusée. Seule une signature wallet valide une TX.',
      })
    }
    if (
      type === 'SWAP' &&
      intent.metadata?.paper === false &&
      !intent.metadata?.userConfirmedLive
    ) {
      issues.push({
        level: 'SECURITY',
        code: 'LIVE_NOT_CONFIRMED',
        message: 'Swap live : confirmation utilisateur + gate env requis.',
      })
    }
    if (
      intent.amount === '0' &&
      ['TRANSFER', 'TIP', 'SWAP', 'STAKE', 'MINT'].includes(type)
    ) {
      issues.push({
        level: 'SECURITY',
        code: 'ZERO_AMOUNT',
        message: 'Montant zéro interdit pour cette action.',
      })
    }

    // —— 4. PARAMÈTRES ——
    const slip = intent.metadata?.slippageBps
    if (slip !== undefined && (slip < 0 || slip > MAX_SLIPPAGE_BPS)) {
      issues.push({
        level: 'PARAMETERS',
        code: 'SLIPPAGE_OUT_OF_RANGE',
        message: `Slippage max ${MAX_SLIPPAGE_BPS} bps.`,
      })
    }
    const gas = intent.metadata?.gasLimit
    if (gas !== undefined && (gas < MIN_GAS || gas > MAX_GAS)) {
      issues.push({
        level: 'PARAMETERS',
        code: 'GAS_OUT_OF_RANGE',
        message: `Gas limit hors bornes [${MIN_GAS}, ${MAX_GAS}].`,
      })
    }

    const blocking = issues.filter(
      i => i.level === 'SYNTAX' || i.level === 'SECURITY' || i.level === 'ASSET'
    )
    // ASSET unknown = soft warn in paper; hard block if only unknown asset? treat as blocking for live
    const forcePaper =
      intent.metadata?.paper !== false ||
      issues.some(i => i.code === 'LIVE_NOT_CONFIRMED')

    const hardBlock = issues.filter(i => i.level === 'SYNTAX' || i.level === 'SECURITY')
    const ok = hardBlock.length === 0

    return {
      ok,
      issues,
      canExecute: ok && !forcePaper && blocking.filter(i => i.level !== 'ASSET').length === 0,
      forcePaper: forcePaper || !ok,
    }
  }
}

export const doctrineEngine = new DoctrineEngine()

export function validateIntent(intent: Intent): ValidationResult {
  return doctrineEngine.validateIntent(intent)
}
