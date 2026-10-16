/**
 * Agent packs — on-chain buy → 1 ESDT NFT in buyer wallet.
 * Canonical endpoint: buyPack@<enum 01|02|03>.
 * buyAgentAction = secondary listing (EGLD only, NO NFT transfer) — opt-in via
 * VITE_AGENT_PACK_BUY_ENDPOINT=buyAgentAction + VITE_AGENT_PACK_LISTINGS.
 * Paper mint: DEV only (audit S-02).
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import {
  AGENTS_MARKETPLACE_ADDRESS,
  canBuyAgent,
  agentsMarketplaceReceiverOrThrow,
} from '../config/scStatus'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { markPackOwned, buildMintMetadata } from '../lib/nftPacks'
import {
  empireTxStart,
  empireTxError,
  empireTxSuccess,
  setModeLock,
} from '../store/empireStore'
import { projectSale } from '../config/revenueSplitter'
import { transactionMonitor } from '../services/transactionMonitor'
import { waitForPackNft } from '../services/nftService'
import { useWallet } from '../context/WalletContext'

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

const PACK_ENUM: Record<PackId, number> = { pulse: 1, yield: 2, sentinel: 3 }

function packListingIds(): Partial<Record<PackId, number>> {
  try {
    const raw = (import.meta.env.VITE_AGENT_PACK_LISTINGS as string | undefined) || ''
    const out: Partial<Record<PackId, number>> = {}
    for (const part of raw.split(',')) {
      const [k, v] = part.split(':').map(s => s.trim())
      if (k === 'pulse' || k === 'yield' || k === 'sentinel') {
        const n = Number(v)
        if (Number.isFinite(n) && n >= 0) out[k] = n
      }
    }
    return out
  } catch {
    return {}
  }
}

/** Default buyPack. Only force listing path when explicitly configured. */
function forceListingBuy(): boolean {
  try {
    const ep = (import.meta.env.VITE_AGENT_PACK_BUY_ENDPOINT as string | undefined)?.trim()
    return ep === 'buyAgentAction'
  } catch {
    return false
  }
}

