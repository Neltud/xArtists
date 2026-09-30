/**
 * Agent pack mint TX — paper always; on-chain when canBuyAgent().
 * Without verified ABI, on-chain path is a documented EGLD payment + data tag
 * (ops must confirm endpoint name against agents_marketplace bytecode).
 */
import { useCallback, useState } from 'react'
import {
  AGENTS_MARKETPLACE_ADDRESS,
  canBuyAgent,
  agentsMarketplaceReceiverOrThrow,
} from '../config/scStatus'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { markPackOwned, buildMintMetadata } from '../lib/nftPacks'
import { empireTxStart, empireTxError, empireTxSuccess } from '../store/empireStore'
import { projectSale } from '../config/revenueSplitter'

// Optional bootstrap — same pattern as useSlotTx when TxShell is mounted
type BootstrapFn = (opts: {
  receiver: string
  value: string
  data: string
  gasLimit?: number
  label?: string
}) => Promise<string | void>

let bootstrapSendTx: BootstrapFn | null = null

export function registerAgentPackTxBootstrap(fn: BootstrapFn | null) {
  bootstrapSendTx = fn
}

function packIdHex(id: PackId): string {
  // short tag for SC data (ops may map to enum)
  const map: Record<PackId, string> = {
    pulse: '01',
    yield: '02',
    sentinel: '03',
  }
  return map[id]
}

function egldToAtomic(egld: number): string {
  // 1 EGLD = 1e18
  const atomic = BigInt(Math.round(egld * 1e6)) * 10n ** 12n
  return atomic.toString()
}

export function useAgentPackTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [lastPaper, setLastPaper] = useState<PackId | null>(null)

  const mintPaper = useCallback((id: PackId) => {
    setError(null)
    markPackOwned(id)
    setLastPaper(id)
    const meta = buildMintMetadata(id)
    const pack = AGENT_PACKS.find(p => p.id === id)
    const sale = projectSale(pack?.priceEgld.list ?? 10, id)
    try {
      const raw = localStorage.getItem('xartists_pack_sale_log')
      const log = raw ? (JSON.parse(raw) as unknown[]) : []
      const arr = Array.isArray(log) ? log : []
      arr.push({
        mode: 'paper',
        packId: id,
        meta,
        sale,
        ts: Date.now(),
      })
      localStorage.setItem('xartists_pack_sale_log', JSON.stringify(arr.slice(-40)))
    } catch {
      /* */
    }
    return { packId: id, meta, sale }
  }, [])

  const mintOnChain = useCallback(async (id: PackId) => {
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
    // Provisional endpoint tag — verify against SC ABI before public mainnet push
    const data = `buyPack@${packIdHex(id)}`
    const value = egldToAtomic(price)

    if (!bootstrapSendTx) {
      const msg =
        'TxShell bootstrap absent — connect wallet + TxShell, ou utilise mint paper'
      setError(msg)
      throw new Error(msg)
    }

    setPending(true)
    empireTxStart(`Mint pack ${pack.name} · ${price} EGLD`)
    try {
      const tx = await bootstrapSendTx({
        receiver,
        value,
        data,
        gasLimit: 12_000_000,
        label: `buyPack ${id}`,
      })
      if (typeof tx === 'string') setLastTx(tx)
      // Optimistic paper ownership until indexer confirms NFT
      markPackOwned(id)
      setLastPaper(id)
      empireTxSuccess(typeof tx === 'string' ? tx : undefined)
      return tx
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Mint TX failed'
      setError(msg)
      empireTxError(msg)
      throw e
    } finally {
      setPending(false)
    }
  }, [])

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

/** Safe receiver helper — scStatus may not export yet */
function agentsMarketplaceReceiverOrThrow(): string {
  if (!canBuyAgent()) {
    throw new Error('Agents marketplace not live')
  }
  return AGENTS_MARKETPLACE_ADDRESS
}
