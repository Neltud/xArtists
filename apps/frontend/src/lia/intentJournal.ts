/**
 * Journal d’intents paper + suivi signature utilisateur (xPortal).
 * Aucune clé PEM · aucun broadcast autonome.
 */
import { LIA_GUARDS, LIA_LIVE_TRADING, assertPaperOnly } from '../config/liaConfig'
import { loadIntentFeed, type FeedItem } from './intentFeed'

const KEY = 'xartists_lia_intent_journal_v1'
const MAX = 60

export type IntentStatus = 'paper' | 'awaiting_signature' | 'pending' | 'executed' | 'failed'

export type JournalEntry = {
  id: string
  strategy: string
  action: string
  assetId: string
  amount: number
  confidence: number
  reason: string
  theoreticalPnlUsd: number
  status: IntentStatus
  txHash?: string
  at: number
  updatedAt: number
  paper: true
  liveTrading: false
}

function loadRaw(): JournalEntry[] {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || '[]') as JournalEntry[]
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

function save(entries: JournalEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX)))
  } catch {
    /* quota */
  }
}

/** PnL théorique simple (paper) — pas un conseil financier. */
export function estimateTheoreticalPnlUsd(item: {
  amount: number
  confidence: number
  action: string
}): number {
  const notional = Math.min(Math.abs(item.amount) || 1, LIA_GUARDS.maxUsdPerTrade)
  const edge = (item.confidence || 0.5) * 0.004 // ~0.4% max edge paper
  const dir = /sell|short/i.test(item.action) ? -1 : 1
  return Number((notional * edge * dir).toFixed(4))
}

export function syncFeedIntoJournal(): JournalEntry[] {
  assertPaperOnly()
  const feed = loadIntentFeed(MAX)
  const prev = loadRaw()
  const byId = new Map(prev.map(e => [e.id, e]))
  for (const f of feed) {
    if (byId.has(f.id)) continue
    byId.set(f.id, feedItemToEntry(f))
  }
  const merged = Array.from(byId.values()).sort((a, b) => a.at - b.at)
  save(merged)
  return merged.slice(-40)
}

function feedItemToEntry(f: FeedItem): JournalEntry {
  return {
    id: f.id,
    strategy: f.strategy,
    action: f.action,
    assetId: f.assetId,
    amount: f.amount,
    confidence: f.confidence,
    reason: f.reason,
    theoreticalPnlUsd: estimateTheoreticalPnlUsd(f),
    status: 'paper',
    at: f.at,
    updatedAt: Date.now(),
    paper: true,
    liveTrading: false,
  }
}

export function loadJournal(limit = 20): JournalEntry[] {
  const entries = syncFeedIntoJournal()
  return entries.slice(-limit).reverse()
}

export function markAwaitingSignature(id: string): JournalEntry | null {
  assertPaperOnly()
  const all = loadRaw()
  const i = all.findIndex(e => e.id === id)
  if (i < 0) return null
  all[i] = { ...all[i], status: 'awaiting_signature', updatedAt: Date.now() }
  save(all)
  return all[i]
}

export function attachUserTxHash(id: string, txHash: string, ok: boolean): JournalEntry | null {
  assertPaperOnly()
  const all = loadRaw()
  const i = all.findIndex(e => e.id === id)
  if (i < 0) return null
  all[i] = {
    ...all[i],
    txHash: txHash.replace(/^0x/, ''),
    status: ok ? 'executed' : 'failed',
    updatedAt: Date.now(),
  }
  save(all)
  return all[i]
}

export type SwapIntentPayload = {
  mode: 'user_sign_xportal'
  liveTrading: false
  assetId: string
  action: string
  amount: number
  confidence: number
  theoreticalPnlUsd: number
  guards: typeof LIA_GUARDS
  note: string
}

export function buildUserSignPayload(entry: JournalEntry): SwapIntentPayload {
  void LIA_LIVE_TRADING
  return {
    mode: 'user_sign_xportal',
    liveTrading: false,
    assetId: entry.assetId,
    action: entry.action,
    amount: entry.amount,
    confidence: entry.confidence,
    theoreticalPnlUsd: entry.theoreticalPnlUsd,
    guards: LIA_GUARDS,
    note: 'Payload assistant uniquement — signature via wallet utilisateur (xPortal). LIA ne détient aucune clé.',
  }
}

export function explorerTxUrl(txHash: string): string {
  const h = txHash.replace(/^0x/, '')
  return `https://explorer.multiversx.com/transactions/${h}`
}
