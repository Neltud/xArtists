import { useWeb3 } from './useWeb3'

interface TransactionDisplayInfo {
  processingMessage?: string
  errorMessage?: string
  successMessage?: string
}

/**
 * Stub for sending MultiversX transactions.
 * Full implementation requires @multiversx/sdk-dapp + WalletConnect project ID.
 */
export const useSendTransaction = () => {
  const { isLoggedIn } = useWeb3()

  const send = async (_transactions: unknown[], _displayInfo?: TransactionDisplayInfo) => {
    if (!isLoggedIn) {
      throw new Error('Wallet non connecté')
    }
    // TODO: Replace with real @multiversx/sdk-dapp sendTransactions once
    // WalletConnect project ID is configured in apps/frontend/src/config/sdkDapp.ts
    console.warn('[useSendTransaction] Real transaction signing not yet configured.')
    return { sessionId: null, error: 'SDK not configured' }
  }

  return { send }
}