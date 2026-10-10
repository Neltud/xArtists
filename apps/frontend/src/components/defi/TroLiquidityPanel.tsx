/**
 * Panneau farming $TRO — métriques xExchange + OneDex (lecture seule).
 */
import { useEffect, useState } from 'react'
import {
  fetchTroLiquiditySnapshot,
  formatApr,
  formatTvl,
  DEX_LABEL,
  type TroLiquiditySnapshot,
} from '../../services/defi/troLiquidityService'

export default function TroLiquidityPanel() {
  const [snap, setSnap] = useState<TroLiquiditySnapshot | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    setLoading(true)
    fetchTroLiquiditySnapshot()
      .then(s => {
        if (!cancel) {
          setSnap(s)
          setErr(null)
        }
      })
      .catch(() => {
        if (!cancel) setErr('Impossible de charger les farms $TRO')
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    const id = window.setInterval(() => {
      void fetchTroLiquiditySnapshot().then(s => {
        if (!cancel) setSnap(s)
      })
    }, 60_000)
    return () => {
      cancel = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-black/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80 font-tech">
            Farming $TRO
          </p>
          <h3 className="text-sm font-semibold text-white">xExchange · OneDex</h3>
        </div>
        {snap?.troUsd != null && (
          <span className="text-[11px] mono tabular-nums text-violet-200">
            $TRO ${snap.troUsd < 0.01 ? snap.troUsd.toFixed(6) : snap.troUsd.toFixed(4)}
          </span>
        )}
      </div>

      {loading && !snap && <p className="text-[12px] text-zinc-500">Chargement pools…</p>}
      {err && <p className="text-[12px] text-amber-300/90">{err}</p>}

      {snap && (
        <>
          <div className="flex flex-wrap gap-3 text-[11px]">
            <span className="text-zinc-400">
              TVL Σ <strong className="text-zinc-100 mono tabular-nums">{formatTvl(snap.totalTvlUsd)}</strong>
            </span>
            {snap.egldUsd != null && (
              <span className="text-zinc-500 mono">EGLD ${snap.egldUsd.toFixed(2)}</span>
            )}
            <span className="text-zinc-600 mono">{snap.fetchedAt.slice(11, 19)} UTC</span>
          </div>

          <ul className="space-y-2">
            {snap.farms.map(f => (
              <li
                key={f.poolId}
                className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1"
              >
                <div className="min-w-[7rem]">
                  <p className="text-[12px] font-medium text-zinc-100">{f.pair}</p>
                  <p className="text-[10px] text-zinc-500">
                    {DEX_LABEL[f.dex]} · {f.role}
                  </p>
                </div>
                <div className="text-[11px] mono tabular-nums">
                  <p className="text-zinc-400">TVL</p>
                  <p className="text-zinc-200">{formatTvl(f.tvlUsd)}</p>
                </div>
                <div className="text-[11px] mono tabular-nums">
                  <p className="text-zinc-400">Vol 24h</p>
                  <p className="text-zinc-200">{formatTvl(f.volume24h)}</p>
                </div>
                <div className="text-[11px] mono tabular-nums">
                  <p className="text-zinc-400">APR</p>
                  <p className="text-amber-100/90">{formatApr(f.aprPct)}</p>
                </div>
                <a
                  href={f.swapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-[11px] text-cyan-300/90 hover:text-cyan-200"
                >
                  Swap →
                </a>
              </li>
            ))}
          </ul>

          {snap.notes.length > 0 && (
            <p className="text-[10px] text-zinc-600 leading-relaxed">{snap.notes.slice(0, 3).join(' · ')}</p>
          )}
        </>
      )}

      <p className="text-[10px] text-zinc-600">
        Lecture API publique · pas un conseil · APR OneDex via dApp officielle
      </p>
    </div>
  )
}
