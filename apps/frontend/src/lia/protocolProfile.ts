/**
 * Public LIA protocol wallet — MultiversX API only (no secrets).
 */
import { LIA_WALLET } from '../config/links'

const API = 'https://api.multiversx.com'

export type ProtocolToken = {
  identifier: string
  ticker: string
  balance: number
  decimals: number
  valueUsd: number | null
}

export type ProtocolProfile = {
  address: string
  egld: number
  egldUsd: number | null
  tokens: ProtocolToken[]
  txCount: number | null
  fetchedAt: number
  error?: string
}

function num(x: unknown): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}

export async function fetchProtocolProfile(): Promise<ProtocolProfile> {
  const address = LIA_WALLET
  try {
    const [acc, toks, econ] = await Promise.all([
      fetch(`${API}/accounts/${address}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`${API}/accounts/${address}/tokens?size=30`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`${API}/economics`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
    const egldPrice = num(econ?.price)
    const egld = num(acc?.balance) / 1e18
    const tokens: ProtocolToken[] = []
    if (Array.isArray(toks)) {
      for (const t of toks) {
        const decimals = num(t.decimals) || 18
        const balance = num(t.balance) / Math.pow(10, decimals)
        if (balance <= 0) continue
        const price = t.price != null ? num(t.price) : null
        tokens.push({
          identifier: String(t.identifier || ''),
          ticker: String(t.ticker || t.identifier?.split('-')[0] || ''),
          balance,
          decimals,
          valueUsd: price != null ? balance * price : null,
        })
      }
    }
    tokens.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))
    return {
      address,
      egld,
      egldUsd: egldPrice > 0 ? egld * egldPrice : null,
      tokens: tokens.slice(0, 12),
      txCount: acc?.txCount != null ? num(acc.txCount) : null,
      fetchedAt: Date.now(),
    }
  } catch (e) {
    return {
      address,
      egld: 0,
      egldUsd: null,
      tokens: [],
      txCount: null,
      fetchedAt: Date.now(),
      error: e instanceof Error ? e.message : 'fetch failed',
    }
  }
}
