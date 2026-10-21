/**
 * Construit des TX MultiversX pour intents LIA (signature xPortal uniquement).
 * prepareIntentTx refuse de transformer BUY/SELL/SWAP en dépôt bootstrap.
 */
import { LIA_GUARDS } from '../config/liaConfig'
import { MAINNET_ADDRESSES, TREASURY_SPLITTER_ADDRESS } from '../config/contracts'
import type { JournalEntry } from './intentJournal'

export type MxTxDraft = {
  receiver: string
  value: string
  gasLimit: number
  data: string
  chainID: '1'
}

export type PrepareResult =
  | { ok: true; draft: MxTxDraft }
  | { ok: false; reason: string }

function egldToAtomic(egld: number): string {
  if (!Number.isFinite(egld) || egld < 0) return '0'
  return BigInt(Math.round(egld * 1e18)).toString()
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const BOOTSTRAP_ACTIONS = new Set(['BOOTSTRAP', 'LIVE_BOOTSTRAP', 'DEPOSIT', 'FUND', 'AMORCE'])
const TRADE_ACTIONS = new Set(['BUY', 'SELL', 'SWAP', 'BUY_NFT', 'SELL_NFT', 'TRADE', 'EXCHANGE'])

export function buildBootstrapLiveTx(): MxTxDraft {
  const egld = Math.min(LIA_GUARDS.bootstrapEgld, 0.01)
  return {
    receiver: TREASURY_SPLITTER_ADDRESS || MAINNET_ADDRESSES.treasury_splitter,
    value: egldToAtomic(egld),
    gasLimit: 600_000,
    data: `LIA_LIVE_BOOTSTRAP@1@${Date.now()}`,
    chainID: '1',
  }
}

export function prepareIntentTx(entry: JournalEntry): PrepareResult {
  const action = String(entry.action || '').toUpperCase().trim()
  const asset = (entry.assetId || 'EGLD').toUpperCase()
  const amount = Number(entry.amount)

  if (Number.isNaN(amount) || !Number.isFinite(amount)) {
    return { ok: false, reason: 'Montant invalide (NaN/infini) — intent refusé.' }
  }

  if (
    TRADE_ACTIONS.has(action) ||
    action.includes('SWAP') ||
    action.includes('BUY') ||
    action.includes('SELL')
  ) {
    return {
      ok: false,
      reason: `Intent ${action} : pas de substitution bootstrap. Cotation, route et simulation ESDT requises avant signature.`,
    }
  }

  if (!BOOTSTRAP_ACTIONS.has(action) && action && action !== 'TRANSFER' && action !== 'TIP') {
    return {
      ok: false,
      reason: `Action « ${action} » non mappée vers une TX de dépôt. Utilise BOOTSTRAP pour l'amorce 0,001 EGLD.`,
    }
  }

  const receiver = TREASURY_SPLITTER_ADDRESS || MAINNET_ADDRESSES.treasury_splitter

  if (asset === 'EGLD' || asset === 'WEGLD' || BOOTSTRAP_ACTIONS.has(action) || !action) {
    const egld = Math.min(LIA_GUARDS.bootstrapEgld, 0.001)
    return {
      ok: true,
      draft: {
        receiver,
        value: egldToAtomic(egld),
        gasLimit: 600_000,
        data: `LIA_INTENT@${entry.id.slice(0, 24)}@${action || 'BOOTSTRAP'}`.slice(0, 120),
        chainID: '1',
      },
    }
  }

  if (asset.startsWith('TRO') || asset === 'TRO-94C925') {
    const units = 1_000_000n
    const tokenHex = strToHex('TRO-94c925')
    const amtHex = units.toString(16)
    return {
      ok: true,
      draft: {
        receiver,
        value: '0',
        gasLimit: 6_000_000,
        data: `ESDTTransfer@${tokenHex}@${amtHex}`,
        chainID: '1',
      },
    }
  }

  return {
    ok: false,
    reason: `Asset ${asset} non supporté. Allowlist: ${LIA_GUARDS.allowlist.join(', ')}.`,
  }
}

/** @deprecated Préférer prepareIntentTx */
export function buildTxFromIntent(entry: JournalEntry): MxTxDraft {
  const prepared = prepareIntentTx(entry)
  if (prepared.ok) return prepared.draft
  return buildBootstrapLiveTx()
}

export function describeTx(draft: MxTxDraft): string {
  const egld = Number(draft.value) / 1e18
  return `${egld > 0 ? `${egld} EGLD` : 'ESDT'} → ${draft.receiver.slice(0, 12)}… · gas ${draft.gasLimit}`
}
