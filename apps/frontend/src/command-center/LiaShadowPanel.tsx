/**
 * LIA Shadow War Room — strategy, virtual treasury, STVP, price tick.
 * Paper only — never signs TX.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  matrixFromPulse,
  runDecisionCycle,
  type CycleResult,
} from '../lia/decisionCycle'
import {
  loadShadowBalances,
  loadShadowLog,
  resetShadowLedger,
  type ShadowBalances,
  type ShadowFill,
} from '../lia/shadowLedger'
import { fetchEgldPrice } from '../lia/priceTick'
import {
  computeKpi,
  currentStvpDay,
  loadStvp,
  markStvpDay,
  startStvp,
  STVP_DAY_LABELS,
  type StvpDay,
  type StvpState,
  type KpiSnapshot,
} from '../lia/stvp'
import { usePulse } from '../hooks/usePulse'

function fmt(n: number, d = 2): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(d)
}

export default function LiaShadowPanel() {
  const { env } = usePulse()
  const [bal, setBal] = useState<ShadowBalances>(() => loadShadowBalances())
  const [log, setLog] = useState<ShadowFill[]>(() => loadShadowLog(12))
  const [cycle, setCycle] = useState<CycleResult | null>(null)
  const [priceUsd, setPriceUsd] = useState(0)
  const [priceSrc, setPriceSrc] = useState('—')
  const [stvp, setStvp] = useState<StvpState>(() => loadStvp())
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshLedger = useCallback(() => {
    setBal(loadShadowBalances())
    setLog(loadShadowLog(12))
  }, [])

  const refreshPrice = useCallback(async () => {
    const t = await fetchEgldPrice(true)
    setPriceUsd(t.priceUsd)
    setPriceSrc(t.source)
    return t.priceUsd
  }, [])

  const runTick = useCallback(async () => {
    setBusy(true)
    try {
      const px = await refreshPrice()
      const m = matrixFromPulse({
        assetId: 'EGLD',
        price: px,
        sentiment: typeof env?.sentiment === 'number' ? env.sentiment : 0,
        volatility: typeof (env as { volatility?: number })?.volatility === 'number'
          ? (env as { volatility: number }).volatility
          : 0.35,
        confidence: 0.6,
        rce: bal.EGLD * (px || 0) + bal.USDC,
      })
      const res = runDecisionCycle(m, { executeShadow: true })
      setCycle(res)
      refreshLedger()
      const b = loadShadowBalances()
      const s = loadStvp()
      if (s.startedAt) {
        setKpi(
          computeKpi({
            stvp: s,
            shadowEgld: b.EGLD,
            shadowUsdc: b.USDC,
            shadowTro: b.TRO,
            egldPriceUsd: px,
          }),
        )
      }
    } finally {
      setBusy(false)
    }
  }, [env, bal.EGLD, bal.USDC, refreshLedger, refreshPrice])

  useEffect(() => {
    void refreshPrice()
  }, [refreshPrice])

  const onStartStvp = () => {
    const b = loadShadowBalances()
    const equity = b.EGLD * (priceUsd || 0) + b.USDC
    const s = startStvp({
      equityUsd: equity || 1,
      egld: b.EGLD,
      egldPrice: priceUsd || 0,
    })
    setStvp(s)
    setKpi(
      computeKpi({
        stvp: s,
        shadowEgld: b.EGLD,
        shadowUsdc: b.USDC,
        shadowTro: b.TRO,
        egldPriceUsd: priceUsd,
      }),
    )
  }

  const day = currentStvpDay(stvp.startedAt)
  const markDay = (d: StvpDay) => {
    setStvp(markStvpDay(d, STVP_DAY_LABELS[d]))
  }

  return (
    <section className="card space-y-4 border-cyan-500/20">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/90 font-semibold">
            LIA Shadow · paper
          </p>
          <h2 className="text-lg font-semibold text-white">War room</h2>
          <p className="text-[12px] text-zinc-500">
            Stratégie + ledger virtuel + STVP 7j. Aucune TX on-chain.
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/30 px-2 py-0.5 text-[10px] text-cyan-200">
          PAPER
        </span>
      </header>

      <div className="grid sm:grid-cols-3 gap-2 text-[12px]">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500">EGLD virtuel</p>
          <p className="text-white font-semibold tabular-nums">{fmt(bal.EGLD, 4)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500">USDC virtuel</p>
          <p className="text-white font-semibold tabular-nums">{fmt(bal.USDC, 2)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500">TRO virtuel</p>
          <p className="text-white font-semibold tabular-nums">{fmt(bal.TRO, 0)}</p>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500">
        Prix EGLD :{' '}
        <span className="text-zinc-300 tabular-nums">
          {priceUsd > 0 ? `$${fmt(priceUsd, 2)}` : '—'}
        </span>{' '}
        · {priceSrc}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary text-sm active:scale-[0.98]"
          disabled={busy}
          onClick={() => void runTick()}
        >
          {busy ? '…' : 'Tick décision'}
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => void refreshPrice()}
        >
          Prix
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => {
            if (confirm('Reset ledger shadow ?')) {
              resetShadowLedger()
              refreshLedger()
              setCycle(null)
            }
          }}
        >
          Reset ledger
        </button>
      </div>

      {cycle && (
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 space-y-1 text-[12px]">
          <p className="text-zinc-400">Mindset</p>
          <p className="text-white font-medium">{cycle.strategy}</p>
          <p className="text-zinc-500">{cycle.reason}</p>
          <p className="text-zinc-400">
            Intent : <span className="text-cyan-200">{cycle.intent.action}</span> · aura{' '}
            <span className="text-zinc-200">{cycle.aura}</span>
            {cycle.blocked ? ` · bloqué ${cycle.blocked}` : ''}
          </p>
          {cycle.fill && (
            <p className="text-emerald-200/90">
              Fill shadow : {cycle.fill.side} {fmt(cycle.fill.amount, 4)} @ {fmt(cycle.fill.price, 2)} ·
              slip {fmt(cycle.fill.slippagePct, 2)}%
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            STVP 7 jours
          </p>
          {!stvp.startedAt ? (
            <button type="button" className="btn-secondary text-xs" onClick={onStartStvp}>
              Démarrer protocole
            </button>
          ) : (
            <span className="text-[11px] text-zinc-400">Jour calendaire ≈ {day || '—'}/7</span>
          )}
        </div>
        {stvp.startedAt && (
          <div className="flex flex-wrap gap-1.5">
            {([1, 2, 3, 4, 5, 6, 7] as StvpDay[]).map(d => {
              const on = stvp.checkedDays.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  title={STVP_DAY_LABELS[d]}
                  onClick={() => markDay(d)}
                  className={`rounded-lg px-2 py-1 text-[11px] border ${
                    on
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                      : 'border-white/10 text-zinc-500'
                  }`}
                >
                  J{d}
                </button>
              )
            })}
          </div>
        )}
        {kpi && stvp.startedAt && (
          <div className="rounded-xl border border-white/10 px-3 py-2 text-[12px] space-y-1">
            <p className="text-zinc-400">KPI vs HODL EGLD</p>
            <p className="text-zinc-200">
              Shadow {fmt(kpi.shadowRetPct, 2)}% · HODL {fmt(kpi.hodlRetPct, 2)}% · Alpha{' '}
              <span className={kpi.alphaPct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                {fmt(kpi.alphaPct, 2)}%
              </span>
            </p>
            <p className="text-[11px] text-zinc-500">
              Cible STVP : alpha ≥ 5% → {kpi.passAlpha5 ? 'OK' : 'pas encore'}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Log shadow</p>
        <ul className="max-h-36 overflow-y-auto space-y-1 text-[11px] mono text-zinc-400">
          {log.length === 0 && <li>Aucun fill — lance un tick.</li>}
          {[...log].reverse().map(f => (
            <li key={f.id}>
              {new Date(f.at).toLocaleTimeString()} · {f.strategy} · {f.side} {fmt(f.amount, 3)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
