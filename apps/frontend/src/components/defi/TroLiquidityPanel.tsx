/**
 * Panneau farming $TRO — métriques xExchange + OneDex (lecture seule).
 * Badge B2B Finance Computer API.
 */
import { useEffect, useState } from 'react'
import FinanceComputerBadge from '../FinanceComputerBadge'
import {
  fetchTroLiquiditySnapshot,
  formatApr,
  formatTvl,
  type TroLiquiditySnapshot,
} from '../../services/defi/troLiquidityService'
import { DEX_LABEL } from '../../config/troPools'

const STALE_MS = 300_000

export default function TroLiquidityPanel() {
  const [snap, setSnap] = useState<TroLiquiditySnapshot | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

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
    const tick = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => {
      cancel = true
      window.clearInterval(id)
      window.clearInterval(tick)
    }
  }, [])

  const fetchedMs = snap?.fetchedAt ? Date.parse(snap.fetchedAt) : NaN
  const ageMs = Number.isFinite(fetchedMs) ? now - fetchedMs : null
  const isStale = ageMs == null || ageMs > STALE_MS

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <p className="text-[10px] font-tech uppercase tracking-wider text-violet-300/90">
            Farming & Liquidité $TRO
          </p>
          <FinanceComputerBadge className="mt-1.5" compact />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {snap?.troUsd != null && (
            <span className="text-[11px] mono tabular-nums text-violet-200">
              $TRO Spot $
              {snap.troUsd < 0.01 ? snap.troUsd.toFixed(6) : snap.troUsd.toFixed(4)}
            </span>
          )}
          {snap &&
            (isStale ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200 text-[9px] py-0.5 px-1.5 font-tech uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                STALE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 text-[9px] py-0.5 px-1.5 font-tech uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                LIVE
              </span>
            ))}
        </div>
      </div>

      {loading && !snap && <p className="text-[12px] text-zinc-500">Chargement des pools…</p>}
      {err && <p className="text-[12px] text-amber-200/90">{err}</p>}

      {snap && (
        <div className="grid gap-2 sm:grid-cols-2">
          {snap.farms.map(f => (
            <div
              key={f.poolId}
              className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 space-y-1"
            >
              <p className="text-[12px] font-medium text-white">
                {DEX_LABEL[f.dex] || f.dex} · {f.pair}
              </p>
              <p className="text-[11px] text-zinc-400">
                APR {formatApr(f.aprPct)} · TVL {formatTvl(f.tvlUsd)}
              </p>
              {f.swapUrl && (
                <a
                  href={f.swapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Ouvrir pool →
                </a>
              )}
            </div>
          ))}
          {snap.farms.length === 0 && (
            <p className="text-[12px] text-zinc-500 col-span-full">Aucun pool $TRO indexé.</p>
          )}
        </div>
      )}

      <p className="text-[10px] text-zinc-600">
        Lecture seule — exécution via xPortal. Données Finance Computer / MultiversX.
      </p>
    </div>
  )
}
