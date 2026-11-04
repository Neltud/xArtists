import { CandidateSchema } from './schema.js'
import type { Candidate } from './schema.js'

/** Narrow, anchored fallback. Multi-action text and arbitrary trailing instructions clarify. */
export function classifyPackCommand(raw: string): Candidate {
  const match = raw.trim().match(/^(?:ach[eè]te(?:-moi)?|acheter|buy)\s+(?:(?:le|un|the|a)\s+)?pack\s+(pulse|yield|sentinel)(?:\s+(?:à|pour|at|for)\s+(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|EUR))?(?:\s+(?:et envoie le NFT sur mon wallet|and send the NFT to my wallet))?[.!]?$/i)
  if (!match) return { type: 'UNKNOWN', confidence: 0, slots: {} }
  return CandidateSchema.parse({ type: 'BUY_PACK', confidence: 0.95,
    slots: { packTier: match[1]!.toLowerCase(), ...(match[2] ? { amount: match[2].replace(',', '.'), currency: 'EUR' } : {}) },
  })
}

export function parseCandidate(input: unknown): Candidate | null {
  try {
    if (typeof input === 'string') {
      if (input.length > 16_384) return null
      input = JSON.parse(input)
    }
    const result = CandidateSchema.safeParse(input)
    return result.success ? result.data : null
  } catch { return null }
}
