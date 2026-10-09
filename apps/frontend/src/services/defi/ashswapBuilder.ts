/**
 * AshSwap — addLiquidity avec minOut (slippage 0.5%) + deadline + gas +15%.
 */
import {
  type PreparedTx,
  DEFAULT_SLIPPAGE,
  withGasMargin,
  defaultDeadline,
} from './types'

export const ASHSWAP = {
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
 * minAmountOut = amount * (1 - slippage)
 * data: ESDTTransfer@token@amount@addLiquidity@minOut@deadline
 */
export function buildAshAddLiquidityUsdc(
  amountUsdc: number,
  slippage = DEFAULT_SLIPPAGE,
): PreparedTx {
  const atomic = BigInt(toAtomic(amountUsdc, 6))
  const minOut = (atomic * BigInt(Math.floor((1 - slippage) * 10_000))) / 10_000n
  const deadline = defaultDeadline()
  const data = [
    'ESDTTransfer',
    strToHex('USDC-c76f1f'),
    atomic.toString(16),
    strToHex('addLiquidity'),
    minOut.toString(16),
    deadline.toString(16),
  ].join('@')

  return {
    protocol: 'ashswap',
    action: 'add_liquidity_usdc',
    receiver: ASHSWAP.stablePool,
    value: '0',
    data,
    gasLimit: withGasMargin(40_000_000),
    chainId: '1',
    summary: `AshSwap addLiquidity ~${amountUsdc} USDC (slip ${slippage * 100}%)`,
    riskNote: `minOut=${minOut.toString()} · deadline=${deadline} (UTC). Si le SC n'attend pas ces args, utiliser app.ashswap.io.`,
    slippage,
    deadline,
  }
}

export function buildAshStakeLp(
  lpTokenId: string,
  amountAtomic: string,
  farmAddress: string,
): PreparedTx {
  const data = `ESDTTransfer@${strToHex(lpTokenId)}@${BigInt(amountAtomic).toString(16)}@${strToHex('enterFarm')}`
  return {
    protocol: 'ashswap',
    action: 'stake_lp',
    receiver: farmAddress,
    value: '0',
    data,
    gasLimit: withGasMargin(30_000_000),
    chainId: '1',
    summary: `AshSwap stake LP ${lpTokenId}`,
    riskNote: 'Adresse farm à valider sur docs AshSwap.',
    slippage: DEFAULT_SLIPPAGE,
    deadline: defaultDeadline(),
  }
}
