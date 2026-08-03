/**
 * List / Buy / Bid NFT via marketplace SC.
 * Offer: no on-chain endpoint — do not call.
 */
import { useCallback, useState } from 'react'
import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi'
import { useSendTransaction } from './useSendTransaction'

export interface ListNftParams {
  tokenId: string
  nonce: number
  priceEgld: number
  royaltyBps?: number
  royaltyReceiver?: string
}

export interface BuyNftParams {
  listingId: number
  priceEgld: number
}

export interface PlaceBidParams {
  listingId: number
  amountEgld: number
}

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

export function useMarketplaceTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const { send } = useSendTransaction()

  const buildListTx = useCallback((p: ListNftParams) => {
    const royaltyBps = p.royaltyBps ?? 500
    const royaltyReceiver = p.royaltyReceiver ?? ''
    const priceAtomic = egldToAtomic(p.priceEgld)
    const dataParts = [
      'ESDTNFTTransfer',
      strToHex(p.tokenId),
      numToHex(p.nonce),
      numToHex(1),
      strToHex(MARKETPLACE_ADDRESS),
      strToHex('listNft'),
      numToHex(BigInt(priceAtomic)),
      numToHex(royaltyBps),
    ]
    if (royaltyReceiver) dataParts.push(strToHex(royaltyReceiver))
    return {
      receiver: MARKETPLACE_ADDRESS,
      value: '0',
      gasLimit: 25_000_000,
      data: dataParts.join('@'),
      chainID: '1',
    }
  }, [])

  const buildBuyTx = useCallback((p: BuyNftParams) => {
    return {
      receiver: MARKETPLACE_ADDRESS,
      value: egldToAtomic(p.priceEgld),
      gasLimit: 18_000_000,
      data: `buyNft@${numToHex(p.listingId)}`,
      chainID: '1',
    }
  }, [])

  const buildPlaceBidTx = useCallback((p: PlaceBidParams) => {
    return {
      receiver: MARKETPLACE_ADDRESS,
      value: egldToAtomic(p.amountEgld),
      gasLimit: 12_000_000,
      data: `placeBid@${numToHex(p.listingId)}`,
      chainID: '1',
    }
  }, [])

  const listNft = useCallback(
    async (p: ListNftParams) => {
      setPending(true)
      setError(null)
      try {
        const res = await send([buildListTx(p)], {
          processingMessage: 'Listing NFT…',
          successMessage: 'NFT listed',
          errorMessage: 'List failed',
        })
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'listNft failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [buildListTx, send]
  )

  const buyNft = useCallback(
    async (p: BuyNftParams) => {
      setPending(true)
      setError(null)
      try {
        const res = await send([buildBuyTx(p)], {
          processingMessage: 'Buying NFT…',
          successMessage: 'NFT purchased',
          errorMessage: 'Buy failed',
        })
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'buyNft failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [buildBuyTx, send]
  )

  const placeBid = useCallback(
    async (p: PlaceBidParams) => {
      setPending(true)
      setError(null)
      try {
        const res = await send([buildPlaceBidTx(p)], {
          processingMessage: 'Placing bid…',
          successMessage: 'Bid placed',
          errorMessage: 'Bid failed',
        })
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'placeBid failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [buildPlaceBidTx, send]
  )

  return {
    listNft,
    buyNft,
    placeBid,
    buildListTx,
    buildBuyTx,
    buildPlaceBidTx,
    pending,
    error,
    lastTx,
    marketplaceAddress: MARKETPLACE_ADDRESS,
    /** Offer has no SC endpoint */
    offerSupported: false as const,
    bidSupported: true as const,
  }
}
