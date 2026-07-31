import { LIA_WALLET } from '../config/contracts'

/** True only when the connected account is the LIA ops wallet */
export function isLiaWalletConnected(
  isLoggedIn: boolean | undefined,
  address: string | null | undefined
): boolean {
  if (!isLoggedIn || !address) return false
  return address.toLowerCase() === LIA_WALLET.toLowerCase()
}
