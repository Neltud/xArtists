/**
 * Transaction error classification & user-facing messages (MultiversX / sdk-dapp)
 */
import { fetchWithTimeout } from './network'

export type TxErrorCode =
  | 'USER_REJECTED'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_GAS'
  | 'WRONG_NONCE'
  | 'CONTRACT_ERROR'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'NOT_CONFIGURED'
  | 'NOT_LOGGED_IN'
  | 'INVALID_PARAMS'
  | 'TX_FAILED'
  | 'TX_CONCURRENCY'
  | 'UNKNOWN'

export type TxPhase =
  | 'idle'
  | 'building'
  | 'signing'
  | 'broadcasting'
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled'

export type ClassifiedTxError = {
  code: TxErrorCode
  message: string
  detail?: string
  retryable: boolean
  phase: TxPhase
  raw?: unknown
}

export type TxStatusState = {
  phase: TxPhase
  hash?: string
  explorerUrl?: string
  error?: ClassifiedTxError | null
  message?: string
}

const USER_REJECT_PATTERNS = [
  /user rejected/i,
  /user denied/i,
  /rejected by user/i,
  /cancelled by user/i,
  /request rejected/i,
  /user cancel/i,
  /ACTION_CANCELLED/i,
  /WalletConnect.*cancel/i,
]

const INSUFFICIENT_PATTERNS = [
  /insufficient funds/i,
  /insufficient balance/i,
  /not enough.*egld/i,
  /insufficientEGLD/i,
]

const NONCE_PATTERNS = [/nonce/i, /wrong nonce/i, /invalid nonce/i]
const GAS_PATTERNS = [/out of gas/i, /gas limit/i, /insufficient gas/i]
const NETWORK_PATTERNS = [
  /network error/i,
  /failed to fetch/i,
  /ECONNREFUSED/i,
  /timeout/i,
  /Timeout réseau/i,
  /NETWORK_TIMEOUT/i,
  /502|503|504/,
]
const CONCURRENCY_PATTERNS = [/déjà en cours/i, /TX_CONCURRENCY/i, /concurrency/i]

const CONTRACT_MSG: Record<string, string> = {
  'listing inactive': 'Cette annonce n’est plus active (déjà achetée ou annulée).',
  'insufficient payment': 'Paiement EGLD insuffisant pour ce listing.',
  'price must be > 0': 'Le prix doit être supérieur à 0.',
  'only seller': 'Seul le vendeur peut annuler ce listing.',
  inactive: 'Listing inactif.',
  'fee too high': 'Frais marketplace trop élevés (config SC).',
}

function extractMessage(err: unknown): string {
  if (err == null) return ''
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message || err.name
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>
    if (typeof o.message === 'string') return o.message
    if (typeof o.error === 'string') return o.error
    if (typeof o.returnMessage === 'string') return o.returnMessage
    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }
  return String(err)
}

