/**
 * Bridge navigateur : events `lia-intent` → journal local + webhook Vellum (optionnel).
 * PEM jamais ici — exécution réelle = Vellum / wallet user.
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

/** Webhook Vellum / MCP proxy — définir VITE_VELLUM_8008_WEBHOOK en build si dispo */
function vellumWebhookUrl(): string | null {
  const u = (import.meta.env.VITE_VELLUM_8008_WEBHOOK as string | undefined)?.trim()
  return u || null
}

async function forwardToVellum(entry: IntentJournalEntry): Promise<IntentJournalEntry> {
  const url = vellumWebhookUrl()
  if (!url) {
    return { ...entry, vellum: 'skipped', vellumDetail: 'no VITE_VELLUM_8008_WEBHOOK' }
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow: AGENT_8008.endpoints.vellumWorkflow,
        agent: AGENT_8008.id,
        intent: entry.type,
        paper: entry.paper,
        payload: entry.payload,
        ts: entry.ts,
      }),
    })
    if (!res.ok) {
      return { ...entry, vellum: 'error', vellumDetail: `HTTP ${res.status}` }
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

/** Appeler une fois depuis main.tsx */
export function startAgent8008Bridge() {
  if (typeof window === 'undefined' || started) return
  started = true
  window.addEventListener('lia-intent', (e: Event) => {
    const ce = e as CustomEvent
    void handleLiaIntentDetail(ce.detail)
  })
}
