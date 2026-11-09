/**
 * Public paper command. Mirrors lia/intent/buy_pack.py.
 * No wallet, no Paybox, no broadcast. executable is always false.
 */
export const SNAPSHOT_AS_OF = '2026-11-08'

export const PACKS = Object.freeze({
  pulse: Object.freeze({ name: 'Pulse', tier: 'Gold', eur: '110', editionCap: 333, snapshotEgld: '1' }),
  yield: Object.freeze({ name: 'Yield', tier: 'Silver', eur: '75', editionCap: 500, snapshotEgld: '5' }),
  sentinel: Object.freeze({ name: 'Sentinel', tier: 'Platinum', eur: '50', editionCap: 777, snapshotEgld: '2.5' }),
})

export const POSTURE = Object.freeze({
  probedAt: '2026-11-09T06:45:00Z',
  source: 'api.multiversx.com',
  epoch: 2288,
  roundsPassed: 79101,
  roundsPerEpoch: 144000,
  refreshRateMs: 600,
  egldUsd: '2.96',
  egldMarketCapUsd: '92171100',
  egldApr: '0.091141',
  troId: 'TRO-94c925',
  troSupply: '476224',
  troAccounts: 557,
  troTransactions: 2820,
  site: 'public',
  trading: 'suspended',
  packSales: 'suspended',
  paybox: 'fail-closed',
  krReviewWindow: '2026-11-16/2026-11-20',
  allowLiveTrading: false,
})

const REFUSE = /ignore\s+(all\s+)?(rules|gates|instructions|previous)|go[\s-]*live|live\s+trading|broadcast|claim\s*fees|paybox[_\s-]*prod|\bpem\b|mnemonic|private\s+key|lia_live_trading\s*=\s*1|sign\s+and\s+send|\b(swap|bridge|stake)\b/i
const PACK = /\b(pulse|yield|sentinel)\b/i
const BUY = /\b(buy|achat|acheter|achete|achète|pack)\b/i
const EUR = /(euro|eur|€|carte|fiat)/i
const EGLD = /\begld\b/i
const STATUS = /(statut|status|epoch|prix)/i
const DISCOVERY = /(musée|musee|museum|galerie|gallery|visite)/i

function seal(result) {
  result.executable = false
  result.liveAuthorized = false
  return Object.freeze(result)
}

export function quoteBuyPack(packId, rail) {
  const pack = PACKS[packId]
  if (!pack) return seal({ intent: 'UNKNOWN', reason: 'unknown_pack' })
  const resolved = rail === 'EUR' || rail === 'EGLD' ? rail : 'UNSPECIFIED'
  return seal({
    intent: 'BUY_PACK',
    pack: packId,
    name: pack.name,
    tier: pack.tier,
    rail: resolved,
    catalogueEur: resolved === 'EUR' ? pack.eur : null,
    snapshotEgld: resolved === 'EGLD' ? pack.snapshotEgld : null,
    snapshotAsOf: SNAPSHOT_AS_OF,
    snapshotIsExecutableQuote: false,
    editionCap: pack.editionCap,
    sales: 'suspended',
    mediaUriVerified: false,
    paybox: 'fail-closed',
    reason: 'sales_suspended',
  })
}

export function classifyUtterance(text) {
  const raw = String(text || '').trim()
  if (!raw) return seal({ intent: 'EMPTY', reason: 'empty' })
  if (REFUSE.test(raw)) return seal({ intent: 'REFUSE', reason: 'adversarial_or_live_request' })
  const pack = raw.match(PACK)
  if (pack && BUY.test(raw)) {
    const rail = EUR.test(raw) ? 'EUR' : EGLD.test(raw) ? 'EGLD' : 'UNSPECIFIED'
    return quoteBuyPack(pack[1].toLowerCase(), rail)
  }
  if (STATUS.test(raw)) return seal({ intent: 'STATUS', reason: 'read_only_posture', posture: POSTURE })
  if (DISCOVERY.test(raw)) return seal({ intent: 'DISCOVERY', reason: 'public_navigation' })
  return seal({ intent: 'UNKNOWN', reason: 'unrecognised' })
}
