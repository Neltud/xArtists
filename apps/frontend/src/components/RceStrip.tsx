/** Bandeau Real Capital Engaged (SC mainnet) — jamais les pots Fun. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatEgld, loadRce, type RceSnapshot } from '../lib/rce'
import { asText } from '../lib/safeRender'

export default function RceStrip({ compact = false }: { compact?: boolean }) {
  const [snap, setSnap] = useState<RceSnapshot | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    loadRce()
      .then(s => {
        if (!c) setSnap(s)
      })
      .catch(e => {
        if (!c) setErr(asText(e, 'RCE indisponible'))
      })
    return () => {
      c = true
    }
  }, [])

  if (err) {
    return <p className="text-[11px] text-zinc-600">Capital on-chain : {asText(err)}</p>
  }

  if (!snap) {
    return <p className="text-[11px] text-zinc-500 animate-pulse">Lecture soldes SC…</p>
  }

  if (compact) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="text-[10px] uppercase tracking-wider text-emerald-300/90 font-semibold"
          title="Real Capital Engaged"
        >
          RCE
        </span>
        <span className="text-[10px] text-zinc-500 hidden sm:inline">Real Capital Engaged</span>
        <span className="text-sm font-semibold text-white tabular-nums">
          {asText(formatEgld(snap.totalEgld))} EGLD
        </span>
        <span className="text-[11px] text-zinc-500">
          dans {asText(snap.known)} SC · hors crédits Fun / local
        </span>
        <Link to="/go-live" className="text-[11px] text-cyan-400 underline ml-auto">
          Détail →
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/90 font-semibold">
            RCE · Real Capital Engaged
          </p>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            EGLD réellement déposé dans les smart contracts mainnet (pas le paper / Fun).
          </p>
        </div>
        <p className="text-xl font-bold text-white tabular-nums">
          {asText(formatEgld(snap.totalEgld))} EGLD
        </p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2 text-[12px]">
        {snap.lines.map(l => (
          <li
            key={asText(l.id)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 flex justify-between gap-2"
          >
            <span className="text-zinc-300">{asText(l.label)}</span>
            <span className="mono text-zinc-400 tabular-nums">
              {l.egld != null
                ? `${asText(formatEgld(l.egld))} EGLD`
                : l.error
                  ? asText(l.error)
                  : '—'}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/go-live" className="text-[12px] text-cyan-400 underline">
        Checklist go-live →
      </Link>
    </div>
  )
}
