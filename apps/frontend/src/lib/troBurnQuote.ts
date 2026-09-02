/** Mirror SC quoteReward — human TRO → EGLD split for UI estimate. */
export type BurnQuote = {
  rewardTotalEgld: number
  toUserEgld: number
  toProtocolEgld: number
  wholeTro: number
  capped: boolean
}

export function quoteBurnReward(
  humanTro: number,
  opts?: {
    egldPerWholeTro?: number
    protocolFeeBps?: number
    poolEgld?: number
  }
): BurnQuote {
  const egldPer = opts?.egldPerWholeTro ?? 0.001
  const feeBps = opts?.protocolFeeBps ?? 1000
  const pool = opts?.poolEgld ?? Number.POSITIVE_INFINITY
  if (!Number.isFinite(humanTro) || humanTro <= 0) {
    return { rewardTotalEgld: 0, toUserEgld: 0, toProtocolEgld: 0, wholeTro: 0, capped: false }
  }
  const whole = Math.floor(humanTro)
  let total = whole * egldPer
  let capped = false
  if (total > pool) {
    total = Math.max(0, pool)
    capped = true
  }
  const fee = (total * feeBps) / 10_000
  return {
    rewardTotalEgld: total,
    toUserEgld: total - fee,
    toProtocolEgld: fee,
    wholeTro: whole,
    capped,
  }
}
