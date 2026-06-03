import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks/account/useGetAccountInfo';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks/account/useGetLoginInfo';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';

export const useWeb3 = () => {
  const accountInfo = useGetAccountInfo();
  const loginInfo = useGetLoginInfo();
  const pendingTx = useGetPendingTransactions();

  return {
    address: accountInfo.address,
    account: accountInfo.account,
    balance: accountInfo.balance ? parseFloat(accountInfo.balance) / 1e18 : 0,
    isLoggedIn: loginInfo.isLoggedIn,
    loginMethod: loginInfo.loginMethod,
    hasPendingTransactions: pendingTx.hasPendingTransactions,
    pendingTransactions: pendingTx.pendingTransactions,
  };
};