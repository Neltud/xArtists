// src/services/mvx.ts
// MultiversX SDK helpers for real on-chain queries
// Use these in components to replace placeholders with live data

import { useGetAccountInfo } from "@multiversx/sdk-dapp/hooks/account/useGetAccountInfo";
import { useGetLoginInfo } from "@multiversx/sdk-dapp/hooks/account/useGetLoginInfo";
import { Address } from "@multiversx/sdk-core";

// Example: Get connected wallet info (balance, address)
export function useMvxAccount() {
  const { address, account, isLoggedIn } = useGetAccountInfo();
  const { loginMethod } = useGetLoginInfo();

  return {
    address,
    account, // contains balance, nonce, etc.
    isLoggedIn,
    loginMethod,
  };
}

// Example hook for querying a smart contract view endpoint
// Replace CONTRACT_ADDRESS and ABI with real values from contracts/ or deployment
export async function queryContract(
  contractAddress: string,
  endpoint: string,
  args: any[] = []
) {
  // TODO: Implement with mx-sdk or @multiversx/sdk-dapp-utils
  // Example skeleton:
  // const provider = new ApiNetworkProvider('https://api.multiversx.com');
  // const contract = new SmartContract({ address: new Address(contractAddress) });
  // const query = contract.createQuery({ func: endpoint, args });
  // const result = await provider.queryContract(query);
  // return result;

  console.log('Query contract placeholder:', { contractAddress, endpoint, args });
  return { success: false, data: null, message: 'Implement with real ABI + deployed address from contracts/tro-staking or nft-staking' };
}

// Helper to format EGLD balance (from account.balance which is in smallest unit)
export function formatEgldBalance(rawBalance: string | number | undefined): string {
  if (!rawBalance) return '0';
  const num = typeof rawBalance === 'string' ? parseFloat(rawBalance) : rawBalance;
  return (num / 1e18).toFixed(6); // EGLD has 18 decimals
}
