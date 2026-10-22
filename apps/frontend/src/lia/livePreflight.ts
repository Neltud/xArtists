import { MAINNET_CODEHASH } from '../config/contracts'
import { assertLiveRisk, type MxTxDraft } from './buildIntentTx'
import type { JournalEntry } from './intentJournal'

/** Read-only checks. Calling this function never signs or broadcasts. */
export async function preflightLiveDraft(
  draft: MxTxDraft,
  entries: JournalEntry[],
  now = Date.now(),
): Promise<{ usdNotional: number }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const responses = await Promise.all([
      fetch('https://api.multiversx.com/economics', { cache: 'no-store', signal: controller.signal }),
      fetch(`https://api.multiversx.com/accounts/${encodeURIComponent(draft.receiver)}`, { cache: 'no-store', signal: controller.signal }),
    ])
    if (responses.some(response => !response.ok)) throw new Error('Prix ou contrat non vérifiable. Signature bloquée.')
    const [economics, receiver] = await Promise.all(responses.map(response => response.json()))
    if (receiver.codeHash !== MAINNET_CODEHASH.treasury_splitter) throw new Error('Code du contrat destinataire différent de la référence vérifiée.')
    const price = Number(economics.price)
    if (!Number.isFinite(price) || price <= 0) throw new Error('Cours EGLD/USD indisponible.')
    const usdNotional = Number(draft.value) / 1e18 * price
    let dailySpentUsd = 0
    for (const entry of entries) {
      if (!['pending', 'executed'].includes(entry.status) || entry.updatedAt < now - 86_400_000) continue
      if (!Number.isFinite(entry.usdNotional) || (entry.usdNotional ?? -1) <= 0) throw new Error('Budget journalier incomplet : une opération doit être réconciliée.')
      dailySpentUsd += entry.usdNotional!
    }
    assertLiveRisk({ usdNotional, dailySpentUsd })
    return { usdNotional }
  } finally {
    clearTimeout(timeout)
  }
}
