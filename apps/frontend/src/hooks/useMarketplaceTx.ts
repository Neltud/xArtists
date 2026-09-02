/**
 * List / Buy NFT via marketplace contract — wired for sdk-dapp sendTransactions.
 * Requires wallet connected (xPortal / extension).
 * Vellum final prep — 31 juil 2026
 */
import { useCallback, useState } from 'react';
import { useEffect } from 'react';
import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi';
import { fetchMirroredJson } from '../config/dataSources';
import { useSendTransaction } from './useSendTransaction';

export interface ListNftParams {
  tokenId: string;
  nonce: number;
  priceEgld: number;
  royaltyBps?: number;
  royaltyReceiver?: string;
}

export interface BuyNftParams {
  listingId: number;
  priceEgld: number;
}

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString();
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16);
  return h.length % 2 === 0 ? h : `0${h}`;
}

/**
 * Builds MultiversX transaction objects compatible with sdk-dapp / __xartistsSendTx.
 */
export function useMarketplaceTx() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [marketplaceAddress, setMarketplaceAddress] = useState(MARKETPLACE_ADDRESS);
  const { send } = useSendTransaction();

  useEffect(() => {
    let cancelled = false;
    fetchMirroredJson<{ contracts?: { marketplace?: string | null } }>('contracts.json', {
      cache: 'no-store',
    })
      .then((json) => {
        const nextAddress = json.contracts?.marketplace;
        if (!cancelled && nextAddress) {
          setMarketplaceAddress(nextAddress);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const buildListTx = useCallback((p: ListNftParams) => {
    if (!marketplaceAddress) {
      throw new Error('Marketplace indisponible — adresse SC non configurée');
    }
    const royaltyBps = p.royaltyBps ?? 500;
    const royaltyReceiver = p.royaltyReceiver ?? '';
    // MultiESDTNFTTransfer style single NFT to SC + endpoint args
    // Prefer: ESDTNFTTransfer@token@nonce@qty@sc@listNft@price@royaltyBps@royaltyReceiver
    const priceAtomic = egldToAtomic(p.priceEgld);
    const dataParts = [
      'ESDTNFTTransfer',
      strToHex(p.tokenId),
      numToHex(p.nonce),
      numToHex(1),
      strToHex(marketplaceAddress),
      strToHex('listNft'),
      numToHex(BigInt(priceAtomic)),
      numToHex(royaltyBps),
    ];
    if (royaltyReceiver) {
      dataParts.push(strToHex(royaltyReceiver));
    }
    return {
      receiver: marketplaceAddress, // actual receiver is self for ESDTNFTTransfer; sdk may rewrite
      value: '0',
      gasLimit: 25_000_000,
      data: dataParts.join('@'),
      // Explicit fields for sdk-dapp Transaction factory
      chainID: '1',
    };
  }, [marketplaceAddress]);

  const buildBuyTx = useCallback((p: BuyNftParams) => {
    if (!marketplaceAddress) {
      throw new Error('Marketplace indisponible — adresse SC non configurée');
    }
    return {
      receiver: marketplaceAddress,
      value: egldToAtomic(p.priceEgld),
      gasLimit: 18_000_000,
      data: `buyNft@${numToHex(p.listingId)}`,
      chainID: '1',
    };
  }, [marketplaceAddress]);

  const listNft = useCallback(
    async (p: ListNftParams) => {
      setPending(true);
      setError(null);
      try {
        const tx = buildListTx(p);
        const res = await send([tx], {
          processingMessage: 'Listing NFT…',
          successMessage: 'NFT listed',
          errorMessage: 'List failed',
        });
        if (res.error) {
          setError(res.error);
          throw new Error(res.error);
        }
        setLastTx(res.sessionId);
        return res;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'listNft failed';
        setError(msg);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [buildListTx, send]
  );

  const buyNft = useCallback(
    async (p: BuyNftParams) => {
      setPending(true);
      setError(null);
      try {
        const tx = buildBuyTx(p);
        const res = await send([tx], {
          processingMessage: 'Buying NFT…',
          successMessage: 'NFT purchased',
          errorMessage: 'Buy failed',
        });
        if (res.error) {
          setError(res.error);
          throw new Error(res.error);
        }
        setLastTx(res.sessionId);
        return res;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'buyNft failed';
        setError(msg);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [buildBuyTx, send]
  );

  return {
    listNft,
    buyNft,
    buildListTx,
    buildBuyTx,
    pending,
    error,
    lastTx,
    marketplaceAddress,
  };
}
