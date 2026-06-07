// src/services/transactions.ts
// LIA Wallet for all contract deployments

export const LIA_DEPLOYER_ADDRESS = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6';

export const CONTRACT_ADDRESSES = {
  nftMinter: import.meta.env.VITE_NFT_MINTER_ADDRESS || LIA_DEPLOYER_ADDRESS,
  troStaking: import.meta.env.VITE_TRO_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
  nftStaking: import.meta.env.VITE_NFT_STAKING_ADDRESS || LIA_DEPLOYER_ADDRESS,
};

// Realistic endpoints for Rust contracts (TRO-94c925 ecosystem)
export function useMintNFT() {
  const { sendTransaction } = useSendTransaction();

  const mintNFT = async (name: string, royalties: number, attributes: string) => {
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
