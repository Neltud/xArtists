/**
 * Agent packs — paper default.
 * On-chain agents SC endpoints (bytecode): listAgentAction · buyAgentAction · claimFees.
 * NOT buyPack/mint (those do not exist on deployed code).
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

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

export function useAgentPackTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [lastPaper, setLastPaper] = useState<PackId | null>(null)
  const { send } = useSendTransaction()

  const mintPaper = useCallback((id: PackId) => {
    setError(null)
    setModeLock(true, 'Paper mint', 1500)
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

  /** Buy an agent listing by on-chain listing id (buyAgentAction). */
  const buyAgentListing = useCallback(
    async (listingId: number, priceEgld: number) => {
      setError(null)
      if (!canBuyAgent()) {
        const msg = 'Agents SC gated — paper only'
        setError(msg)
        throw new Error(msg)
      }
      if (!(listingId >= 0) || !(priceEgld > 0)) {
        throw new Error('listing / prix invalide')
      }
      const receiver = agentsMarketplaceReceiverOrThrow()
      setPending(true)
      empireTxStart(`Buy agent #${listingId}`)
      try {
        const res = await send(
          [
            {
              receiver,
              value: egldToAtomic(priceEgld),
              data: `buyAgentAction@${numToHex(listingId)}`,
              gasLimit: 15_000_000,
              chainID: '1',
            },
          ],
          {
            processingMessage: 'Achat agent…',
            successMessage: 'Achat soumis',
            errorMessage: 'Achat échoué',
          },
        )
        if (res.error) {
          setError(res.error)
          empireTxError(res.error)
          throw new Error(res.error)
        }
        if (res.sessionId) setLastTx(res.sessionId)
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

  /**
   * Pack product mint — no on-chain mint endpoint on deployed agents SC.
   * Falls back to paper; when a listing exists use buyAgentListing.
   */
  const mintOnChain = useCallback(
    async (id: PackId) => {
      setError(null)
      const msg =
        'Le SC agents déployé n’a pas buyPack/mint — uniquement listAgentAction / buyAgentAction. Pack = paper jusqu’à listing NFT ou upgrade minter.'
      setError(msg)
      empireTxError(msg)
      // still allow paper ownership for UX
      mintPaper(id)
      throw new Error(msg)
    },
    [mintPaper],
  )

  return {
    mintPaper,
    mintOnChain,
    buyAgentListing,
    pending,
    error,
    lastTx,
    lastPaper,
    agentsLive: canBuyAgent(),
    agentsAddress: AGENTS_MARKETPLACE_ADDRESS,
  }
}
