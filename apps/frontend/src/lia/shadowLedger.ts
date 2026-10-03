/**
 * Shadow Treasury — virtual balances + friction (fees/slippage).
 * NEVER writes a MultiversX TX.
 */

const KEY = 'xartists_lia_shadow_ledger_v1'
const LOG_KEY = 'xartists_lia_shadow_log_v1'

export type ShadowBalances = {
  EGLD: number
  TRO: number
  USDC: number
  updatedAt: number
}

export type ShadowFill = {
  id: string
  side: 'BUY' | 'SELL' | 'STAKE' | 'COMPOUND' | 'HOLD' | 'FLATTEN'
  asset: string
  amount: number
  price: number
  feeEgld: number
  slippagePct: number
  strategy: string
  paper: true
  at: number
}

const DEFAULT: ShadowBalances = {
  EGLD: 10,
  TRO: 1000,
  USDC: 100,
  updatedAt: 0,
}

export function loadShadowBalances(): ShadowBalances {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT, updatedAt: Date.now() }
    const j = JSON.parse(raw) as ShadowBalances
    return {
      EGLD: Number(j.EGLD) || 0,
      TRO: Number(j.TRO) || 0,
      USDC: Number(j.USDC) || 0,
      updatedAt: j.updatedAt || Date.now(),
    }
  } catch {
    return { ...DEFAULT, updatedAt: Date.now() }
  }
}

function saveBalances(b: ShadowBalances) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b))
  } catch {
    /* */
  }
}

export function loadShadowLog(limit = 40): ShadowFill[] {
  try {
    const j = JSON.parse(localStorage.getItem(LOG_KEY) || '[]') as ShadowFill[]
    return Array.isArray(j) ? j.slice(-limit) : []
  } catch {
    return []
  }
}

function pushLog(row: ShadowFill) {
  const prev = loadShadowLog(200)
  prev.push(row)
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(prev.slice(-200)))
  } catch {
    /* */
  }
}

/** Estimate friction from liquidity (0–1 scale) */
export function estimateSlippagePct(liquidity: number, amount: number): number {
  const depth = Math.max(liquidity, 0.05)
  const impact = Math.min(2.5, (amount / (depth * 100)) * 100)
  return Math.max(0.05, impact)
}

const GAS_EGLD = 0.0008

/**
 * Apply a paper intent to the shadow ledger.
 */
export function applyShadowIntent(opts: {
  strategy: string
  side: ShadowFill['side']
  asset: string
  amount: number
  price: number
  liquidity: number
}): ShadowFill {
  const bal = loadShadowBalances()
  const slip = estimateSlippagePct(opts.liquidity, opts.amount)
  const fee = GAS_EGLD
  let amount = opts.amount

  if (opts.side === 'BUY' && opts.asset === 'EGLD') {
    const cost = amount * opts.price * (1 + slip / 100) + fee
    if (bal.USDC >= cost) {
      bal.USDC -= cost
      bal.EGLD += amount
    } else {
      amount = 0
    }
  } else if (opts.side === 'SELL' && opts.asset === 'EGLD') {
    const qty = Math.min(amount, bal.EGLD)
    bal.EGLD -= qty
    bal.USDC += qty * opts.price * (1 - slip / 100)
    bal.USDC = Math.max(0, bal.USDC - fee)
    amount = qty
  } else if (opts.side === 'STAKE' || opts.side === 'COMPOUND') {
    // mark-only for TRO path
    bal.TRO = Math.max(0, bal.TRO)
    bal.EGLD = Math.max(0, bal.EGLD - fee)
  } else if (opts.side === 'FLATTEN') {
    bal.USDC += bal.EGLD * opts.price * (1 - slip / 100)
    bal.EGLD = 0
  }

  bal.updatedAt = Date.now()
  saveBalances(bal)

  const fill: ShadowFill = {
    id: `sh_${Date.now().toString(36)}`,
    side: opts.side,
    asset: opts.asset,
    amount,
    price: opts.price,
    feeEgld: fee,
    slippagePct: slip,
    strategy: opts.strategy,
    paper: true,
    at: Date.now(),
  }
  pushLog(fill)
  return fill
}

export function resetShadowLedger() {
  saveBalances({ ...DEFAULT, updatedAt: Date.now() })
  try {
    localStorage.removeItem(LOG_KEY)
  } catch {
    /* */
  }
}
