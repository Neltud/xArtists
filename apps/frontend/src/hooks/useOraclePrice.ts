/**
 * Frontend price hook — reads published oracle JSON (Vellum / board publish)
 * and optional live MultiversX economics API.
 */
import { useCallback, useEffect, useState } from 'react'

export type OracleState = {
  price: number
  ok: boolean
  source: string
  ts: number
  loading: boolean
  error: string | null
}

const DATA_URL = `${import.meta.env.BASE_URL}data/oracle_prices.json`
const MVX_ECONOMICS = 'https://api.multiversx.com/economics'

export function useOraclePrice(pollMs = 60_000): OracleState {
  const [state, setState] = useState<OracleState>({
    price: 0,
    ok: false,
    source: '',
    ts: 0,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    try {
      // 1) published oracle file (from LIA)
      try {
        const r = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          if (j?.ok && j?.price > 0) {
            setState({
              price: Number(j.price),
              ok: true,
              source: `oracle:${j.n_sources ?? 1}src`,
              ts: Number(j.ts) || Date.now() / 1000,
              loading: false,
              error: null,
            })
            return
          }
        }
      } catch {
        /* fall through */
      }

      // 2) MultiversX economics
      const r2 = await fetch(MVX_ECONOMICS, { cache: 'no-store' })
      if (!r2.ok) throw new Error(`economics HTTP ${r2.status}`)
      const eco = await r2.json()
      const price = Number(eco?.price ?? eco?.egldPrice ?? 0)
      if (price <= 0) throw new Error('no price in economics')
      setState({
        price,
        ok: true,
        source: 'mvx_economics',
        ts: Date.now() / 1000,
        loading: false,
        error: null,
      })
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        ok: false,
        error: e instanceof Error ? e.message : 'oracle error',
      }))
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), pollMs)
    return () => window.clearInterval(id)
  }, [refresh, pollMs])

  return state
}
