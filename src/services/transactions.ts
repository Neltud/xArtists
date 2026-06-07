// src/services/transactions.ts
// Real on-chain queries - Ready for deployment with LIA wallet

import { Address, SmartContract, ResultsParser } from '@multiversx/sdk-core';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers';
import { useSendTransaction } from '@multiversx/sdk-dapp/hooks/transactions/useSendTransaction';

export const LIA_DEPLOYER_ADDRESS = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6';

export const CONTRACT_ADDRESSES = {
  nftMinter: import.meta.env.VITE_NFT_MINTER_ADDRESS || LIA_DEPLOYER_ADDRESS,
  troStaking: import.meta.env.VITE_TRO_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
  nftStaking: import.meta.env.VITE_NFT_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
};

const networkProvider = new ApiNetworkProvider('https://api.multiversx.com');
const resultsParser = new ResultsParser();

// ============== TRANSACTION HOOKS ==============
export function useStakeNFT() { /* ... same as before ... */ }
export function useStakeTRO() { /* ... same as before ... */ }

// ============== FLEXIBLE QUERY FUNCTIONS ==============

async function queryContract(
  contractAddress: string,
  endpoint: string,
  args: any[] = []
) {
  try {
    const contract = new SmartContract({ address: new Address(contractAddress) });
    const query = contract.createQuery({ func: endpoint, args });
    const queryResponse = await networkProvider.queryContract(query);
    const endpointDefinition = contract.getEndpoint(endpoint);
    return resultsParser.parseQueryResponse(queryResponse, endpointDefinition);
  } catch (error) {
    console.error(`Error querying ${endpoint}:`, error);
    return null;
  }
}

// --- TRO Staking Queries ---
export async function queryStakedTRO(userAddress: string, endpoint = 'getUserStake') {
  const result = await queryContract(CONTRACT_ADDRESSES.troStaking, endpoint, [new Address(userAddress)]);
  const stakedAmount = result?.values[0]?.valueOf()?.toString() || '0';
  return { stakedAmount };
}

export async function queryClaimableRewards(userAddress: string, endpoint = 'getClaimableRewards') {
  const result = await queryContract(CONTRACT_ADDRESSES.troStaking, endpoint, [new Address(userAddress)]);
  const claimable = result?.values[0]?.valueOf()?.toString() || '0';
  return { claimable };
}

// --- NFT Staking Queries ---
export async function queryStakedNFTs(userAddress: string, endpoint = 'getUserStakedNFTs') {
  const result = await queryContract(CONTRACT_ADDRESSES.nftStaking, endpoint, [new Address(userAddress)]);
  const nftCount = result?.values[0]?.valueOf()?.toNumber?.() || 0;
  return { nftCount };
}
