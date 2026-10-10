/**
 * Console LIA autonome — wallet dédié, multi-IA (Gemini/Grok), pipelines GitHub.
 * Objectifs paper : PHYGITAL_REEVAL, slippage, santé DeFi.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumStatus'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import { fetchLiaStatus, type LiaStatusV1 } from '../lia/liaStatus'

const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const API = 'https://api.multiversx.com'
const TRO_ID = 'TRO-94c925'

type Balances = { egld: number | null; tro: number | null }
type SignalLine = { ts: string; source: 'Gemini' | 'Grok' | 'Vellum' | 'System'; text: string }

type Props = { compact?: boolean }

export default function LiaAgentControl({ compact = false }: Props) {
  const [bal, setBal] = useState<Balances>({ egld: null, tro: null })
  const [vellum, setVellum] = useState<VellumLastRun | null>(null)
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [status, setStatus] = useState<LiaStatusV1 | null>(null)
  const [signals, setSignals] = useState<SignalLine[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [egldR, troR, v, h, st] = await Promise.all([
        fetch(`${API}/accounts/${LIA_WALLET}`, { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`${API}/accounts/${LIA_WALLET}/tokens/${TRO_ID}`, { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null),
        fetchVellumLastRun().catch(() => null),
        fetchLiaHubStatus().catch(() => null),
        fetchLiaStatus().catch(() => null),
      ])
      const egld =
        egldR && Number.isFinite(Number(egldR.balance)) ? Number(egldR.balance) / 1e18 : null
      const tro =
        troR && Number.isFinite(Number(troR.balance))
          ? Number(troR.balance) / 10 ** (Number(troR.decimals) || 18)
          : null
      setBal({ egld, tro })
      setVellum(v)
      setHub(h)
      setStatus(st)

      const lines: SignalLine[] = []
      const now = new Date().toISOString().slice(11, 19)
      if (v?.live) {
        const mode = v.summary?.mode || (v.summary?.ok ? 'ok' : 'run')
        lines.push({ ts: now, source: 'Vellum', text: `Pipeline live · ${mode}` })
      } else {
        lines.push({
          ts: now,
          source: 'Vellum',
          text: 'Orchestration paper — dernier run offline ou en attente',
        })
      }
      lines.push({
        ts: now,
        source: 'Gemini',
        text: 'Analyse contextuelle RWA / sentiment marché (lecture seule)',
      })
      lines.push({
        ts: now,
        source: 'Grok',
        text: 'Vérocité code & live data MultiversX — health check DeFi',
      })
      if (h) {
        lines.push({
          ts: now,
          source: 'System',
          text: `Hub LIA · ${h.strategy || h.note || 'status reçu'}`,
        })
      }
      if (st?.aura?.mode) {
        lines.push({ ts: now, source: 'System', text: `Aura agent · ${st.aura.mode}` })
      }
      setSignals(lines)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const shortAddr = `${LIA_WALLET.slice(0, 10)}…${LIA_WALLET.slice(-6)}`

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/15 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/90 font-tech">
            LIA · Wallet autonome
          </p>
          <h3 className="text-base font-semibold text-white">Orchestration Multi-IA</h3>
          {!compact && (
            <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
              Vellum + Gemini (contexte) + Grok (live data) · objectifs paper réalistes
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary text-[11px] px-2 py-1"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? '…' : 'Rafraîchir'}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Wallet agent</p>
        <a
          href={`https://explorer.multiversx.com/accounts/${LIA_WALLET}`}
          target="_blank"
          rel="noreferrer"
          className="mono text-[12px] text-cyan-200/90 hover:text-cyan-100 break-all"
        >
          {shortAddr} ↗
        </a>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-[9px] text-zinc-500">EGLD</p>
            <p className="text-sm font-semibold text-white tabular-nums">
              {bal.egld == null ? '—' : bal.egld.toFixed(4)}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="text-[9px] text-zinc-500">$TRO</p>
            <p className="text-sm font-semibold text-white tabular-nums">
              {bal.tro == null
                ? '—'
                : bal.tro.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Flux signaux Multi-IA</p>
        <ul className="space-y-1.5 max-h-40 overflow-y-auto">
          {signals.map((s, i) => (
            <li key={`${s.source}-${i}`} className="flex gap-2 text-[11px] leading-snug">
              <span className="shrink-0 mono text-zinc-600">{s.ts}</span>
              <span
                className={`shrink-0 font-semibold ${
                  s.source === 'Grok'
                    ? 'text-violet-300'
                    : s.source === 'Gemini'
                      ? 'text-sky-300'
                      : s.source === 'Vellum'
                        ? 'text-emerald-300'
                        : 'text-zinc-400'
                }`}
              >
                {s.source}
              </span>
              <span className="text-zinc-300">{s.text}</span>
            </li>
          ))}
          {!signals.length && <li className="text-[11px] text-zinc-500">En attente de signaux…</li>}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1.5">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Pipelines & sync</p>
        <p className="text-[12px] text-zinc-300">
          Vellum ·{' '}
          <span className={vellum?.live ? 'text-emerald-300' : 'text-amber-200'}>
            {vellum?.live ? 'LIVE' : 'paper / offline'}
          </span>
          {vellum?.summary?.mode ? ` · ${vellum.summary.mode}` : ''}
        </p>
        <p className="text-[12px] text-zinc-300">
          Hub LIA ·{' '}
          <span className={hub ? 'text-emerald-300' : 'text-zinc-500'}>
            {hub ? hub.strategy || hub.note || 'sync' : 'non joignable'}
          </span>
        </p>
        <p className="text-[12px] text-zinc-300">
          GitHub data · commits / news / catalog alimentent LIA (Actions)
        </p>
        {status?.mindset?.strategy && (
          <p className="text-[11px] text-zinc-500 mono">strategy · {status.mindset.strategy}</p>
        )}
      </div>

      {!compact && (
        <div className="rounded-xl border border-violet-400/20 bg-violet-950/20 p-3 space-y-2">
          <p className="text-[10px] text-violet-300/90 uppercase tracking-wider font-tech">
            Objectifs atteignables (paper)
          </p>
          <ul className="text-[12px] text-zinc-300 space-y-1 list-disc list-inside">
            <li>
              Réévaluation œuvres RWA — intent{' '}
              <code className="text-[10px] text-violet-200">PHYGITAL_REEVAL</code>
            </li>
            <li>Monitoring santé pools DeFi & slippage (lecture seule)</li>
            <li>Signaux pack Pulse / Yield / Sentinel sans exécution auto</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="/lia" className="btn-secondary text-[11px] px-2 py-1">
              Hub LIA
            </Link>
            <Link to="/studio" className="btn-secondary text-[11px] px-2 py-1">
              Studio Phygital
            </Link>
            <Link to="/command-center" className="btn-secondary text-[11px] px-2 py-1">
              Command Center
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
