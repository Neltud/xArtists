/**
 * List / Buy NFT via marketplace contract (sdk-dapp compatible).
 * Requires wallet connected (xPortal / extension / PEM via MultiversXContext).
 */
import { useCallback, useState } from 'react';
import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi';

export interface ListNftParams {
  tokenId: string;
  nonce: number;
  priceEgld: number; // human units, e.g. 1.5
}

export interface BuyNftParams {
  listingId: number;
  priceEgld: number;
}

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString();
}

/**
 * Builds transaction payloads for MultiversX sdk-dapp sendTransactions.
 * Wire these into useGetAccount / useSendTransaction in the UI.
 */
export function useMarketplaceTx() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const buildListTx = useCallback((p: ListNftParams) => {
    // ESDTNFTTransfer to marketplace + listNft endpoint data
    // Simplified payload for integration with sdk-dapp Transaction factory
    return {
      receiver: MARKETPLACE_ADDRESS,
      value: '0',
      gasLimit: 20_000_000,
      data: `ESDTNFTTransfer@${Buffer.from(p.tokenId).toString('hex')}@${p.nonce.toString(16)}@01@${Buffer.from(MARKETPLACE_ADDRESS).toString('hex')}@${Buffer.from('listNft').toString('hex')}@${BigInt(egldToAtomic(p.priceEgld)).toString(16)}`,
      // Prefer ContractFunction + TokenTransfer in production via @multiversx/sdk-core
    };
  }, []);

  const buildBuyTx = useCallback((p: BuyNftParams) => {
    return {
      receiver: MARKETPLACE_ADDRESS,
      value: egldToAtomic(p.priceEgld),
      gasLimit: 15_000_000,
      data: `buyNft@${p.listingId.toString(16)}`,
    };
  }, []);

  const listNft = useCallback(
    async (p: ListNftParams, sendTx: (tx: unknown) => Promise<{ hash?: string }>) => {
      setPending(true);
      setError(null);
      try {
        const tx = buildListTx(p);
        const res = await sendTx(tx);
        setLastTx(res?.hash ?? null);
        return res;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'listNft failed';
        setError(msg);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [buildListTx]
  );

  const buyNft = useCallback(
    async (p: BuyNftParams, sendTx: (tx: unknown) => Promise<{ hash?: string }>) => {
      setPending(true);
      setError(null);
      try {
        const tx = buildBuyTx(p);
        const res = await sendTx(tx);
        setLastTx(res?.hash ?? null);
        return res;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'buyNft failed';
        setError(msg);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [buildBuyTx]
  );

  return { listNft, buyNft, buildListTx, buildBuyTx, pending, error, lastTx, marketplaceAddress: MARKETPLACE_ADDRESS };
}
