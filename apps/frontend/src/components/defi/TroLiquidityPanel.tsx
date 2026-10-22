import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Panneau farming $TRO — métriques xExchange + OneDex (lecture seule).
 * Mode Pitch : bloc démo TVL / $TRO (PITCH_DEMO).
 */
import { useEffect, useState } from 'react'
import { isPitchMode, PITCH_DEMO, PITCH_EVENT } from '../../lib/pitchMode'
import {
  fetchTroLiquiditySnapshot,
  formatApr,
  formatTvl,
  type TroLiquiditySnapshot,
} from '../../services/defi/troLiquidityService'
import { DEX_LABEL } from '../../config/troPools'

const STALE_MS = 300_000

export default function TroLiquidityPanel() {
  const [pitch, setPitch] = useState(() => isPitchMode())
  const [snap, setSnap] = useState<TroLiquiditySnapshot | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const on = () => setPitch(isPitchMode())
    window.addEventListener(PITCH_EVENT, on)
    return () => window.removeEventListener(PITCH_EVENT, on)
  }, [])

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

  const pitchLine =
    'TVL indicatif · $' +
    PITCH_DEMO.tvlUsd.toLocaleString() +
    ' · $TRO ' +
    String(PITCH_DEMO.troUsd)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-[10px] font-tech uppercase tracking-wider text-violet-300/90">
          {xaRender("Farming & Liquidité $TRO ")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {xaRender(snap?.troUsd != null && (
            <span className="text-[11px] mono tabular-nums text-violet-200">
              {xaRender("$TRO Spot $ ")}{xaRender(snap.troUsd < 0.01 ? snap.troUsd.toFixed(6) : snap.troUsd.toFixed(4))}
            </span>
          ))}
          {xaRender(snap &&
            (isStale ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200 text-[9px] py-0.5 px-1.5 font-tech uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                {xaRender("STALE ")}</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 text-[9px] py-0.5 px-1.5 font-tech uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                {xaRender("LIVE ")}</span>
            )))}
        </div>
      </div>

      {xaRender(pitch && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100/90 space-y-1">
          <p className="font-semibold text-[12px]">{xaRender("Mode Pitch · liquidité démo")}</p>
          <p>{xaRender(pitchLine)}</p>
          <p className="text-[10px] text-amber-200/70">{xaRender(PITCH_DEMO.note)}</p>
        </div>
      ))}

      {xaRender(loading && !snap && !pitch && (
        <p className="text-[12px] text-zinc-500">{xaRender("Chargement des pools…")}</p>
      ))}
      {xaRender(err && <p className="text-[12px] text-amber-200/90">{xaRender(err)}</p>)}

      {xaRender(snap && (
        <div className="grid gap-2 sm:grid-cols-2">
          {xaRender(snap.farms.map(f => (
            <div
              key={f.poolId}
              className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 space-y-1"
            >
              <p className="text-[12px] font-medium text-white">
                {xaRender(DEX_LABEL[f.dex] || f.dex)} · {xaRender(f.pair)}
              </p>
              <p className="text-[11px] text-zinc-400">
                {xaRender("APR ")}{xaRender(formatApr(f.aprPct))} {xaRender(" · TVL ")}{xaRender(formatTvl(f.tvlUsd))}
              </p>
              {xaRender(f.swapUrl && (
                <a
                  href={f.swapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  {xaRender("Ouvrir pool → ")}</a>
              ))}
            </div>
          )))}
          {xaRender(snap.farms.length === 0 && (
            <p className="text-[12px] text-zinc-500 col-span-full">{xaRender("Aucun pool $TRO indexé.")}</p>
          ))}
        </div>
      ))}

      <p className="text-[10px] text-zinc-600">
        {xaRender("Lecture seule — exécution via xPortal. Données MultiversX (API publique). ")}</p>
    </div>
  )
}
