/**
 * Construit des TX MultiversX pour intents LIA (signature xPortal uniquement).
 * Aucune PEM · broadcast via useSendTransaction / __xartistsSendTx.
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

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * TX d’amorce live : micro-EGLD → treasury_splitter avec memo on-chain.
 * Montant plafonné à LIA_GUARDS.bootstrapEgld (0.001 EGLD).
 */
export function buildBootstrapLiveTx(): MxTxDraft {
  const egld = Math.min(LIA_GUARDS.bootstrapEgld, 0.01)
  const memo = `LIA_LIVE_BOOTSTRAP@1@${Date.now()}`
  return {
    receiver: TREASURY_SPLITTER_ADDRESS || MAINNET_ADDRESSES.treasury_splitter,
    value: egldToAtomic(egld),
    gasLimit: 600_000,
    data: memo,
    chainID: '1',
  }
}

/**
 * Mappe un intent journal → TX draft.
 * - EGLD : transfer micro vers treasury (cap bootstrap)
 * - TRO-94c925 : ESDTTransfer micro vers treasury (si amount > 0)
 * - BUY/SELL/SWAP sans route : erreur (jamais bootstrap)
 */
export function buildTxFromIntent(entry: JournalEntry): MxTxDraft {
  const asset = (entry.assetId || 'EGLD').toUpperCase()
  const receiver = TREASURY_SPLITTER_ADDRESS || MAINNET_ADDRESSES.treasury_splitter

  if (asset === 'EGLD' || asset === 'WEGLD') {
    const raw = Math.abs(Number(entry.amount) || LIA_GUARDS.bootstrapEgld)
    // amount journal est souvent notionnel USD — forcer micro on-chain
    const egld = Math.min(LIA_GUARDS.bootstrapEgld, Math.max(0.0005, raw > 1 ? LIA_GUARDS.bootstrapEgld : raw))
    return {
      receiver,
      value: egldToAtomic(egld),
      gasLimit: 600_000,
      data: `LIA_INTENT@${entry.id.slice(0, 24)}@${entry.action}`.slice(0, 120),
      chainID: '1',
    }
  }

  if (asset.startsWith('TRO') || asset === 'TRO-94C925') {
    // 1 TRO unit (6 decimals) min smoke — amount journal not trusted as on-chain
    const units = 1_000_000n // 1 TRO
    const tokenHex = strToHex('TRO-94c925')
    const amtHex = units.toString(16)
    return {
      receiver,
      value: '0',
      gasLimit: 6_000_000,
      data: `ESDTTransfer@${tokenHex}@${amtHex}`,
      chainID: '1',
    }
  }

  // Ne jamais substituer un intent d'achat/vente par un bootstrap
  const action = String(entry.action || '').toUpperCase()
  if (action.includes('BUY') || action.includes('SELL') || action.includes('SWAP')) {
    throw new Error(
      `Intent ${action} sans route on-chain valide pour ${asset} — bootstrap refusé`,
    )
  }

  return buildBootstrapLiveTx()
}

export function describeTx(draft: MxTxDraft): string {
  const egld = Number(draft.value) / 1e18
  return `${egld > 0 ? `${egld} EGLD` : 'ESDT'} → ${draft.receiver.slice(0, 12)}… · gas ${draft.gasLimit}`
}
