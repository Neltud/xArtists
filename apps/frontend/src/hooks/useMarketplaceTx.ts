/**
 * List / Buy / Bid — marketplace SC.
 * ESDTNFTTransfer: TX receiver = USER (holder).
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import { useWallet } from '../context/WalletContext'
import {
  isMarketplaceLive,
  marketplaceReceiverOrThrow,
  KNOWN_EMPTY_MARKETPLACE,
  MARKETPLACE_ADDRESS,
} from '../lib/scStatus'

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

function bech32ToHex(addr: string): string | null {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const lower = addr.toLowerCase()
  if (!lower.startsWith('erd1')) return null
  const data = lower.slice(4)
  const values: number[] = []
  for (const c of data) {
    const v = CHARSET.indexOf(c)
    if (v < 0) return null
    values.push(v)
  }
  const bits = values.slice(0, -6)
  let acc = 0
  let bitsN = 0
  const out: number[] = []
  for (const v of bits) {
    acc = (acc << 5) | v
    bitsN += 5
    if (bitsN >= 8) {
      bitsN -= 8
      out.push((acc >> bitsN) & 0xff)
    }
  }
  if (out.length < 32) return null
  return out
    .slice(0, 32)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const BLOCKED =
  'Marketplace en ouverture — actualise la page (vérif on-chain) puis réessaie.'

export function useMarketplaceTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const { send } = useSendTransaction()
  const { address } = useWallet()
  const live = isMarketplaceLive()

  const run = useCallback(
    async (
      tx: object,
      labels: { processing: string; success: string; fail: string },
    ) => {
      if (!live) {
        setError(BLOCKED)
        throw new Error(BLOCKED)
      }
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
        if (res.sessionId) setLastTx(res.sessionId)
        return res
      } catch (e) {
        const msg = e instanceof Error ? e.message : BLOCKED
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [send, live],
  )

  const listNft = useCallback(
    async (p: ListNftParams) => {
      if (!address?.startsWith('erd1')) {
        const msg = 'Connecte ton wallet pour lister'
        setError(msg)
        throw new Error(msg)
      }
      const royaltyBps = p.royaltyBps ?? 500
      const priceAtomic = egldToAtomic(p.priceEgld)
      const sc = marketplaceReceiverOrThrow()
      const scHex = bech32ToHex(sc)
      if (!scHex) {
        const msg = 'Adresse marketplace invalide'
        setError(msg)
        throw new Error(msg)
      }
      const dataParts = [
        'ESDTNFTTransfer',
        strToHex(p.tokenId),
        numToHex(p.nonce),
        numToHex(1),
        scHex,
        strToHex('listNft'),
        numToHex(BigInt(priceAtomic)),
        numToHex(royaltyBps),
      ]
      if (p.royaltyReceiver) {
        const rh = bech32ToHex(p.royaltyReceiver)
        if (rh) dataParts.push(rh)
      }
      return run(
        {
          receiver: address,
          value: '0',
          gasLimit: 25_000_000,
          data: dataParts.join('@'),
          chainID: '1',
        },
        {
          processing: 'Listing NFT…',
          success: 'Listing envoyé',
          fail: 'Listing échoué',
        },
      )
    },
    [address, run],
  )

  const buyNft = useCallback(
    async (p: BuyNftParams) => {
      return run(
        {
          receiver: marketplaceReceiverOrThrow(),
          value: egldToAtomic(p.priceEgld),
          gasLimit: 20_000_000,
          data: `buyNft@${numToHex(p.listingId)}`,
          chainID: '1',
        },
        { processing: 'Achat…', success: 'Achat envoyé', fail: 'Achat échoué' },
      )
    },
    [run],
  )

  const placeBid = useCallback(
    async (p: PlaceBidParams) =>
      run(
        {
          receiver: marketplaceReceiverOrThrow(),
          value: egldToAtomic(p.amountEgld),
          gasLimit: 15_000_000,
          data: `placeBid@${numToHex(p.listingId)}`,
          chainID: '1',
        },
        { processing: 'Enchère…', success: 'Enchère envoyée', fail: 'Enchère échouée' },
      ),
    [run],
  )

  const acceptBid = useCallback(
    async (listingId: number) =>
      run(
        {
          receiver: marketplaceReceiverOrThrow(),
          value: '0',
          gasLimit: 15_000_000,
          data: `acceptBid@${numToHex(listingId)}`,
          chainID: '1',
        },
        { processing: 'Accept…', success: 'OK', fail: 'Échec' },
      ),
    [run],
  )

  const withdrawBid = useCallback(
    async (listingId: number) =>
      run(
        {
          receiver: marketplaceReceiverOrThrow(),
          value: '0',
          gasLimit: 12_000_000,
          data: `withdrawBid@${numToHex(listingId)}`,
          chainID: '1',
        },
        { processing: 'Retrait…', success: 'OK', fail: 'Échec' },
      ),
    [run],
  )

  const cancelListing = useCallback(
    async (listingId: number) =>
      run(
        {
          receiver: marketplaceReceiverOrThrow(),
          value: '0',
          gasLimit: 12_000_000,
          data: `cancelListing@${numToHex(listingId)}`,
          chainID: '1',
        },
        { processing: 'Annulation…', success: 'OK', fail: 'Échec' },
      ),
    [run],
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
    marketplaceLive: live,
    offerSupported: false as const,
    bidSupported: live,
    knownEmpty: KNOWN_EMPTY_MARKETPLACE,
  }
}
