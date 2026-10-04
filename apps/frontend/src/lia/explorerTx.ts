/** Last transactions for public LIA wallet — MultiversX API. */
import { LIA_WALLET } from '../config/links'

const API = 'https://api.multiversx.com'

export type ExplorerTx = {
  hash: string
  status: string
  timestamp: number
  valueEgld: number
  function?: string
  sender: string
  receiver: string
}

export async function fetchRecentTx(limit = 8): Promise<ExplorerTx[]> {
  try {
    const r = await fetch(
      `${API}/accounts/${LIA_WALLET}/transactions?size=${limit}&order=desc`,
      { cache: 'no-store' },
    )
    if (!r.ok) return []
    const list = await r.json()
    if (!Array.isArray(list)) return []
    return list.map((t: Record<string, unknown>) => ({
      hash: String(t.txHash || t.hash || ''),
      status: String(t.status || ''),
      timestamp: Number(t.timestamp) || 0,
      valueEgld: Number(t.value || 0) / 1e18,
      function: t.function ? String(t.function) : undefined,
      sender: String(t.sender || ''),
      receiver: String(t.receiver || ''),
    }))
  } catch {
    return []
  }
}
