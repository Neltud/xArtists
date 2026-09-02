/**
 * Paper Sovereign reputation — local only until on-chain SBT.
 */

const KEY = 'xartists_paper_soul_v1'

export type PaperSoul = {
  score: number
  creator: number
  investor: number
  governance: number
  intents: number
  updated: string
}

const DEFAULT: PaperSoul = {
  score: 400,
  creator: 120,
  investor: 100,
  governance: 80,
  intents: 0,
  updated: new Date().toISOString(),
}

export function loadPaperSoul(): PaperSoul {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

export function savePaperSoul(s: PaperSoul): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

/** Bump scores after a successful intent parse (demo engagement). */
export function recordIntentActivity(action: string): PaperSoul {
  const s = loadPaperSoul()
  s.intents += 1
  s.score = Math.min(999, s.score + 2)
  if (/AGENT|PACK|CREATOR|STUDIO|NFT/i.test(action)) s.creator = Math.min(400, s.creator + 3)
  if (/BUY|INVEST|RWA|STAKE|TRO/i.test(action)) s.investor = Math.min(400, s.investor + 3)
  if (/DAO|VOTE|GOV/i.test(action)) s.governance = Math.min(400, s.governance + 4)
  s.score = Math.min(
    999,
    Math.round((s.creator + s.investor + s.governance) / 1.2 + s.intents)
  )
  s.updated = new Date().toISOString()
  savePaperSoul(s)
  return s
}

export function levelFor(n: number): 'Bronze' | 'Silver' | 'Gold' | 'Master' {
  if (n >= 300) return 'Master'
  if (n >= 200) return 'Gold'
  if (n >= 120) return 'Silver'
  return 'Bronze'
}
