/**
 * AshSwap stable pools — builders (add liquidity / stake LP).
 * Pool USDC/USDT/BUSD mainnet (explorer).
 */
import type { PreparedTx } from './types'

export const ASHSWAP = {
  /** Stable pool USDC/USDT/BUSD */
  stablePool: 'erd1qqqqqqqqqqqqqpgqs8p2v9wr8j48vqrmudcj94wu47kqra3r4fvshfyd9c',
  tokenAsh: 'ASH-a642d1',
  dapp: 'https://app.ashswap.io',
} as const

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function toAtomic(amount: number, decimals: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0'
  return (amount * 10 ** decimals).toFixed(0)
}

/**
 * Dépôt single-sided USDC vers pool stable (addLiquidity simplifié).
 * Pour multi-asset exact, préférer app.ashswap.io — ici payload de base.
 */
export function buildAshAddLiquidityUsdc(amountUsdc: number): PreparedTx {
  const atomic = toAtomic(amountUsdc, 6)
  const data = `ESDTTransfer@${strToHex('USDC-c76f1f')}@${BigInt(atomic).toString(16)}@${strToHex('addLiquidity')}`
  return {
    protocol: 'ashswap',
    action: 'add_liquidity_usdc',
    receiver: ASHSWAP.stablePool,
    value: '0',
    data,
    gasLimit: 40_000_000,
    chainId: '1',
    summary: `AshSwap addLiquidity ~${amountUsdc} USDC (stable pool)`,
    riskNote:
      'Stable-swap · slippage faible mais non nul. Vérifier params exacts sur app.ashswap.io si TX échoue.',
  }
}

/** Stake LP token (farm) — token id à préciser par l’utilisateur */
export function buildAshStakeLp(lpTokenId: string, amountAtomic: string, farmAddress: string): PreparedTx {
  const data = `ESDTTransfer@${strToHex(lpTokenId)}@${BigInt(amountAtomic).toString(16)}@${strToHex('enterFarm')}`
  return {
    protocol: 'ashswap',
    action: 'stake_lp',
    receiver: farmAddress,
    value: '0',
    data,
    gasLimit: 30_000_000,
    chainId: '1',
    summary: `AshSwap stake LP ${lpTokenId}`,
    riskNote: 'Adresse farm à valider sur docs AshSwap avant signature.',
  }
}
