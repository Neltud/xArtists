/**
 * LAB — QuantOracle (front-safe stubs).
 * Claude proposal was Polygon/Alchemy; xArtists primary chain = MultiversX.
 * Whale / hype scores feed Market page + LIA paper signals — no live trading.
 */

export type WhaleEvent = {
  type: 'WHALE_BUY' | 'WHALE_SELL' | 'LARGE_TRANSFER'
  asset: string
  valueUsd: number
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  chain: 'multiversx' | 'solana' | 'other'
  at: string
}

export type HypeScore = {
  assetId: string
  score: number
  sources: string[]
  at: string
}

const MVX_API = 'https://api.multiversx.com'

/**
 * Lecture légère MultiversX (pas de clé Alchemy requise en démo).
 * Whale = gros transferts token / NFT via API publique (échantillon).
 */
export class QuantOracle {
  constructor(
    private readonly apiBase = MVX_API,
    private readonly watchedTokens: string[] = ['TRO-94c925']
  ) {}

  /** Placeholder cycle — en prod: webhook / indexer */
  async pollWhaleOnce(): Promise<WhaleEvent | null> {
    try {
      const token = this.watchedTokens[0]
      if (!token) return null
      const r = await fetch(`${this.apiBase}/tokens/${token}`, { cache: 'no-store' })
      if (!r.ok) return null
      // Pas de vrai whale log en démo — signal paper synthétique si volume élevé
      const j = (await r.json()) as { accounts?: number; transactions?: number }
      const tx = j.transactions ?? 0
      if (tx > 10_000) {
        return {
          type: 'LARGE_TRANSFER',
          asset: token,
          valueUsd: 0,
          impact: 'MEDIUM',
          chain: 'multiversx',
          at: new Date().toISOString(),
        }
      }
    } catch {
      /* offline */
    }
    return null
  }

  /**
   * Hype score 0–1 : volume proxy + placeholder social.
   * Vellum / X API = couche payante séparée (pas dans ce stub).
   */
  async getHypeScore(assetId: string): Promise<HypeScore> {
    let onchain = 0.4
    try {
      const r = await fetch(`${this.apiBase}/tokens/${encodeURIComponent(assetId)}`, {
        cache: 'no-store',
      })
      if (r.ok) {
        const j = (await r.json()) as { accounts?: number; transactions?: number }
        const acc = j.accounts ?? 0
        const tx = j.transactions ?? 0
        onchain = Math.min(1, Math.log10(2 + acc) / 6 + Math.log10(2 + tx) / 8)
      }
    } catch {
      /* keep default */
    }
    // Social slot reserved for Vellum / X — neutral weight in demo
    const social = 0.5
    const score = Math.round((onchain * 0.65 + social * 0.35) * 100) / 100
    return {
      assetId,
      score,
      sources: ['multiversx-api', 'social-placeholder'],
      at: new Date().toISOString(),
    }
  }
}

export const quantOracle = new QuantOracle()
