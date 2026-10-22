/**
 * Journal d’intents + suivi signature xPortal.
 * Live = VITE_LIA_LIVE_TRADING=1 · toujours user-sign, jamais PEM autonome.
 */
import { LIA_GUARDS, LIA_LIVE_TRADING } from '../config/liaConfig'
import { prepareIntentTx, describeTx } from './buildIntentTx'
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
  sessionHint?: string
  usdNotional?: number
  at: number
  updatedAt: number
  paper: boolean
  liveTrading: boolean
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

export function estimateTheoreticalPnlUsd(item: {
  amount: number
  confidence: number
  action: string
}): number {
  const notional = Math.min(Math.abs(item.amount) || 1, LIA_GUARDS.maxUsdPerTrade)
  const edge = (item.confidence || 0.5) * 0.004
  const dir = /sell|short/i.test(item.action) ? -1 : 1
  return Number((notional * edge * dir).toFixed(4))
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
    paper: !LIA_LIVE_TRADING,
    liveTrading: LIA_LIVE_TRADING,
  }
}

export function syncFeedIntoJournal(): JournalEntry[] {
  const feed = loadIntentFeed(MAX)
  const prev = loadRaw()
  const byId = new Map(prev.map(e => [e.id, e]))
  for (const f of feed) {
    if (byId.has(f.id)) continue
    byId.set(f.id, feedItemToEntry(f))
  }
  const merged = Array.from(byId.values()).sort((a, b) => a.at - b.at)
  save(merged)
  return merged.slice(-MAX)
}

/** Injecte un intent d’amorce live si le journal est vide. */
export function ensureBootstrapIntent(): JournalEntry {
  const all = loadRaw()
  const existing = all.find(e => e.id.startsWith('bootstrap-live-'))
  if (existing) return existing
  const entry: JournalEntry = {
    id: `bootstrap-live-${Date.now()}`,
    strategy: 'LIVE_BOOTSTRAP',
    action: 'BOOTSTRAP_LIVE_1',
    assetId: 'EGLD',
    amount: LIA_GUARDS.bootstrapEgld,
    confidence: 1,
    reason:
      'Amorçage trading live = 1 · micro-EGLD vers treasury_splitter · signature xPortal wallet LIA',
    theoreticalPnlUsd: 0,
    status: 'paper',
    at: Date.now(),
    updatedAt: Date.now(),
    paper: !LIA_LIVE_TRADING,
    liveTrading: LIA_LIVE_TRADING,
  }
  all.push(entry)
  save(all)
  return entry
}

export function loadJournal(limit = 20): JournalEntry[] {
  let entries = syncFeedIntoJournal()
  if (LIA_LIVE_TRADING && entries.length === 0) {
    ensureBootstrapIntent()
    entries = loadRaw()
  }
  return entries.slice(-limit).reverse()
}

export function markAwaitingSignature(id: string): JournalEntry | null {
  const all = loadRaw()
  const i = all.findIndex(e => e.id === id)
  if (i < 0) return null
  if (['pending', 'executed'].includes(all[i].status)) return null
  all[i] = { ...all[i], status: 'awaiting_signature', updatedAt: Date.now() }
  save(all)
  return all[i]
}

export function markPending(id: string, sessionHint?: string, usdNotional?: number): JournalEntry | null {
  const all = loadRaw()
  const i = all.findIndex(e => e.id === id)
  if (i < 0) return null
  all[i] = {
    ...all[i],
    status: 'pending',
    updatedAt: Date.now(),
    ...(sessionHint ? { sessionHint } : {}),
    ...(usdNotional != null ? { usdNotional } : {}),
  }
  save(all)
  return all[i]
}

export function attachUserTxHash(id: string, txHash: string, ok: boolean): JournalEntry | null {
  const all = loadRaw()
  const normalizedHash = txHash.replace(/^0x/i, '').toLowerCase()
  if (all.some(entry => entry.id !== id && entry.txHash?.toLowerCase() === normalizedHash)) return null
  const i = all.findIndex(e => e.id === id)
  if (i < 0) return null
  all[i] = {
    ...all[i],
    txHash: normalizedHash,
    status: ok ? 'executed' : 'failed',
    updatedAt: Date.now(),
  }
  save(all)
  return all[i]
}

export function explorerTxUrl(txHash: string): string {
  const h = txHash.replace(/^0x/, '')
  return `https://explorer.multiversx.com/transactions/${h}`
}

export type UserSignPayload = {
  intentId: string
  mode: 'live_user_sign' | 'paper'
  liveTrading: boolean
  action: string
  assetId: string
  amount: number
  summary: string
  tx: {
    receiver: string
    value: string
    gasLimit: number
    data: string
    chainID: '1'
  } | null
  note: string
}

/**
 * Payload examinable côté UI. En paper : aucune TX.
 * En live : draft micro plafonné (buildTxFromIntent) — signature xPortal, jamais PEM.
 */
export function buildUserSignPayload(entry: JournalEntry): UserSignPayload {
  const summary = `${entry.action} · ${entry.amount} ${entry.assetId}`
  if (!LIA_LIVE_TRADING) {
    return {
      intentId: entry.id,
      mode: 'paper',
      liveTrading: false,
      action: entry.action,
      assetId: entry.assetId,
      amount: entry.amount,
      summary,
      tx: null,
      note: 'Paper — aucune transaction. LIA ne détient aucune clé.',
    }
  }
  const prepared = prepareIntentTx(entry)
  const draft = prepared.ok ? prepared.draft : null
  return {
    intentId: entry.id,
    mode: 'live_user_sign',
    liveTrading: true,
    action: entry.action,
    assetId: entry.assetId,
    amount: entry.amount,
    summary: draft ? describeTx(draft) : summary,
    tx: draft,
    note: prepared.ok
      ? 'Dépôt de vérification explicite · signature xPortal uniquement.'
      : prepared.reason,
  }
}
