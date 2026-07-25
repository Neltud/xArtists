import { useWallet } from '../context/WalletContext'

/** Returns basic wallet info from the WalletContext. */
export const useWeb3 = () => {
  const { connected, address, method } = useWallet()
  return {
    address,
    account: null,
    balance: 0,
    isLoggedIn: connected,
    loginMethod: method,
    hasPendingTransactions: false,
    pendingTransactions: {},
  }
}