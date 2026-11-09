/**
 * Agent packs — on-chain buy → 1 ESDT NFT in buyer wallet.
 * Canonical endpoint: buyPack@<enum 01|02|03>.
 * buyAgentAction is a separate listing payment (NO NFT delivery). The pack
 * checkout must NEVER silently switch to that endpoint, even with env flags.
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
import {egldTextToWei} from '../lib/egldExactAmount.mjs'
import {getFreshPackPriceAtomic, requireExactPackQuoteAgreement} from '../lib/agentPackVmQuote.mjs'

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

const PACK_ENUM: Record<PackId, number> = { pulse: 1, yield: 2, sentinel: 3 }

/** Invalid pack checkout override: buyAgentAction never delivers a pack NFT. */
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
    async (listingId: number, priceEgldText: string) => {
      setError(null)
      if (!canBuyAgent()) {
        const msg = 'Agents SC gated — paper only'
        setError(msg)
        throw new Error(msg)
      }
      if (!Number.isSafeInteger(listingId) || listingId < 0) throw new Error('listing invalide')
      const exactAmount = egldTextToWei(priceEgldText)
      const receiver = agentsMarketplaceReceiverOrThrow()
      setPending(true)
      empireTxStart(`Buy agent listing #${listingId}`)
      try {
        const res = await send(
          [
            {
              receiver,
              value: exactAmount,
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
      // A VITE env override must never turn "purchase pack NFT" into an
      // EGLD listing payment which does not deliver an NFT.
      if (forceListingBuy()) {
        const msg = 'buyAgentAction ne livre pas de NFT pack : achat suspendu.'
        setError(msg)
        throw new Error(msg)
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
      try {
        // Fresh read-only VM query and exact decimal comparison BEFORE any
        // signing prompt. Marketing list values are NOT contract quotes.
        const priceAtomic = requireExactPackQuoteAgreement(
          await getFreshPackPriceAtomic(receiver, PACK_ENUM[id]),
          String(pack.priceEgld.list),
        )
        empireTxStart(`buyPack ${id}`)
        const res = await send(
          [
            {
              receiver,
              value: priceAtomic,
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
        const code = e instanceof Error ? e.message : 'buyPack failed'
        const msg =
          code === 'pack_onchain_price_disagrees_with_catalog'
            ? 'Prix EGLD du contrat différent du catalogue : achat suspendu.'
            : code === 'pack_onchain_quote_unavailable'
            ? 'Prix du contrat indisponible : aucun paiement envoyé.'
            : code
        setError(msg)
        empireTxError(msg)
        throw new Error(msg)
      } finally {
        setPending(false)
      }
    },
    [send, mintPaper, address],
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
