/**
 * Agents Marketplace — List / Buy / Cancel + error handling
 */
import { useCallback, useMemo, useState } from 'react'
import { Address, Transaction, TransactionPayload } from '@multiversx/sdk-core'
import {
  classifyTxError,
  preflightTxErrors,
  type ClassifiedTxError,
} from '../services/txErrors'
import { useSendTx } from './useSendTx'

const CHAIN_ID = '1'
const GAS_LIST = 8_000_000
const GAS_BUY = 10_000_000
const GAS_CANCEL = 6_000_000

export function getAgentsMarketplaceAddress(): string {
  const fromEnv =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AGENTS_MARKETPLACE_ADDRESS) || ''
  return (fromEnv || '').trim()
}

function hexEncodeUtf8(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function u64ToHex(n: number | bigint): string {
  let hex = BigInt(n).toString(16)
  if (hex.length % 2) hex = '0' + hex
  return hex
}

function egldToAtomic(egld: string | number): bigint {
  const s = String(egld).trim()
  if (!s || Number.isNaN(Number(s))) return 0n
  const [whole, frac = ''] = s.split('.')
  const fracPad = (frac + '000000000000000000').slice(0, 18)
  return BigInt(whole || '0') * 10n ** 18n + BigInt(fracPad || '0')
}

export type ListParams = { agentId: string; priceEgld: string }
export type BuyParams = { listingId: number; priceEgld: string }

export function buildListAgentTx(
  contractAddress: string,
  sender: string,
  params: ListParams,
  nonce: number
): Transaction {
  if (!params.agentId?.trim()) throw new Error('agent_id required')
  const priceAtomic = egldToAtomic(params.priceEgld)
  if (priceAtomic <= 0n) throw new Error('price must be > 0')
  const data = `listAgentAction@${hexEncodeUtf8(params.agentId)}@${priceAtomic.toString(16)}`
  return new Transaction({
    nonce,
    value: '0',
    receiver: Address.fromBech32(contractAddress),
    sender: Address.fromBech32(sender),
    gasLimit: GAS_LIST,
    chainID: CHAIN_ID,
    data: new TransactionPayload(data),
  })
}

export function buildBuyAgentTx(
  contractAddress: string,
  sender: string,
  params: BuyParams,
  nonce: number
): Transaction {
  if (!params.listingId || params.listingId < 1) throw new Error('listing_id invalid')
  const value = egldToAtomic(params.priceEgld)
  if (value <= 0n) throw new Error('payment must be > 0')
  const data = `buyAgentAction@${u64ToHex(params.listingId)}`
  return new Transaction({
    nonce,
    value: value.toString(),
    receiver: Address.fromBech32(contractAddress),
    sender: Address.fromBech32(sender),
    gasLimit: GAS_BUY,
    chainID: CHAIN_ID,
    data: new TransactionPayload(data),
  })
}

export function buildCancelListingTx(
  contractAddress: string,
  sender: string,
  listingId: number,
  nonce: number
): Transaction {
  if (!listingId || listingId < 1) throw new Error('listing_id invalid')
  const data = `cancelListing@${u64ToHex(listingId)}`
  return new Transaction({
    nonce,
    value: '0',
    receiver: Address.fromBech32(contractAddress),
    sender: Address.fromBech32(sender),
    gasLimit: GAS_CANCEL,
    chainID: CHAIN_ID,
    data: new TransactionPayload(data),
  })
}

export function useAgentsMarketplace() {
  const contractAddress = useMemo(() => getAgentsMarketplaceAddress(), [])
  const [lastError, setLastError] = useState<ClassifiedTxError | null>(null)
  const [pending, setPending] = useState(false)
  const { state: txState, send, reset: resetTx } = useSendTx()

  const isConfigured = Boolean(contractAddress && contractAddress.startsWith('erd1'))

  const guard = useCallback(
    (opts: { isLoggedIn?: boolean; address?: string | null; valueAtomic?: bigint }) => {
      const pre = preflightTxErrors({
        isLoggedIn: opts.isLoggedIn,
        address: opts.address,
        contractConfigured: isConfigured,
        valueAtomic: opts.valueAtomic,
      })
      if (pre) {
        setLastError(pre)
        return false
      }
      setLastError(null)
      return true
    },
    [isConfigured]
  )

  const listAgent = useCallback(
    async (
      sender: string,
      nonce: number,
      params: ListParams,
      opts?: { isLoggedIn?: boolean; autoSend?: boolean }
    ) => {
      setLastError(null)
      if (!guard({ isLoggedIn: opts?.isLoggedIn ?? true, address: sender })) return null
      setPending(true)
      try {
        const tx = buildListAgentTx(contractAddress, sender, params, nonce)
        const plain = {
          receiver: contractAddress,
          value: '0',
          data: tx.getData().toString(),
          gasLimit: GAS_LIST,
          chainID: CHAIN_ID,
        }
        if (opts?.autoSend) {
          const result = await send(tx)
          if (!result.ok) setLastError(result.error)
          return { tx, plain, result }
        }
        return { tx, plain }
      } catch (e) {
        const c = classifyTxError(e, 'failed')
        setLastError(c)
        return null
      } finally {
        setPending(false)
      }
    },
    [contractAddress, guard, send]
  )

  const buyAgent = useCallback(
    async (
      sender: string,
      nonce: number,
      params: BuyParams,
      opts?: { isLoggedIn?: boolean; balanceAtomic?: string; autoSend?: boolean }
    ) => {
      setLastError(null)
      const valueAtomic = egldToAtomic(params.priceEgld)
      const pre = preflightTxErrors({
        isLoggedIn: opts?.isLoggedIn ?? true,
        address: sender,
        contractConfigured: isConfigured,
        balanceAtomic: opts?.balanceAtomic,
        valueAtomic,
      })
      if (pre) {
        setLastError(pre)
        return null
      }
      setPending(true)
      try {
        const tx = buildBuyAgentTx(contractAddress, sender, params, nonce)
        const plain = {
          receiver: contractAddress,
          value: valueAtomic.toString(),
          data: tx.getData().toString(),
          gasLimit: GAS_BUY,
          chainID: CHAIN_ID,
        }
        if (opts?.autoSend) {
          const result = await send(tx)
          if (!result.ok) setLastError(result.error)
          return { tx, plain, result }
        }
        return { tx, plain }
      } catch (e) {
        const c = classifyTxError(e, 'failed')
        setLastError(c)
        return null
      } finally {
        setPending(false)
      }
    },
    [contractAddress, isConfigured, send]
  )

  const cancelListing = useCallback(
    async (
      sender: string,
      nonce: number,
      listingId: number,
      opts?: { isLoggedIn?: boolean; autoSend?: boolean }
    ) => {
      setLastError(null)
      if (!guard({ isLoggedIn: opts?.isLoggedIn ?? true, address: sender })) return null
      setPending(true)
      try {
        const tx = buildCancelListingTx(contractAddress, sender, listingId, nonce)
        const plain = {
          receiver: contractAddress,
          value: '0',
          data: tx.getData().toString(),
          gasLimit: GAS_CANCEL,
          chainID: CHAIN_ID,
        }
        if (opts?.autoSend) {
          const result = await send(tx)
          if (!result.ok) setLastError(result.error)
          return { tx, plain, result }
        }
        return { tx, plain }
      } catch (e) {
        const c = classifyTxError(e, 'failed')
        setLastError(c)
        return null
      } finally {
        setPending(false)
      }
    },
    [contractAddress, guard, send]
  )

  return {
    contractAddress,
    isConfigured,
    pending: pending || ['signing', 'broadcasting', 'pending'].includes(txState.phase),
    lastError,
    txState,
    listAgent,
    buyAgent,
    cancelListing,
    resetTx,
    send,
  }
}
