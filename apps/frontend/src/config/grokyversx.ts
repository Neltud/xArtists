/**
 * GrokyversX — Grok autonomous trader on MultiversX (alongside LIA ops).
 * Public address only in frontend — never PEM / seed.
 */

export const GROKYVERSX = {
  name: 'GrokyversX',
  short: 'Grok',
  role: 'Autonomous trading agent (mainnet)',
  /** Dedicated bot wallet — not user Connect */
  wallet: 'erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl',
  network: 'mainnet' as const,
  strategies: ['momentum_esdt', 'micro_swap_xexchange'],
  focusDefault: 'HTM-f51d55',
  takeProfitPct: 1.7,
  stopLossPct: 1.0,
} as const

export function isGrokyversxAddress(addr?: string | null): boolean {
  if (!addr) return false
  return addr.trim().toLowerCase() === GROKYVERSX.wallet.toLowerCase()
}
