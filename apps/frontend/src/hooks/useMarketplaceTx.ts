/**
 * List / Buy / Bid / Accept / Withdraw / Cancel — marketplace SC.
 * Offer: no endpoint.
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

  const run = useCallback(
    async (tx: object, labels: { processing: string; success: string; fail: string }) => {
      setPending(true)
      setError(null)
      try {
        const res = await send([tx], {
          processingMessage: labels.processing,
          successMessage: labels.success,
          errorMessage: labels.fail,
        })
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : labels.fail
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [send]
  )

  const listNft = useCallback(
    async (p: ListNftParams) => {
      const royaltyBps = p.royaltyBps ?? 500
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
      if (p.royaltyReceiver) dataParts.push(strToHex(p.royaltyReceiver))
      return run(
        {
          receiver: MARKETPLACE_ADDRESS,
          value: '0',
          gasLimit: 25_000_000,
          data: dataParts.join('@'),
          chainID: '1',
        },
        { processing: 'Listing…', success: 'Listed', fail: 'List failed' }
      )
    },
    [run]
  )

  const buyNft = useCallback(
    async (p: BuyNftParams) =>
      run(
        {
          receiver: MARKETPLACE_ADDRESS,
          value: egldToAtomic(p.priceEgld),
          gasLimit: 18_000_000,
          data: `buyNft@${numToHex(p.listingId)}`,
          chainID: '1',
        },
        { processing: 'Buying…', success: 'Purchased', fail: 'Buy failed' }
      ),
    [run]
  )

  const placeBid = useCallback(
    async (p: PlaceBidParams) =>
      run(
        {
          receiver: MARKETPLACE_ADDRESS,
          value: egldToAtomic(p.amountEgld),
          gasLimit: 12_000_000,
          data: `placeBid@${numToHex(p.listingId)}`,
          chainID: '1',
        },
        { processing: 'Bidding…', success: 'Bid placed', fail: 'Bid failed' }
      ),
    [run]
  )

  const acceptBid = useCallback(
    async (listingId: number) =>
      run(
        {
          receiver: MARKETPLACE_ADDRESS,
          value: '0',
          gasLimit: 18_000_000,
          data: `acceptBid@${numToHex(listingId)}`,
          chainID: '1',
        },
        { processing: 'Accepting bid…', success: 'Bid accepted', fail: 'Accept failed' }
      ),
    [run]
  )

  const withdrawBid = useCallback(
    async (listingId: number) =>
      run(
        {
          receiver: MARKETPLACE_ADDRESS,
          value: '0',
          gasLimit: 10_000_000,
          data: `withdrawBid@${numToHex(listingId)}`,
          chainID: '1',
        },
        { processing: 'Withdrawing…', success: 'Bid withdrawn', fail: 'Withdraw failed' }
      ),
    [run]
  )

  const cancelListing = useCallback(
    async (listingId: number) =>
      run(
        {
          receiver: MARKETPLACE_ADDRESS,
          value: '0',
          gasLimit: 12_000_000,
          data: `cancelListing@${numToHex(listingId)}`,
          chainID: '1',
        },
        { processing: 'Cancelling…', success: 'Cancelled', fail: 'Cancel failed' }
      ),
    [run]
  )

  return {
    listNft,
    buyNft,
    placeBid,
    acceptBid,
    withdrawBid,
    cancelListing,
    pending,
    error,
    lastTx,
    marketplaceAddress: MARKETPLACE_ADDRESS,
    offerSupported: false as const,
    bidSupported: true as const,
  }
}
