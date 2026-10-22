import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumBridge'

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
  const [vellum, setVellum] = useState<VellumLastRun | null>(null)

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
    void fetchVellumLastRun().then(setVellum)
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
            {xaRender("LIA Shadow · paper ")}</p>
          <h2 className="text-lg font-semibold text-white">{xaRender("War room")}</h2>
          <p className="text-[12px] text-zinc-500">
            {xaRender("Stratégie + ledger virtuel + STVP 7j. Aucune TX on-chain. ")}</p>
        </div>
        <span className="rounded-full border border-cyan-500/30 px-2 py-0.5 text-[10px] text-cyan-200">
          {xaRender("PAPER ")}</span>
      </header>

      {xaRender(vellum && (
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-zinc-400">
          <p className="text-zinc-500">{xaRender("Vellum last run")}</p>
          <p className="text-zinc-200">
            {xaRender(vellum.ts || '—')} {xaRender(" · mode ")}{xaRender(vellum.summary?.mode || '—')} ·{xaRender(' ')}
            {xaRender(vellum.summary?.ok === false ? 'steps failed' : 'ok')} {xaRender(" · live=")}{xaRender(String(!!vellum.live))}
          </p>
          {xaRender(!!vellum.summary?.failed_steps?.length && (
            <p className="text-amber-200/80 mt-0.5">{xaRender("fail: ")}{xaRender(vellum.summary.failed_steps.join(', '))}</p>
          ))}
        </div>
      ))}

      <div className="grid sm:grid-cols-3 gap-2 text-[12px]">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500">{xaRender("EGLD virtuel")}</p>
          <p className="text-white font-semibold tabular-nums">{xaRender(fmt(bal.EGLD, 4))}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500">{xaRender("USDC virtuel")}</p>
          <p className="text-white font-semibold tabular-nums">{xaRender(fmt(bal.USDC, 2))}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500">{xaRender("TRO virtuel")}</p>
          <p className="text-white font-semibold tabular-nums">{xaRender(fmt(bal.TRO, 0))}</p>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500">
        {xaRender("Prix EGLD :")}{xaRender(' ')}
        <span className="text-zinc-300 tabular-nums">
          {xaRender(priceUsd > 0 ? `$${fmt(priceUsd, 2)}` : '—')}
        </span>{xaRender(' ')}
        · {xaRender(priceSrc)}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary text-sm active:scale-[0.98]"
          disabled={busy}
          onClick={() => void runTick()}
        >
          {xaRender(busy ? '…' : 'Tick décision')}
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => void refreshPrice()}
        >
          {xaRender("Prix ")}</button>
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
          {xaRender("Reset ledger ")}</button>
      </div>

      {xaRender(cycle && (
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 space-y-1 text-[12px]">
          <p className="text-zinc-400">{xaRender("Mindset")}</p>
          <p className="text-white font-medium">{xaRender(cycle.strategy)}</p>
          <p className="text-zinc-500">{xaRender(cycle.reason)}</p>
          <p className="text-zinc-400">
            {xaRender("Intent : ")}<span className="text-cyan-200">{xaRender(cycle.intent.action)}</span> {xaRender(" · aura")}{xaRender(' ')}
            <span className="text-zinc-200">{xaRender(cycle.aura)}</span>
            {xaRender(cycle.blocked ? ` · bloqué ${cycle.blocked}` : '')}
          </p>
          {xaRender(cycle.fill && (
            <p className="text-emerald-200/90">
              {xaRender("Fill shadow : ")}{xaRender(cycle.fill.side)} {xaRender(fmt(cycle.fill.amount, 4))} @ {xaRender(fmt(cycle.fill.price, 2))} {xaRender(" · slip ")}{xaRender(fmt(cycle.fill.slippagePct, 2))}%
            </p>
          ))}
        </div>
      ))}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            {xaRender("STVP 7 jours ")}</p>
          {xaRender(!stvp.startedAt ? (
            <button type="button" className="btn-secondary text-xs" onClick={onStartStvp}>
              {xaRender("Démarrer protocole ")}</button>
          ) : (
            <span className="text-[11px] text-zinc-400">{xaRender("Jour calendaire ≈ ")}{xaRender(day || '—')}/7</span>
          ))}
        </div>
        {xaRender(stvp.startedAt && (
          <div className="flex flex-wrap gap-1.5">
            {xaRender(([1, 2, 3, 4, 5, 6, 7] as StvpDay[]).map(d => {
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
                  J{xaRender(d)}
                </button>
              )
            }))}
          </div>
        ))}
        {xaRender(kpi && stvp.startedAt && (
          <div className="rounded-xl border border-white/10 px-3 py-2 text-[12px] space-y-1">
            <p className="text-zinc-400">{xaRender("KPI vs HODL EGLD")}</p>
            <p className="text-zinc-200">
              {xaRender("Shadow ")}{xaRender(fmt(kpi.shadowRetPct, 2))}{xaRender("% · HODL ")}{xaRender(fmt(kpi.hodlRetPct, 2))}{xaRender("% · Alpha")}{xaRender(' ')}
              <span className={kpi.alphaPct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                {xaRender(fmt(kpi.alphaPct, 2))}%
              </span>
            </p>
            <p className="text-[11px] text-zinc-500">
              {xaRender("Cible STVP : alpha ≥ 5% → ")}{xaRender(kpi.passAlpha5 ? 'OK' : 'pas encore')}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{xaRender("Log shadow")}</p>
        <ul className="max-h-36 overflow-y-auto space-y-1 text-[11px] mono text-zinc-400">
          {xaRender(log.length === 0 && <li>{xaRender("Aucun fill — lance un tick.")}</li>)}
          {xaRender([...log].reverse().map(f => (
            <li key={f.id}>
              {xaRender(new Date(f.at).toLocaleTimeString())} · {xaRender(f.strategy)} · {xaRender(f.side)} {xaRender(fmt(f.amount, 3))}
            </li>
          )))}
        </ul>
      </div>
    </section>
  )
}
