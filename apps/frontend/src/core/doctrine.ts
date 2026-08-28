/**
 * Sprint 1 — Doctrine / Guardian Engine
 * Intercepte chaque Intent avant tout envoi on-chain.
 */
import type { Intent, ValidationIssue, ValidationResult } from '../types/intent'

/** Max atomic amount string length guard (anti overflow UI) */
const MAX_AMOUNT_DIGITS = 36
/** Default max tip/transfer in human units when decimals known — soft */
const MAX_SLIPPAGE_BPS = 500 // 5%
const MIN_GAS = 50_000
const MAX_GAS = 600_000_000

const ERD1 = /^erd1[a-z0-9]{58}$/i

function isNonNegativeIntegerString(s: string): boolean {
  return /^[0-9]+$/.test(s)
}

/**
 * DoctrineEngine — 3 niveaux : SYNTAXE · SÉCURITÉ · PARAMÈTRES
 */
export class DoctrineEngine {
  validateIntent(intent: Intent): ValidationResult {
    const issues: ValidationIssue[] = []

    // —— 1. SYNTAXE ——
    if (!intent.type || intent.type === 'UNKNOWN') {
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
        message: 'Sprint 1 : MultiversX uniquement.',
      })
    }
    if (!intent.amount || !isNonNegativeIntegerString(intent.amount)) {
      issues.push({
        level: 'SYNTAX',
        code: 'AMOUNT_NOT_ATOMIC',
        message: 'amount doit être une chaîne entière atomic (BigInt), pas de float.',
      })
    }
    if (intent.amount && intent.amount.length > MAX_AMOUNT_DIGITS) {
      issues.push({
        level: 'SYNTAX',
        code: 'AMOUNT_TOO_LONG',
        message: 'Montant atomic anormalement long.',
      })
    }
    if (!intent.timestamp) {
      issues.push({
        level: 'SYNTAX',
        code: 'NO_TIMESTAMP',
        message: 'timestamp requis.',
      })
    }
    if (
      (intent.type === 'TRANSFER_TOKEN' || intent.type === 'TIP') &&
      intent.targetAddress &&
      !ERD1.test(intent.targetAddress)
    ) {
      issues.push({
        level: 'SYNTAX',
        code: 'BAD_ERD_ADDRESS',
        message: 'Adresse cible erd1… invalide.',
      })
    }
    if (
      (intent.type === 'TRANSFER_TOKEN' || intent.type === 'TIP') &&
      !intent.targetAddress
    ) {
      issues.push({
        level: 'SYNTAX',
        code: 'MISSING_TARGET',
        message: 'Transfert/tip : targetAddress requis.',
      })
    }
    if (intent.type === 'TRADE_SWAP' && (!intent.assetFrom || !intent.assetTo)) {
      issues.push({
        level: 'SYNTAX',
        code: 'SWAP_ASSETS',
        message: 'Swap : assetFrom et assetTo requis.',
      })
    }

    // —— 2. SÉCURITÉ ——
    const reason = (intent.metadata?.reason || '').toLowerCase()
    if (/bypass|ordonne|ceo|admin override|drain/.test(reason)) {
      issues.push({
        level: 'SECURITY',
        code: 'AUTHORITY_SPOOF',
        message: 'Formulation refusée. Seule une signature wallet valide une TX.',
      })
    }
    // Séparation LIA vs $TRO economics
    if (intent.type === 'TRADE_SWAP' && intent.metadata?.paper === false) {
      // Live swap only with explicit flag + env gate (checked in service)
      if (!intent.metadata?.userConfirmedLive) {
        issues.push({
          level: 'SECURITY',
          code: 'LIVE_NOT_CONFIRMED',
          message: 'Swap live : confirmation utilisateur + gate LIA_LIVE requis.',
        })
      }
    }
    if (intent.amount === '0' && ['TRANSFER_TOKEN', 'TIP', 'TRADE_SWAP', 'STAKE_ASSET'].includes(intent.type)) {
      issues.push({
        level: 'SECURITY',
        code: 'ZERO_AMOUNT',
        message: 'Montant zéro interdit pour cette action.',
      })
    }

    // —— 3. PARAMÈTRES ——
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

    const blocking = issues.filter(i => i.level === 'SYNTAX' || i.level === 'SECURITY')
    const forcePaper =
      intent.metadata?.paper !== false ||
      issues.some(i => i.code === 'LIVE_NOT_CONFIRMED')

    const ok = blocking.length === 0
    return {
      ok,
      issues,
      canExecute: ok && !forcePaper,
      forcePaper: forcePaper || !ok,
    }
  }
}

export const doctrineEngine = new DoctrineEngine()

export function validateIntent(intent: Intent): ValidationResult {
  return doctrineEngine.validateIntent(intent)
}
