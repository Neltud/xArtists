/**
 * Sprint 1 — Pont UI → Doctrine → MultiversXService
 * Workflow : CommandBar/IntentBar → useLIA → validate → execute (paper|live gated)
 */
import { useCallback, useState } from 'react'
import type { ExecutionResult, Intent, IntentType, TxLifecycle, ValidationResult } from '../types/intent'
import { validateIntent } from '../core/doctrine'
import { multiversXService } from '../services/multiversXService'

function toIntentType(raw: string): IntentType {
  const s = raw.toLowerCase()
  if (/swap|échanger/.test(s)) return 'TRADE_SWAP'
  if (/stake/.test(s)) return 'STAKE_ASSET'
  if (/tip|pourboire/.test(s)) return 'TIP'
  if (/envoie|envoyer|transfer|send/.test(s)) return 'TRANSFER_TOKEN'
  if (/solde|balance/.test(s)) return 'BALANCE_QUERY'
  if (/mint/.test(s)) return 'MINT_NFT'
  if (/info|aide|help/.test(s)) return 'INFO'
  return 'UNKNOWN'
}

function extractAmountAtomic(raw: string): string {
  const m = raw.match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return '0'
  // UI human → rough atomic EGLD 18 decimals only for demo parse; real paths must pass atomic
  const human = m[1].replace(',', '.')
  if (human.includes('.')) {
    const [w, f = ''] = human.split('.')
    const frac = (f + '000000000000000000').slice(0, 18)
    return `${w.replace(/^0+/, '') || '0'}${frac}`.replace(/^0+/, '') || '0'
  }
  // integer treated as whole EGLD
  return `${human}${'0'.repeat(18)}`.replace(/^0+/, '') || '0'
}

export function parseNaturalToIntent(raw: string, opts?: { paper?: boolean }): Intent {
  const type = toIntentType(raw)
  const erd = raw.match(/erd1[a-z0-9]{58}/i)?.[0]
  return {
    type,
    assetFrom: /tro/i.test(raw) ? 'TRO-94c925' : 'EGLD',
    assetTo: /usdc|usdt/i.test(raw) ? 'USDC' : 'EGLD',
    amount: type === 'BALANCE_QUERY' || type === 'INFO' ? '0' : extractAmountAtomic(raw),
    targetAddress: erd,
    chain: 'multiversx',
    metadata: {
      reason: raw,
      paper: opts?.paper !== false,
      confidence: type === 'UNKNOWN' ? 0.3 : 0.75,
      slippageBps: 50,
      gasLimit: 60000000,
    },
    timestamp: new Date().toISOString(),
    id: `intent-${Date.now()}`,
  }
}

export function useLIA() {
  const [lifecycle, setLifecycle] = useState<TxLifecycle>('idle')
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null)
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runIntent = useCallback(async (intent: Intent) => {
    setError(null)
    setLifecycle('validating')
    const v = validateIntent(intent)
    setLastValidation(v)
    if (!v.ok) {
      setLifecycle('rejected')
      setError(v.issues.map(i => i.message).join(' · '))
      return null
    }
    setLifecycle('pending_signature')
    const result = await multiversXService.executeIntent(intent)
    setLastResult(result)
    setLifecycle(result.lifecycle)
    if (result.lifecycle === 'error' || result.lifecycle === 'rejected') {
      setError(result.message)
    }
    return result
  }, [])

  const runNatural = useCallback(
    async (text: string, paper = true) => {
      const intent = parseNaturalToIntent(text, { paper })
      return runIntent(intent)
    },
    [runIntent]
  )

  const getBalance = useCallback(async (address: string, assetId = 'EGLD') => {
    return multiversXService.getAssetBalance(address, assetId)
  }, [])

  return {
    lifecycle,
    lastValidation,
    lastResult,
    error,
    runIntent,
    runNatural,
    getBalance,
    validateIntent,
    parseNaturalToIntent,
    service: multiversXService,
  }
}
