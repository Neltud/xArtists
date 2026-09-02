/**
 * v3.0 — Orchestrateur UI → Doctrine → MultiversXService → TransactionMonitor.
 * Aucun setTimeout pour simuler une TX réussie.
 */
import { useCallback, useState } from 'react'
import type {
  ExecutionResult,
  Intent,
  IntentType,
  TxLifecycle,
  ValidationResult,
} from '../types/intent'
import { validateIntent } from '../core/doctrine'
import { multiversXService, type SignAndSendFn } from '../services/multiversXService'
import { transactionMonitor, type TxNetwork } from '../services/transactionMonitor'

function toIntentType(raw: string): IntentType {
  const s = raw.toLowerCase()
  if (/swap|échanger|exchange/.test(s)) return 'SWAP'
  if (/stake/.test(s)) return 'STAKE'
  if (/tip|pourboire/.test(s)) return 'TIP'
  if (/envoie|envoyer|transfer|send/.test(s)) return 'TRANSFER'
  if (/solde|balance/.test(s)) return 'BALANCE_QUERY'
  if (/mint/.test(s)) return 'MINT'
  if (/info|aide|help/.test(s)) return 'INFO'
  return 'UNKNOWN'
}

function extractAmountAtomic(raw: string, decimals = 18): string {
  const m = raw.match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return '0'
  const human = m[1].replace(',', '.')
  if (!human.includes('.')) {
    const whole = human.replace(/^0+/, '') || '0'
    return whole === '0' ? '0' : `${whole}${'0'.repeat(decimals)}`
  }
  const [w, f = ''] = human.split('.')
  const frac = (f + '0'.repeat(decimals)).slice(0, decimals)
  const combined = `${w.replace(/^0+/, '') || '0'}${frac}`.replace(/^0+/, '')
  return combined || '0'
}

export function parseNaturalToIntent(raw: string, opts?: { paper?: boolean }): Intent {
  const type = toIntentType(raw)
  const erd = raw.match(/erd1[a-z0-9]{58}/i)?.[0]
  return {
    type,
    assetFrom: /tro/i.test(raw) ? 'TRO-94c925' : 'EGLD',
    assetTo: /usdc/i.test(raw) ? 'USDC' : /egld/i.test(raw) && /tro/i.test(raw) ? 'EGLD' : 'USDC',
    amount: type === 'BALANCE_QUERY' || type === 'INFO' ? '0' : extractAmountAtomic(raw),
    targetAddress: erd,
    chain: 'multiversx',
    metadata: {
      reason: raw,
      paper: opts?.paper !== false,
      confidence: type === 'UNKNOWN' ? 0.3 : 0.8,
      slippageBps: 50,
      gasLimit: 60_000_000,
      network: (import.meta.env.VITE_MX_NETWORK as TxNetwork) || 'mainnet',
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

  const watchTx = useCallback((hash: string, network: TxNetwork = 'mainnet', intentId?: string) => {
    setLifecycle('pending')
    transactionMonitor.watch(hash, {
      network,
      intentId,
      onUpdate: tx => {
        if (tx.status === 'success') {
          setLifecycle('success')
          setLastResult(prev =>
            prev
              ? {
                  ...prev,
                  lifecycle: 'success',
                  message: `Confirmé on-chain — ${hash.slice(0, 12)}…`,
                  stageError: null,
                }
              : prev
          )
        } else if (tx.status === 'fail') {
          setLifecycle('error')
          setError('TX échouée on-chain')
          setLastResult(prev =>
            prev
              ? {
                  ...prev,
                  lifecycle: 'error',
                  message: 'Confirmation : TX fail',
                  stageError: 'CONFIRMATION',
                }
              : prev
          )
        } else if (tx.error) {
          setError(tx.error)
        }
      },
    })
  }, [])

  const runIntent = useCallback(
    async (intent: Intent, signAndSend?: SignAndSendFn) => {
      setError(null)
      setLifecycle('validating')
      const v = validateIntent(intent)
      setLastValidation(v)
      if (!v.ok) {
        setLifecycle('rejected')
        setError(v.issues.map(i => i.message).join(' · '))
        const rejected: ExecutionResult = {
          lifecycle: 'rejected',
          message: v.issues.map(i => i.message).join(' · '),
          paper: true,
          intent,
          stageError: 'VALIDATION',
        }
        setLastResult(rejected)
        return rejected
      }
      setLifecycle('validated')

      const needSign =
        intent.metadata?.paper === false && intent.metadata?.userConfirmedLive === true
      if (needSign) setLifecycle('pending_signature')

      const result = await multiversXService.executeIntent(intent, { signAndSend })
      setLastResult(result)
      setLifecycle(result.lifecycle)

      if (result.lifecycle === 'error' || result.lifecycle === 'rejected') {
        setError(result.message)
      }
      if (result.lifecycle === 'broadcast' && result.txHash) {
        const net = (intent.metadata?.network as TxNetwork) || 'mainnet'
        watchTx(result.txHash, net, intent.id)
      }
      return result
    },
    [watchTx]
  )

  const runNatural = useCallback(
    async (text: string, paper = true, signAndSend?: SignAndSendFn) => {
      const intent = parseNaturalToIntent(text, { paper })
      return runIntent(intent, signAndSend)
    },
    [runIntent]
  )

  const getBalance = useCallback(async (address: string, assetId = 'EGLD') => {
    return multiversXService.getRealBalance(address, assetId)
  }, [])

  const monitorHash = useCallback((hash: string, network: TxNetwork = 'mainnet') => {
    watchTx(hash, network)
  }, [watchTx])

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
    monitorHash,
    service: multiversXService,
    transactionMonitor,
  }
}