export function useAgentPackTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [lastPaper, setLastPaper] = useState<PackId | null>(null)
  const { send } = useSendTransaction()
  const { address } = useWallet()

  const mintPaper = useCallback((id: PackId) => {
    if (!import.meta.env.DEV) {
      setError('Paper mint désactivé en production — utilisez buyPack on-chain')
      throw new Error('Paper mint disabled outside DEV (audit S-02)')
    }
    setError(null)
    setModeLock(true, 'Paper mint (DEV)', 1500)
    markPackOwned(id)
    setLastPaper(id)
    const meta = buildMintMetadata(id)
    const pack = AGENT_PACKS.find(p => p.id === id)
    const sale = projectSale(pack?.priceEgld.list ?? 10, id)
    try {
      const raw = localStorage.getItem('xartists_pack_sale_log')
      const log = raw ? (JSON.parse(raw) as unknown[]) : []
      const arr = Array.isArray(log) ? log : []
      arr.push({ mode: 'paper', packId: id, meta, sale, ts: Date.now() })
      localStorage.setItem('xartists_pack_sale_log', JSON.stringify(arr.slice(-40)))
    } catch {
      /* */
    }
    return { packId: id, meta, sale }
  }, [])

  /**
   * Secondary listing: pays EGLD to seller — does NOT transfer an NFT.
   * Prefer buyPack for pack access NFTs.
   */
  const buyAgentListing = useCallback(
    async (listingId: number, priceEgld: number) => {
      setError(null)
      if (!canBuyAgent()) {
        const msg = 'Agents SC gated — paper only'
        setError(msg)
        throw new Error(msg)
      }
      if (!(listingId >= 0) || !(priceEgld > 0)) throw new Error('listing / prix invalide')
      const receiver = agentsMarketplaceReceiverOrThrow()
      setPending(true)
      empireTxStart(`Buy agent listing #${listingId}`)
      try {
        const res = await send(
          [
            {
              receiver,
              value: egldToAtomic(priceEgld),
              data: `buyAgentAction@${numToHex(listingId)}`,
              gasLimit: 25_000_000,
              chainID: '1',
            },
          ],
          {
            processingMessage: 'Achat listing agent (pas de NFT)…',
            successMessage: 'Paiement soumis — pas de mint NFT via cet endpoint',
            errorMessage: 'Achat listing échoué',
          },
        )
        if (res.error) {
          setError(res.error)
          empireTxError(res.error)
          throw new Error(res.error)
        }
        if (res.sessionId) {
          setLastTx(res.sessionId)
          if (res.sessionId.length >= 16 && !res.sessionId.startsWith('session')) {
            transactionMonitor.watch(res.sessionId, { network: 'mainnet' })
          }
        }
        empireTxSuccess(res.sessionId || undefined)
        return res.sessionId
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Buy failed'
        setError(msg)
        empireTxError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [send],
  )

  /** 1 Pack acheté = 1 NFT ESDT dans le wallet (buyPack). */
  const buyPack = useCallback(
    async (id: PackId) => {
      setError(null)
      const pack = AGENT_PACKS.find(p => p.id === id)
      if (!pack) throw new Error('Pack inconnu')
      const price = pack.priceEgld.list
      const listings = packListingIds()
      const listingId = listings[id]

      // Opt-in only: never default pack purchase to buyAgentAction (no NFT)
      if (forceListingBuy() && listingId != null && canBuyAgent()) {
        const sid = await buyAgentListing(listingId, price)
        return { mode: 'listing' as const, sessionId: sid, packId: id }
      }

      if (!canBuyAgent()) {
        const msg =
          'SC agents non live. Active VITE_AGENTS_CODEHASH_OK + buyPack on-chain. Paper mint = DEV only.'
        setError(msg)
        if (import.meta.env.DEV) mintPaper(id)
        throw new Error(msg)
      }

      const receiver = agentsMarketplaceReceiverOrThrow()
      const data = `buyPack@${numToHex(PACK_ENUM[id])}`

      setPending(true)
      empireTxStart(`buyPack ${id}`)
      try {
        const res = await send(
          [
            {
              receiver,
              value: egldToAtomic(price),
              data,
              gasLimit: 30_000_000,
              chainID: '1',
            },
          ],
          {
            processingMessage: `Mint pack ${id}…`,
            successMessage: 'TX soumise — NFT à la confirmation',
            errorMessage: 'Mint pack échoué',
          },
        )
        if (res.error) {
          setError(res.error)
          empireTxError(res.error)
          throw new Error(res.error)
        }
        const sid = res.sessionId
        if (sid) {
          setLastTx(sid)
          if (sid.length >= 16 && !sid.startsWith('session')) {
            transactionMonitor.watch(sid, { network: 'mainnet', intentId: `pack:${id}` })
            transactionMonitor.subscribe(tx => {
              if (tx.hash === sid && tx.status === 'success' && address) {
                void waitForPackNft(address, id, { timeoutMs: 120_000 }).then(hit => {
                  if (hit && import.meta.env.DEV) markPackOwned(id)
                })
              }
            })
          }
        }
        empireTxSuccess(sid || undefined)
        if (import.meta.env.DEV) markPackOwned(id)
        return { mode: 'buyPack' as const, sessionId: sid, packId: id, data }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'buyPack failed'
        setError(msg)
        empireTxError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [send, buyAgentListing, mintPaper, address],
  )

  const mintOnChain = useCallback(async (id: PackId) => buyPack(id), [buyPack])

  return {
    mintPaper,
    mintOnChain,
    buyPack,
    buyAgentListing,
    pending,
    error,
    lastTx,
    lastPaper,
    agentsLive: canBuyAgent(),
    agentsAddress: AGENTS_MARKETPLACE_ADDRESS,
  }
}
