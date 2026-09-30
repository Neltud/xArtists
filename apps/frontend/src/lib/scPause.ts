/**
 * Query SC pause flags (MultiversX view) — Circuit Breaker UI.
 */
import { SLOT_CASINO_ADDRESS } from '../config/scStatus'

const API = 'https://api.multiversx.com'

export type ScPauseState = {
  slotPaused: boolean | null
  checkedAt: number | null
  error: string | null
}

async function queryVmBool(address: string, func: string): Promise<boolean | null> {
  if (!address || address.length < 10) return null
  try {
    const r = await fetch(`${API}/vm-values/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scAddress: address, funcName: func, args: [] }),
    })
    if (!r.ok) return null
    const j = (await r.json()) as { data?: { data?: { returnData?: string[] } } }
    const raw = j?.data?.data?.returnData?.[0]
    if (raw == null) return null
    if (raw === '' || raw === 'AA==') return false
    if (raw === 'AQ==' || raw === 'AQ') return true
    try {
      const bin = atob(raw)
      return bin.length > 0 && bin.charCodeAt(bin.length - 1) !== 0
    } catch {
      return Boolean(raw && raw !== '00' && raw !== '0')
    }
  } catch {
    return null
  }
}

export async function fetchSlotPaused(address = SLOT_CASINO_ADDRESS): Promise<boolean | null> {
  for (const fn of ['isPaused', 'paused', 'getPaused']) {
    const v = await queryVmBool(address, fn)
    if (v !== null) return v
  }
  return null
}

export async function fetchScPauseState(): Promise<ScPauseState> {
  return { slotPaused: await fetchSlotPaused(), checkedAt: Date.now(), error: null }
}
