// src/services/transactions.ts
// Real on-chain queries for tro-staking and nft-staking contracts

import { Address, SmartContract, ResultsParser } from '@multiversx/sdk-core';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers';

import { useSendTransaction } from '@multiversx/sdk-dapp/hooks/transactions/useSendTransaction';

// LIA Wallet Address
export const LIA_DEPLOYER_ADDRESS = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6';

export const CONTRACT_ADDRESSES = {
  nftMinter: import.meta.env.VITE_NFT_MINTER_ADDRESS || LIA_DEPLOYER_ADDRESS,
  troStaking: import.meta.env.VITE_TRO_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
  nftStaking: import.meta.env.VITE_NFT_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
};

const networkProvider = new ApiNetworkProvider('https://api.multiversx.com');
const resultsParser = new ResultsParser();

// ============== TRANSACTION HOOKS ==============

export function useStakeNFT() {
  const { sendTransaction } = useSendTransaction();

  const stakeNFT = async (collection: string, nftId: string) => {
    const data = `stake@${Buffer.from(collection).toString('hex')}@${parseInt(nftId).toString(16).padStart(16, '0')}`;
    return await sendTransaction({
      value: 0,
      data,
      receiver: CONTRACT_ADDRESSES.nftStaking,
      gasLimit: 65000000,
    });
  };

  return { stakeNFT };
}

export function useStakeTRO() {
  const { sendTransaction } = useSendTransaction();

  const stakeTRO = async (amount: string) => {
    const data = `ESDTTransfer@${Buffer.from('TRO-94c925').toString('hex')}@${parseInt(amount).toString(16).padStart(16, '0')}@7374616b65`;
    return await sendTransaction({
      value: 0,
      data,
      receiver: CONTRACT_ADDRESSES.troStaking,
      gasLimit: 60000000,
    });
  };

  return { stakeTRO };
}

// ============== REAL ON-CHAIN QUERY FUNCTIONS ==============

/**
 * Query staked TRO amount for a user from tro-staking contract
 * Endpoint in Rust contract is usually: getUserStake or getStake
 */
export async function queryStakedTRO(userAddress: string) {
  try {
    const contract = new SmartContract({
      address: new Address(CONTRACT_ADDRESSES.troStaking),
    });

    const query = contract.createQuery({
      func: 'getUserStake', // <-- Change to your actual endpoint name in Rust contract
      args: [new Address(userAddress)],
    });

    const queryResponse = await networkProvider.queryContract(query);
    const endpointDefinition = contract.getEndpoint('getUserStake');

    const parsedResult = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);

    // Adjust based on your contract return type (usually BigUint or u64)
    const stakedAmount = parsedResult.values[0]?.valueOf()?.toString() || '0';

    return { stakedAmount };
  } catch (error) {
    console.error('Error querying staked TRO:', error);
    return { stakedAmount: '0' };
  }
}

/**
 * Query number of staked NFTs for a user from nft-staking contract
 * Endpoint usually: getUserStakedNFTs or getStakedNFTCount
 */
export async function queryStakedNFTs(userAddress: string) {
  try {
    const contract = new SmartContract({
      address: new Address(CONTRACT_ADDRESSES.nftStaking),
    });

    const query = contract.createQuery({
      func: 'getUserStakedNFTs', // <-- Change to your actual endpoint
      args: [new Address(userAddress)],
    });

    const queryResponse = await networkProvider.queryContract(query);
    const endpointDefinition = contract.getEndpoint('getUserStakedNFTs');

    const parsedResult = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);

    // Adjust parsing based on your contract return type
    const nftCount = parsedResult.values[0]?.valueOf()?.toNumber() || 0;

    return { nftCount, totalValue: '0' }; // You can add value calculation later
  } catch (error) {
    console.error('Error querying staked NFTs:', error);
    return { nftCount: 0, totalValue: '0' };
  }
}
