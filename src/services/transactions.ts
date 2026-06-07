// src/services/transactions.ts
// LIA Wallet + Staking Contracts Integration

export const LIA_DEPLOYER_ADDRESS = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6';

export const CONTRACT_ADDRESSES = {
  nftMinter: import.meta.env.VITE_NFT_MINTER_ADDRESS || LIA_DEPLOYER_ADDRESS,
  troStaking: import.meta.env.VITE_TRO_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
  nftStaking: import.meta.env.VITE_NFT_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
};

// ============ STAKING HOOKS ============

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
    // Example for tro-staking contract
    // Endpoint usually "stake" with ESDT transfer
    const data = `ESDTTransfer@${Buffer.from('TRO-94c925').toString('hex')}@${parseInt(amount).toString(16).padStart(16, '0')}@7374616b65`; // stake

    return await sendTransaction({
      value: 0,
      data,
      receiver: CONTRACT_ADDRESSES.troStaking,
      gasLimit: 60000000,
    });
  };

  return { stakeTRO };
}

// ============ QUERY HELPERS (for reading staked amounts) ============
// These will be replaced with real contract queries once deployed
export async function queryStakedTRO(address: string) {
  // TODO: Implement with SmartContract query on tro-staking
  // Example:
  // const result = await provider.queryContract(...);
  console.log('Query staked TRO for:', address);
  return { stakedAmount: '1240' }; // Placeholder
}

export async function queryStakedNFTs(address: string) {
  // TODO: Implement with nft-staking contract
  console.log('Query staked NFTs for:', address);
  return { nftCount: 7, totalValue: '480' }; // Placeholder
}
