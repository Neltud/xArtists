/**
 * Hatom Lending — builders TX MultiversX (mainnet addresses docs.hatom.com).
 * mint / redeem / borrow / repay — validation manuelle xPortal.
 */
import { type PreparedTx, HF_MIN_SAFE, computeHealthFactor } from './types'

export const HATOM = {
  controller: 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr',
  markets: {
    EGLD: {
      address: 'erd1qqqqqqqqqqqqqpgq35qkf34a8svu4r2zmfzuztmeltqclapv78ss5jleq3',
      hToken: 'HEGLD-d61095',
      decimals: 18,
    },
    USDC: {
      address: 'erd1qqqqqqqqqqqqqpgqkrgsvct7hfx7ru30mfzk3uy6pxzxn6jj78ss84aldu',
      hToken: 'HUSDC-d80042',
      token: 'USDC-c76f1f',
      decimals: 6,
    },
    USDT: {
      address: 'erd1qqqqqqqqqqqqqpgqvxn0cl35r74tlw2a8d794v795jrzfxyf78sstg8pjr',
      hToken: 'HUSDT-6f0914',
      token: 'USDT-f8cf68',
      decimals: 6,
    },
  },
  dapp: 'https://app.hatom.com',
} as const

function toAtomic(amount: number, decimals: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0'
  const s = (amount * 10 ** decimals).toFixed(0)
  return s.replace(/\.0+$/, '')
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Supply EGLD → mint HEGLD (payable mint) */
export function buildHatomSupplyEgld(amountEgld: number): PreparedTx {
  const value = toAtomic(amountEgld, 18)
  return {
    protocol: 'hatom',
    action: 'supply_egld',
    receiver: HATOM.markets.EGLD.address,
    value,
    data: 'mint',
    gasLimit: 20_000_000,
    chainId: '1',
    summary: `Hatom supply ${amountEgld} EGLD → HEGLD`,
    riskNote: `Health Factor min recommandé ${HF_MIN_SAFE} si emprunt actif.`,
  }
}

/** Supply ESDT (USDC/USDT) via ESDTTransfer@token@amount@mint */
export function buildHatomSupplyEsdt(
  market: 'USDC' | 'USDT',
  amount: number,
): PreparedTx {
  const m = HATOM.markets[market]
  const token = m.token
  const atomic = toAtomic(amount, m.decimals)
  const data = `ESDTTransfer@${strToHex(token)}@${BigInt(atomic).toString(16)}@${strToHex('mint')}`
  return {
    protocol: 'hatom',
    action: `supply_${market.toLowerCase()}`,
    receiver: m.address,
    value: '0',
    data,
    gasLimit: 25_000_000,
    chainId: '1',
    summary: `Hatom supply ${amount} ${market} → ${m.hToken}`,
    riskNote: `Vérifier solde ${token} avant signature xPortal.`,
  }
}

/** Withdraw / redeem underlying from hToken (redeem) */
export function buildHatomWithdraw(
  market: 'EGLD' | 'USDC' | 'USDT',
  hTokenAmount: number,
): PreparedTx {
  const m = HATOM.markets[market]
  const decimals = market === 'EGLD' ? 18 : m.decimals
  const atomic = toAtomic(hTokenAmount, decimals)
  const data = `ESDTTransfer@${strToHex(m.hToken)}@${BigInt(atomic).toString(16)}@${strToHex('redeem')}`
  return {
    protocol: 'hatom',
    action: `withdraw_${market.toLowerCase()}`,
    receiver: m.address,
    value: '0',
    data,
    gasLimit: 25_000_000,
    chainId: '1',
    summary: `Hatom withdraw ${hTokenAmount} ${m.hToken}`,
  }
}

/** Borrow underlying (borrow@amount) — requires collateral */
export function buildHatomBorrow(
  market: 'EGLD' | 'USDC' | 'USDT',
  amount: number,
  position?: { collateralUsd: number; borrowUsd: number },
): PreparedTx {
  const m = HATOM.markets[market]
  const decimals = market === 'EGLD' ? 18 : m.decimals
  const atomic = toAtomic(amount, decimals)
  const data = `borrow@${BigInt(atomic).toString(16)}`
  let riskNote = `Emprunt risqué — HF min ${HF_MIN_SAFE}.`
  if (position) {
    const hfAfter = computeHealthFactor({
      collateralUsd: position.collateralUsd,
      borrowUsd: position.borrowUsd + amount * (market === 'EGLD' ? 4 : 1),
    })
    riskNote = `HF estimé après ≈ ${hfAfter >= 999 ? '∞' : hfAfter.toFixed(2)} (indicatif).`
  }
  return {
    protocol: 'hatom',
    action: `borrow_${market.toLowerCase()}`,
    receiver: m.address,
    value: '0',
    data,
    gasLimit: 30_000_000,
    chainId: '1',
    summary: `Hatom borrow ${amount} ${market}`,
    riskNote,
  }
}

/** Repay ESDT debt */
export function buildHatomRepay(
  market: 'USDC' | 'USDT',
  amount: number,
): PreparedTx {
  const m = HATOM.markets[market]
  const atomic = toAtomic(amount, m.decimals)
  const data = `ESDTTransfer@${strToHex(m.token)}@${BigInt(atomic).toString(16)}@${strToHex('repayBorrow')}`
  return {
    protocol: 'hatom',
    action: `repay_${market.toLowerCase()}`,
    receiver: m.address,
    value: '0',
    data,
    gasLimit: 25_000_000,
    chainId: '1',
    summary: `Hatom repay ${amount} ${market}`,
  }
}

export { computeHealthFactor, HF_MIN_SAFE }
