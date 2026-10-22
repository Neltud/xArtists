/**
 * Drafts MultiversX examinables avant signature xPortal.
 * Un signal de trading ne devient jamais un transfert bootstrap implicite.
 */
import { LIA_GUARDS } from '../config/liaConfig'
import { TREASURY_SPLITTER_ADDRESS } from '../config/contracts'
import type { JournalEntry } from './intentJournal'

export type MxTxDraft = {
  receiver: string
  value: string
  gasLimit: number
  data: string
  chainID: '1'
}

/** Un dépôt de vérification explicite, pas une opération d'achat/vente. */
export function buildBootstrapLiveTx(): MxTxDraft {
  return {
    receiver: TREASURY_SPLITTER_ADDRESS,
    value: '1000000000000000',
    gasLimit: 6_000_000,
    data: 'receiveAndSplit',
    chainID: '1',
  }
}

/** Les autres actions nécessitent une cotation et un payload vérifiés du routeur. */
export function buildTxFromIntent(entry: JournalEntry): MxTxDraft {
  if (
    entry.strategy !== 'LIVE_BOOTSTRAP' ||
    entry.action !== 'BOOTSTRAP_LIVE_1' ||
    entry.assetId !== 'EGLD'
  ) {
    throw new Error('Cotation et transaction vérifiées requises pour cet intent. Aucun transfert de remplacement.')
  }
  if (!Number.isFinite(entry.amount) || entry.amount <= 0 || entry.amount > LIA_GUARDS.bootstrapEgld) {
    throw new Error('Montant bootstrap invalide : maximum 0.001 EGLD.')
  }
  const atomic = BigInt(Math.round(entry.amount * 1e18))
  if (atomic <= 0n) throw new Error('Montant bootstrap inférieur à une unité atomique.')
  return { ...buildBootstrapLiveTx(), value: atomic.toString() }
}

export function prepareIntentTx(entry: JournalEntry):
  | { ok: true; draft: MxTxDraft }
  | { ok: false; reason: string } {
  try {
    return { ok: true, draft: buildTxFromIntent(entry) }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Transaction indisponible.' }
  }
}

export function assertLiveRisk(input: { usdNotional: number; dailySpentUsd: number }): void {
  const { usdNotional, dailySpentUsd } = input
  if (!Number.isFinite(usdNotional) || usdNotional <= 0 || usdNotional > LIA_GUARDS.maxUsdPerTrade) {
    throw new Error('Montant USD non vérifié ou plafond de 15 $ dépassé.')
  }
  if (!Number.isFinite(dailySpentUsd) || dailySpentUsd < 0 || dailySpentUsd + usdNotional > LIA_GUARDS.maxUsdPerDay) {
    throw new Error('Budget journalier non vérifié ou plafond de 40 $ dépassé.')
  }
}

export function describeTx(draft: MxTxDraft): string {
  const egld = Number(draft.value) / 1e18
  return `${egld > 0 ? `${egld} EGLD` : 'ESDT'} → ${draft.receiver.slice(0, 12)}… · gas ${draft.gasLimit}`
}
