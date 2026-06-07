// src/services/analytics.ts
// Basic on-chain analytics hook using MVX SDK

import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks/account/useGetAccountInfo';

export function useOnChainAnalytics() {
  const { address, account, isLoggedIn } = useGetAccountInfo();

  const getAnalytics = () => {
    if (!isLoggedIn || !account) return null;

    return {
      address,
      egldBalance: (parseFloat(account.balance || '0') / 1e18).toFixed(4),
      nonce: account.nonce,
      // TODO: Add contract queries for staked amount, rewards, NFT count, etc.
      // Example: query nft-staking contract for user positions
    };
  };

  return { getAnalytics, isLoggedIn };
}
