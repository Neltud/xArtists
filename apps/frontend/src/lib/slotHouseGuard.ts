/**
 * Slot house gate — REAL spins only if SC balance confirmed on-chain.
 * Seed: native EGLD transfer to Slot SC (and optional fundProgressiveEgld).
 */

import { SLOT_ASSET_CONFIG, type SlotAsset } from '../config/slotEconomy'

const STORAGE_KEY = 'xartists_slot_house_egld'

/** Minimum EGLD on SC to open REAL (dust genesis). Below → simulation only. */
export const MIN_HOUSE_OPEN_EGLD = 0.5

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

/** Conservative reserve for max table grand */
export function jackpotThresholdEgld(asset: SlotAsset = 'EGLD'): number {
  const cfg = SLOT_ASSET_CONFIG[asset]
  return cfg.payouts.grandBonus * 10
}

export type HouseGuardResult = {
  ok: boolean
  reason?: string
  house: number | null
  threshold: number
  fullHouse: boolean
}

/**
 * REAL spin only if house balance known and >= MIN_HOUSE_OPEN_EGLD.
 * Unknown / 0 → simulation (fail-closed seed).
 */
export function canSpinRealAgainstHouse(asset: SlotAsset = 'EGLD'): HouseGuardResult {
  const threshold = jackpotThresholdEgld(asset)
  const house = getCachedHouseEgld()

  if (house == null) {
    return {
      ok: false,
      reason: 'Caisse non confirmée — en attente du financement on-chain',
      house: null,
      threshold,
      fullHouse: false,
    }
  }

  if (house < MIN_HOUSE_OPEN_EGLD) {
    return {
      ok: false,
      reason: `Caisse insuffisante (${house.toFixed(3)} EGLD) — seed min ${MIN_HOUSE_OPEN_EGLD} EGLD`,
      house,
      threshold,
      fullHouse: false,
    }
  }

  const fullHouse = house >= threshold
  return {
    ok: true,
    house,
    threshold,
    fullHouse,
    reason: fullHouse
      ? undefined
      : `Caisse OK pour spins dust · réserve jackpot cible ${threshold} EGLD`,
  }
}

/** Fetch SC EGLD balance from MultiversX API */
export async function refreshHouseFromApi(scAddress: string): Promise<number | null> {
  if (!scAddress || !scAddress.startsWith('erd1')) return null
  try {
    const r = await fetch(`https://api.multiversx.com/accounts/${scAddress}`, {
      cache: 'no-store',
    })
    if (!r.ok) return null
    const j = (await r.json()) as { balance?: string }
    if (j.balance == null) return null
    const atomic = BigInt(j.balance)
    const egld = Number(atomic) / 1e18
    setCachedHouseEgld(egld)
    return egld
  } catch {
    return null
  }
}
