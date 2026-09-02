import { useCallback, useEffect, useState } from 'react'
import { AGENTS_MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/agentsMarketplaceAbi'
import { fetchMirroredJson } from '../config/dataSources'
import { useSendTransaction } from './useSendTransaction'

export interface ListAgentActionParams {
  agentId: string
  priceEgld: number
}

export interface BuyAgentActionParams {
  listingId: number
  priceEgld: number
}

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function strToHex(value: string): string {
  return Array.from(new TextEncoder().encode(value))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function numToHex(value: number | bigint): string {
  const hex = BigInt(value).toString(16)
  return hex.length % 2 === 0 ? hex : `0${hex}`
}

export function useAgentsMarketplace() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [marketplaceAddress, setMarketplaceAddress] = useState(AGENTS_MARKETPLACE_ADDRESS)
  const { send } = useSendTransaction()

  useEffect(() => {
    let cancelled = false

    fetchMirroredJson<{ contracts?: { agents_marketplace?: string | null } }>('contracts.json', {
      cache: 'no-store',
    })
      .then((json) => {
        const nextAddress = json.contracts?.agents_marketplace
        if (!cancelled && nextAddress) {
          setMarketplaceAddress(nextAddress)
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  const buildListTx = useCallback(
    (params: ListAgentActionParams) => {
      if (!marketplaceAddress) {
        throw new Error('Agents marketplace indisponible — adresse SC non configurée')
      }

      return {
        receiver: marketplaceAddress,
        value: '0',
        gasLimit: 12_000_000,
        data: `listAgentAction@${strToHex(params.agentId)}@${numToHex(BigInt(egldToAtomic(params.priceEgld)))}`,
        chainID: '1',
      }
    },
    [marketplaceAddress],
  )

  const buildBuyTx = useCallback(
    (params: BuyAgentActionParams) => {
      if (!marketplaceAddress) {
        throw new Error('Agents marketplace indisponible — adresse SC non configurée')
      }

      return {
        receiver: marketplaceAddress,
        value: egldToAtomic(params.priceEgld),
        gasLimit: 18_000_000,
        data: `buyAgentAction@${numToHex(params.listingId)}`,
        chainID: '1',
      }
    },
    [marketplaceAddress],
  )

  const listAgentAction = useCallback(
    async (params: ListAgentActionParams) => {
      setPending(true)
      setError(null)

      try {
        const res = await send([buildListTx(params)], {
          processingMessage: 'Listing agent…',
          successMessage: 'Agent listed',
          errorMessage: 'List agent failed',
        })
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'listAgentAction failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [buildListTx, send],
  )

  const buyAgentAction = useCallback(
    async (params: BuyAgentActionParams) => {
      setPending(true)
      setError(null)

      try {
        const res = await send([buildBuyTx(params)], {
          processingMessage: 'Buying agent…',
          successMessage: 'Agent purchased',
          errorMessage: 'Buy agent failed',
        })
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'buyAgentAction failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [buildBuyTx, send],
  )

  return {
    listAgentAction,
    buyAgentAction,
    buildListTx,
    buildBuyTx,
    pending,
    error,
    lastTx,
    marketplaceAddress,
  }
}
