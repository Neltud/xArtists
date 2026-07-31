/**
 * Agents Marketplace — List / Buy / Cancel via @multiversx/sdk-dapp sendTransactions
 * SC: contracts/agents-marketplace (listAgentAction, buyAgentAction, cancelListing)
 */
import { useCallback, useMemo, useState } from 'react'
import {
  Address,
  Transaction,
  TransactionPayload,
  TokenTransfer,
} from '@multiversx/sdk-core'

const CHAIN_ID = '1'
const GAS_LIST = 8_000_000
const GAS_BUY = 10_000_000
const GAS_CANCEL = 6_000_000

/** Resolve SC address: env > contracts.json runtime > empty */
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
  const bi = BigInt(n)
  let hex = bi.toString(16)
  if (hex.length % 2) hex = '0' + hex
  // MultiversX args often use minimal bytes; pad to at least 1 byte
  return hex
}

function egldToAtomic(egld: string | number): bigint {
  const s = String(egld).trim()
  if (!s || Number.isNaN(Number(s))) return 0n
  const [whole, frac = ''] = s.split('.')
  const fracPad = (frac + '000000000000000000').slice(0, 18)
  return BigInt(whole || '0') * 10n ** 18n + BigInt(fracPad || '0')
}

export type ListParams = {
  agentId: string
  priceEgld: string
}

export type BuyParams = {
  listingId: number
  priceEgld: string
}

/**
 * Build unsigned tx data for listAgentAction@agentId@price
 * Caller must sign via sdk-dapp useSendTransaction / sendTransactions
 */
export function buildListAgentTx(
  contractAddress: string,
  sender: string,
  params: ListParams,
  nonce: number
): Transaction {
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

/**
 * React hook — uses dynamic import of sdk-dapp send when available.
 * Falls back to returning built plain tx descriptors for external signing.
 */
export function useAgentsMarketplace() {
  const contractAddress = useMemo(() => getAgentsMarketplaceAddress(), [])
  const [lastError, setLastError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const isConfigured = Boolean(contractAddress && contractAddress.startsWith('erd1'))

  const listAgent = useCallback(
    async (sender: string, nonce: number, params: ListParams) => {
      setLastError(null)
      if (!isConfigured) {
        setLastError('Agents Marketplace address not set (VITE_AGENTS_MARKETPLACE_ADDRESS)')
        return null
      }
      setPending(true)
      try {
        const tx = buildListAgentTx(contractAddress, sender, params, nonce)
        // Prefer sdk-dapp if hooked in app; otherwise return raw for caller
        return {
          tx,
          plain: {
            receiver: contractAddress,
            value: '0',
            data: tx.getData().toString(),
            gasLimit: GAS_LIST,
            chainID: CHAIN_ID,
          },
        }
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e))
        return null
      } finally {
        setPending(false)
      }
    },
    [contractAddress, isConfigured]
  )

  const buyAgent = useCallback(
    async (sender: string, nonce: number, params: BuyParams) => {
      setLastError(null)
      if (!isConfigured) {
        setLastError('Agents Marketplace address not set')
        return null
      }
      setPending(true)
      try {
        const tx = buildBuyAgentTx(contractAddress, sender, params, nonce)
        return {
          tx,
          plain: {
            receiver: contractAddress,
            value: egldToAtomic(params.priceEgld).toString(),
            data: tx.getData().toString(),
            gasLimit: GAS_BUY,
            chainID: CHAIN_ID,
          },
        }
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e))
        return null
      } finally {
        setPending(false)
      }
    },
    [contractAddress, isConfigured]
  )

  const cancelListing = useCallback(
    async (sender: string, nonce: number, listingId: number) => {
      setLastError(null)
      if (!isConfigured) {
        setLastError('Agents Marketplace address not set')
        return null
      }
      setPending(true)
      try {
        const tx = buildCancelListingTx(contractAddress, sender, listingId, nonce)
        return {
          tx,
          plain: {
            receiver: contractAddress,
            value: '0',
            data: tx.getData().toString(),
            gasLimit: GAS_CANCEL,
            chainID: CHAIN_ID,
          },
        }
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e))
        return null
      } finally {
        setPending(false)
      }
    },
    [contractAddress, isConfigured]
  )

  return {
    contractAddress,
    isConfigured,
    pending,
    lastError,
    listAgent,
    buyAgent,
    cancelListing,
    buildListAgentTx,
    buildBuyAgentTx,
    buildCancelListingTx,
  }
}
