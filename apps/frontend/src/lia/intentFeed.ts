/**
 * Task 3 — Paper intent feed (ring buffer in localStorage).
 * Populated by decision ticks; never signs TX.
 */
import type { Intent } from './types'
import type { AuraBridgeMode } from './types'

const KEY = 'xartists_lia_intent_feed_v1'
const MAX = 40

export type FeedItem = {
  id: string
  strategy: string
  action: string
  assetId: string
  amount: number
  confidence: number
  reason: string
  aura: AuraBridgeMode | string
  paper: true
  at: number
}

export function loadIntentFeed(limit = 20): FeedItem[] {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || '[]') as FeedItem[]
    return Array.isArray(j) ? j.slice(-limit) : []
  } catch {
    return []
  }
}

export function pushIntentFeed(
  intent: Intent,
  aura: AuraBridgeMode | string,
): FeedItem {
  const item: FeedItem = {
    id: intent.id,
    strategy: intent.strategy,
    action: intent.action,
    assetId: intent.assetId,
    amount: intent.amount,
    confidence: intent.confidence,
    reason: intent.reason,
    aura,
    paper: true,
    at: intent.at || Date.now(),
  }
  const prev = loadIntentFeed(MAX)
  prev.push(item)
  try {
    localStorage.setItem(KEY, JSON.stringify(prev.slice(-MAX)))
  } catch {
    /* */
  }
  return item
}
