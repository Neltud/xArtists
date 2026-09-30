/**
 * Agent pack mint — paper always; on-chain via useSendTransaction when canBuyAgent().
 * Phase 5: same bridge as stake/slot (__xartistsSendTx).
 * Verify buyPack endpoint against agents_marketplace ABI before CODEHASH public.
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

function packIdHex(id: PackId): string {
  const map: Record<PackId, string> = { pulse: '01', yield: '02', sentinel: '03' }
  return map[id]
}

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
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

  const mintOnChain = useCallback(
    async (id: PackId) => {
      setError(null)
      if (!canBuyAgent()) {
        const msg = 'Agents marketplace gated — paper only (VITE_AGENTS_CODEHASH_OK)'
        setError(msg)
        empireTxError(msg)
        throw new Error(msg)
      }
      const pack = AGENT_PACKS.find(p => p.id === id)
      if (!pack) throw new Error('Pack inconnu')
      const price = pack.priceEgld.list
      const receiver = agentsMarketplaceReceiverOrThrow()
      const data = `buyPack@${packIdHex(id)}`
      const value = egldToAtomic(price)

      setPending(true)
      setModeLock(true, 'Live mint in flight', 45_000)
      empireTxStart(`Mint pack ${pack.name} · ${price} EGLD`)
      try {
        const res = await send(
          [
            {
              receiver,
              value,
              data,
              gasLimit: 12_000_000,
              chainID: '1',
            },
          ],
          {
            processingMessage: `Mint ${pack.name}…`,
            successMessage: 'Mint soumis',
            errorMessage: 'Mint échoué',
          },
        )
        if (res.error) {
          setError(res.error)
          empireTxError(res.error)
          throw new Error(res.error)
        }
        if (res.sessionId) setLastTx(res.sessionId)
        // Optimistic paper ownership until indexer confirms NFT
        markPackOwned(id)
        setLastPaper(id)
        empireTxSuccess(res.sessionId || undefined)
        return res.sessionId
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Mint TX failed'
        setError(msg)
        empireTxError(msg)
        throw e
      } finally {
        setPending(false)
        setModeLock(false)
      }
    },
    [send],
  )

  return {
    mintPaper,
    mintOnChain,
    pending,
    error,
    lastTx,
    lastPaper,
    agentsLive: canBuyAgent(),
    agentsAddress: AGENTS_MARKETPLACE_ADDRESS,
  }
}
