import { useWallet } from '../context/WalletContext'

/** Returns basic wallet info from the WalletContext. */
export const useWeb3 = () => {
  const { connected, address, method, canAttemptSign } = useWallet()
  return {
    address,
    account: null,
    balance: 0,
    isLoggedIn: connected,
    loginMethod: method,
    method,
    canAttemptSign,
    hasPendingTransactions: false,
    pendingTransactions: {},
  }
}
