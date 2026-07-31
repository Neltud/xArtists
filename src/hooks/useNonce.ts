/**
 * React hook — live MultiversX nonce with polling
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchAccountNonce,
  getFreshNonce,
  NonceTracker,
  waitNonceAdvanced,
  waitNonceStable,
  type AccountNonceInfo,
  type PollOptions,
} from '../services/nonce'

export type UseNonceState = {
  nonce: number | null
  balance?: string
  loading: boolean
  error: string | null
  source?: AccountNonceInfo['source']
  updatedAt: number | null
}

export function useNonce(
  address: string | null | undefined,
  opts: PollOptions & {
    /** Auto-poll interval while mounted (0 = off) */
    pollIntervalMs?: number
    enabled?: boolean
  } = {}
) {
  const { pollIntervalMs = 12_000, enabled = true, ...pollOpts } = opts
  const [state, setState] = useState<UseNonceState>({
    nonce: null,
    loading: false,
    error: null,
    updatedAt: null,
  })
  const abortRef = useRef<AbortController | null>(null)
  const trackerRef = useRef<NonceTracker | null>(null)

  const refresh = useCallback(
    async (stable = false) => {
      if (!address || !enabled) return null
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const info = stable
          ? await waitNonceStable(address, { ...pollOpts, signal: ac.signal })
          : await fetchAccountNonce(address, { ...pollOpts, signal: ac.signal })
        setState({
          nonce: info.nonce,
          balance: info.balance,
          loading: false,
          error: null,
          source: info.source,
          updatedAt: info.fetchedAt,
        })
        return info.nonce
      } catch (e) {
        if ((e as Error)?.message === 'aborted' || ac.signal.aborted) {
          setState((s) => ({ ...s, loading: false }))
          return null
        }
        const msg = e instanceof Error ? e.message : String(e)
        setState((s) => ({ ...s, loading: false, error: msg }))
        return null
      }
    },
    [address, enabled, pollOpts.api, pollOpts.gateway, pollOpts.preferGateway]
  )

  /** Fresh nonce for building a TX (stable read by default) */
  const getNonceForTx = useCallback(async () => {
    if (!address) throw new Error('No address for nonce')
    const n = await getFreshNonce(address, { ...pollOpts, stable: true })
    setState((s) => ({
      ...s,
      nonce: n,
      updatedAt: Date.now(),
      error: null,
    }))
    return n
  }, [address, pollOpts.api, pollOpts.gateway])

  /** Tracker for multi-tx batch */
  const getTracker = useCallback(async () => {
    if (!address) throw new Error('No address')
    const t = new NonceTracker(address, pollOpts)
    await t.syncFromNetwork(true)
    trackerRef.current = t
    setState((s) => ({ ...s, nonce: t.peek(), updatedAt: Date.now() }))
    return t
  }, [address, pollOpts.api, pollOpts.gateway])

  const waitAfterTx = useCallback(
    async (usedNonce: number) => {
      if (!address) return null
      const info = await waitNonceAdvanced(address, usedNonce, pollOpts)
      setState((s) => ({
        ...s,
        nonce: info.nonce,
        updatedAt: info.fetchedAt,
      }))
      return info.nonce
    },
    [address, pollOpts.api, pollOpts.gateway]
  )

  useEffect(() => {
    if (!address || !enabled) {
      setState({
        nonce: null,
        loading: false,
        error: null,
        updatedAt: null,
      })
      return
    }
    void refresh(false)
    if (!pollIntervalMs || pollIntervalMs <= 0) return
    const id = setInterval(() => void refresh(false), pollIntervalMs)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [address, enabled, pollIntervalMs, refresh])

  return {
    ...state,
    refresh,
    getNonceForTx,
    getTracker,
    waitAfterTx,
  }
}
