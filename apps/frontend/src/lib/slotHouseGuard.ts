/**
 * Slot house emergency stop — front-end gate if progressive/house too low.
 * Audit §3: houseBalance < jackpotThreshold → block REAL spins.
 */

import { SLOT_ASSET_CONFIG, type SlotAsset } from '../config/slotEconomy'

const STORAGE_KEY = 'xartists_slot_house_egld'

/** Cached house balance in EGLD (owner/ops can set after fund) */
export function getCachedHouseEgld(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function setCachedHouseEgld(egld: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(egld))
  } catch {
    /* */
  }
}

/** Max table grand for asset at max mult — conservative jackpot threshold */
export function jackpotThresholdEgld(asset: SlotAsset = 'EGLD'): number {
  const cfg = SLOT_ASSET_CONFIG[asset]
  return cfg.payouts.grandBonus * 10 // max mult × grand
}

export type HouseGuardResult = {
  ok: boolean
  reason?: string
  house: number | null
  threshold: number
}

/**
 * If house unknown → allow paper only messaging; if known and low → stop REAL.
 * Ops should call setCachedHouseEgld after funding SC.
 */
export function canSpinRealAgainstHouse(asset: SlotAsset = 'EGLD'): HouseGuardResult {
  const threshold = jackpotThresholdEgld(asset)
  const house = getCachedHouseEgld()
  if (house == null) {
    return {
      ok: true,
      reason: 'House balance non renseignée — ops: setCachedHouseEgld après fund',
      house: null,
      threshold,
    }
  }
  if (house < threshold) {
    return {
      ok: false,
      reason: `Emergency stop: house ${house} EGLD < seuil jackpot ${threshold}`,
      house,
      threshold,
    }
  }
  return { ok: true, house, threshold }
}

/** Fetch SC EGLD balance from MultiversX API (best-effort) */
export async function refreshHouseFromApi(scAddress: string): Promise<number | null> {
  try {
    const r = await fetch(
      `https://api.multiversx.com/accounts/${scAddress}?fields=balance`,
      { cache: 'no-store' },
    )
    if (!r.ok) return null
    const j = (await r.json()) as { balance?: string }
    if (!j.balance) return null
    const atomic = BigInt(j.balance)
    const egld = Number(atomic) / 1e18
    setCachedHouseEgld(egld)
    return egld
  } catch {
    return null
  }
}
