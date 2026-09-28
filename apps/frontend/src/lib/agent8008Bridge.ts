/**
 * Bridge navigateur : events `lia-intent` → journal local + webhook Vellum (optionnel).
 * PEM / Vellum API key JAMAIS ici — uniquement URL proxy (VITE_VELLUM_8008_WEBHOOK).
 */
import { AGENT_8008, isAgent8008Intent, type Agent8008Intent } from '../config/agent8008'

const JOURNAL_KEY = 'xartists_8008_intent_journal'
const MAX_JOURNAL = 40

export type IntentJournalEntry = {
  ts: string
  type: string
  agent: string
  paper: boolean
  payload: Record<string, unknown>
  vellum: 'skipped' | 'queued' | 'sent' | 'error'
  vellumDetail?: string
}

function readJournal(): IntentJournalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]') as IntentJournalEntry[]
  } catch {
    return []
  }
}

function writeJournal(entries: IntentJournalEntry[]) {
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries.slice(0, MAX_JOURNAL)))
  } catch {
    /* */
  }
}

export function get8008Journal(): IntentJournalEntry[] {
  return readJournal()
}

function vellumWebhookUrl(): string | null {
  const u = (import.meta.env.VITE_VELLUM_8008_WEBHOOK as string | undefined)?.trim()
  return u || null
}

function buildVellumProxyBody(entry: IntentJournalEntry) {
  return {
    workflow_deployment_name: AGENT_8008.endpoints.vellumWorkflow,
    external_id: `xa-8008-${entry.type}-${entry.ts}`,
    inputs: [
      { name: 'intent_type', type: 'STRING', value: entry.type },
      { name: 'agent_id', type: 'STRING', value: entry.agent },
      { name: 'paper', type: 'STRING', value: entry.paper ? 'true' : 'false' },
      { name: 'payload_json', type: 'STRING', value: JSON.stringify(entry.payload) },
      { name: 'ts', type: 'STRING', value: entry.ts },
    ],
    intent: entry.type,
    agent: entry.agent,
    paper: entry.paper,
    payload: entry.payload,
    ts: entry.ts,
  }
}

async function forwardToVellum(entry: IntentJournalEntry): Promise<IntentJournalEntry> {
  const url = vellumWebhookUrl()
  if (!url) {
    return { ...entry, vellum: 'skipped', vellumDetail: 'no VITE_VELLUM_8008_WEBHOOK' }
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildVellumProxyBody(entry)),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { ...entry, vellum: 'error', vellumDetail: `HTTP ${res.status} ${t.slice(0, 60)}` }
    }
    return { ...entry, vellum: 'sent', vellumDetail: 'ok' }
  } catch (e) {
    return {
      ...entry,
      vellum: 'error',
      vellumDetail: e instanceof Error ? e.message.slice(0, 80) : 'fetch failed',
    }
  }
}

function normalizeType(raw: unknown): string {
  if (typeof raw === 'string' && raw) return raw
  return 'UNKNOWN'
}

export async function handleLiaIntentDetail(detail: unknown): Promise<IntentJournalEntry | null> {
  if (!detail || typeof detail !== 'object') return null
  const d = detail as Record<string, unknown>
  const lip = (d.lip && typeof d.lip === 'object' ? d.lip : d) as Record<string, unknown>
  const type = normalizeType(lip.type)
  const paper = lip.paper !== false
  const entry: IntentJournalEntry = {
    ts: new Date().toISOString(),
    type,
    agent: String(lip.agent || AGENT_8008.id),
    paper,
    payload: { ...lip },
    vellum: isAgent8008Intent(type) ? 'queued' : 'skipped',
    vellumDetail: isAgent8008Intent(type) ? undefined : 'type not in 8008 allowlist',
  }
  let final = entry
  if (isAgent8008Intent(type as Agent8008Intent)) {
    final = await forwardToVellum(entry)
  }
  const journal = readJournal()
  journal.unshift(final)
  writeJournal(journal)
  window.dispatchEvent(new CustomEvent('xartists:8008-journal', { detail: final }))
  return final
}

let started = false

export function startAgent8008Bridge() {
  if (typeof window === 'undefined' || started) return
  started = true
  window.addEventListener('lia-intent', (e: Event) => {
    const ce = e as CustomEvent
    void handleLiaIntentDetail(ce.detail)
  })
  let lastHypeTs = 0
  window.addEventListener('xartists:pulse', (e: Event) => {
    const d = (e as CustomEvent).detail as {
      env?: { sentiment?: number; category?: string; vibe?: string; asset?: string }
    }
    const env = d?.env
    if (!env || typeof env.sentiment !== 'number') return
    if (env.sentiment < 0.55) return
    const now = Date.now()
    if (now - lastHypeTs < 60_000) return
    lastHypeTs = now
    void handleLiaIntentDetail({
      lip: {
        type: 'PULSE_HYPE',
        agent: AGENT_8008.id,
        paper: true,
        sentiment: env.sentiment,
        category: env.category,
        vibe: env.vibe,
        asset: env.asset,
        raw: `PULSE_HYPE ${env.category} sent=${env.sentiment}`,
      },
    })
  })
}
