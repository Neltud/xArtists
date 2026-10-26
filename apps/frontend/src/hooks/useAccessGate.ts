/**
 * React hook: server-verified access (JWT). localStorage cannot force FULL.
 * Fail-closed: network/API errors drop local FULL claims to SAMPLE.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  type AccessLevel,
  type AccessClaims,
  type VerifyAccessResult,
  resolveClientAccess,
  verifyAccessWithServer,
  clearStoredAccessToken,
} from '../lib/accessGate'

export function useAccessGate(walletAddress?: string | null) {
  const [level, setLevel] = useState<AccessLevel>('SAMPLE')
  const [claims, setClaims] = useState<AccessClaims | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<VerifyAccessResult | null>(null)

  const refreshLocal = useCallback(() => {
    const r = resolveClientAccess(walletAddress)
    setLevel(r.level)
    setClaims(r.claims)
    setToken(r.token)
  }, [walletAddress])

  const verify = useCallback(async () => {
    if (!walletAddress) {
      clearStoredAccessToken()
      setLevel('SAMPLE')
      setClaims(null)
      setToken(null)
      setLast(null)
      return null
    }
    setLoading(true)
    setError(null)
    try {
      const res = await verifyAccessWithServer(walletAddress)
      setLast(res)
      if (res.error && !res.token) setError(res.error)
      const r = resolveClientAccess(walletAddress)
      setLevel(r.level)
      setClaims(r.claims)
      setToken(r.token)
      return res
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'verify_error'
      setError(msg)
      // Fail-closed: API/network errors drop local FULL claims
      clearStoredAccessToken()
      setLevel('SAMPLE')
      setClaims(null)
      setToken(null)
      setLast(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [walletAddress, refreshLocal])

  useEffect(() => {
    refreshLocal()
  }, [refreshLocal])

  useEffect(() => {
    if (walletAddress) void verify()
  }, [walletAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    level,
    isFull: level === 'FULL',
    isSample: level !== 'FULL',
    claims,
    token,
    loading,
    error,
    last,
    verify,
    refreshLocal,
  }
}
