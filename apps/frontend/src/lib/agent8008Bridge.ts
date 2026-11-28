/** Journal local des intentions. Aucun réseau, signature ou exécution. */
import { AGENT_8008, isAgent8008Intent } from '../config/agent8008'

const JOURNAL_KEY = 'xartists_8008_intent_journal'
const MAX_JOURNAL = 40

export type IntentJournalEntry = {
  ts: string
  type: string
  agent: string
  paper: boolean
  payload: Record<string, unknown>
  delivery: 'local_only' | 'unsupported'
}

function readJournal(): IntentJournalEntry[] {
  try {
    const raw:unknown=JSON.parse(localStorage.getItem(JOURNAL_KEY)||'[]')
    if(!Array.isArray(raw))return []
    return raw.filter(x=>x&&typeof x==='object'&&typeof x.type==='string'&&typeof x.ts==='string').slice(0,MAX_JOURNAL).map(x=>({ts:x.ts,type:x.type,agent:String(x.agent||AGENT_8008.id),paper:true,payload:{},delivery:isAgent8008Intent(x.type)?'local_only':'unsupported'}))
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

function normalizeType(raw: unknown): string {
  if (typeof raw === 'string' && raw) return raw
  return 'UNKNOWN'
}

export async function handleLiaIntentDetail(detail: unknown): Promise<IntentJournalEntry | null> {
  if (!detail || typeof detail !== 'object') return null
  const d = detail as Record<string, unknown>
  const lip = (d.lip && typeof d.lip === 'object' ? d.lip : d) as Record<string, unknown>
  const type = normalizeType(lip.type)
  const paper = true
  const entry: IntentJournalEntry = {
    ts: new Date().toISOString(),
    type,
    agent: String(lip.agent || AGENT_8008.id),
    paper,
    payload: {},
    delivery: isAgent8008Intent(type)?'local_only':'unsupported',
  }
  const final=entry
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
  // The former xartists:pulse -> PULSE_HYPE bridge was fed by an 8s
  // simulated cycle. Disabled until provenance and source timestamps can
  // be authenticated server-side. Never forward browser-only market claims.

}