export function classifyTxError(err: unknown, phase: TxPhase = 'failed'): ClassifiedTxError {
  const rawMsg = extractMessage(err)
  const lower = rawMsg.toLowerCase()

  if (CONCURRENCY_PATTERNS.some((p) => p.test(rawMsg))) {
    return {
      code: 'TX_CONCURRENCY',
      message: 'Une transaction est déjà en cours pour ce wallet — attends la fin de la file.',
      detail: rawMsg,
      retryable: true,
      phase,
      raw: err,
    }
  }

  if (USER_REJECT_PATTERNS.some((p) => p.test(rawMsg))) {
    return {
      code: 'USER_REJECTED',
      message: 'Signature refusée dans le wallet.',
      detail: rawMsg,
      retryable: true,
      phase: 'cancelled',
      raw: err,
    }
  }

  if (INSUFFICIENT_PATTERNS.some((p) => p.test(rawMsg))) {
    return {
      code: 'INSUFFICIENT_FUNDS',
      message: 'Solde EGLD insuffisant (montant + gas).',
      detail: rawMsg,
      retryable: true,
      phase,
      raw: err,
    }
  }

  if (GAS_PATTERNS.some((p) => p.test(rawMsg))) {
    return {
      code: 'INSUFFICIENT_GAS',
      message: 'Gas insuffisant — réessaie avec une limite plus haute.',
      detail: rawMsg,
      retryable: true,
      phase,
      raw: err,
    }
  }

  if (NONCE_PATTERNS.some((p) => p.test(rawMsg))) {
    return {
      code: 'WRONG_NONCE',
      message: 'Nonce incorrect — rafraîchis le compte puis réessaie.',
      detail: rawMsg,
      retryable: true,
      phase,
      raw: err,
    }
  }

  for (const [key, fr] of Object.entries(CONTRACT_MSG)) {
    if (lower.includes(key.toLowerCase())) {
      return {
        code: 'CONTRACT_ERROR',
        message: fr,
        detail: rawMsg,
        retryable: false,
        phase,
        raw: err,
      }
    }
  }

  if (/smart contract|execution failed|return code|user error/i.test(rawMsg)) {
    return {
      code: 'CONTRACT_ERROR',
      message: 'Échec d’exécution du smart contract.',
      detail: rawMsg,
      retryable: false,
      phase,
      raw: err,
    }
  }

  if (NETWORK_PATTERNS.some((p) => p.test(rawMsg))) {
    return {
      code: 'NETWORK',
      message: 'Erreur / timeout réseau MultiversX. Réessaie dans un instant.',
      detail: rawMsg,
      retryable: true,
      phase,
      raw: err,
    }
  }

  if (/timeout|timed out/i.test(rawMsg)) {
    return {
      code: 'TIMEOUT',
      message: 'Délai dépassé en attendant la confirmation.',
      detail: rawMsg,
      retryable: true,
      phase,
      raw: err,
    }
  }

  return {
    code: 'UNKNOWN',
    message: rawMsg || 'Erreur de transaction inconnue.',
    detail: rawMsg,
    retryable: true,
    phase,
    raw: err,
  }
}

export function preflightTxErrors(opts: {
  isLoggedIn?: boolean
  address?: string | null
  contractConfigured?: boolean
  balanceAtomic?: bigint | string | number
  valueAtomic?: bigint | string | number
  minGasAtomic?: bigint
}): ClassifiedTxError | null {
  if (!opts.isLoggedIn || !opts.address) {
    return {
      code: 'NOT_LOGGED_IN',
      message: 'Connecte ton wallet MultiversX.',
      retryable: true,
      phase: 'idle',
    }
  }
  if (opts.contractConfigured === false) {
    return {
      code: 'NOT_CONFIGURED',
      message: 'Contrat non configuré (adresse manquante).',
      retryable: false,
      phase: 'idle',
    }
  }
  if (opts.balanceAtomic != null && opts.valueAtomic != null) {
    const bal = BigInt(opts.balanceAtomic)
    const val = BigInt(opts.valueAtomic)
    const gas = opts.minGasAtomic ?? 50_000_000_000_000n
    if (bal < val + gas) {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Solde insuffisant pour le montant + frais de gas.',
        retryable: true,
        phase: 'idle',
      }
    }
  }
  return null
}

export function explorerTxUrl(
  hash: string,
  explorer = 'https://explorer.multiversx.com'
): string {
  return `${explorer}/transactions/${hash}`
}

export async function waitTxStatus(
  hash: string,
  opts: {
    api?: string
    timeoutMs?: number
    intervalMs?: number
    signal?: AbortSignal
  } = {}
): Promise<{ status: 'success' | 'fail' | 'timeout'; raw?: unknown }> {
  const api = opts.api || 'https://api.multiversx.com'
  const timeoutMs = opts.timeoutMs ?? 120_000
  const intervalMs = opts.intervalMs ?? 3000
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (opts.signal?.aborted) return { status: 'timeout' }
    try {
      const res = await fetchWithTimeout(
        `${api}/transactions/${hash}`,
        {},
        { timeoutMs: 12_000, retries: 1, signal: opts.signal }
      )
      if (res.ok) {
        const data = await res.json()
        const st = String(data.status || data.txStatus || '').toLowerCase()
        if (st === 'success' || st === 'executed') return { status: 'success', raw: data }
        if (st === 'fail' || st === 'failed' || st === 'invalid') {
          return { status: 'fail', raw: data }
        }
      }
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return { status: 'timeout' }
}
