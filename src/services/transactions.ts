// src/services/transactions.ts
// Real MultiversX transactions - Update endpoints after deploying your Rust contracts

import { useSendTransaction } from '@multiversx/sdk-dapp/hooks/transactions/useSendTransaction';

export const CONTRACT_ADDRESSES = {
  nftMinter: import.meta.env.VITE_NFT_MINTER_ADDRESS || 'erd1qqqqqqqqqqqqqpgq...', 
  troStaking: import.meta.env.VITE_TRO_STAKING_ADDRESS || 'erd1qqqqqqqqqqqqqpgq...', 
  nftStaking: import.meta.env.VITE_NFT_STAKING_ADDRESS || 'erd1qqqqqqqqqqqqqpgq...',
};

// Common Rust contract endpoints on MultiversX (adapt to your code)
// Typical patterns: mint, stake, unstake, claimRewards, etc.

export function useMintNFT() {
  const { sendTransaction } = useSendTransaction();

  const mintNFT = async (name: string, royalties: number, attributes: string) => {
    // Example for a typical Rust NFT minter contract
    // Endpoint often called "mint" or "issue"
    // Arguments usually: name, royalties (as u64), attributes (as bytes or string)
    const data = `mint@${Buffer.from(name).toString('hex')}@${royalties.toString(16).padStart(16, '0')}@${Buffer.from(attributes).toString('hex')}`;

    return await sendTransaction({
      value: 0,
      data,
      receiver: CONTRACT_ADDRESSES.nftMinter,
      gasLimit: 60000000,
    });
  };

  return { mintNFT };
}

export function useStakeNFT() {
  const { sendTransaction } = useSendTransaction();

  const stakeNFT = async (collection: string, nftId: string) => {
    // Typical staking endpoint in Rust contracts: "stake" or "stakeNft"
    // Arguments: collection ticker + nonce
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
