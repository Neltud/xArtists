/** Bandeau capital réel engagé (SC mainnet) — jamais les pots Fun. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatEgld, loadRce, type RceSnapshot } from '../lib/rce'

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
        if (!c) setErr(e instanceof Error ? e.message : 'RCE indisponible')
      })
    return () => {
      c = true
    }
  }, [])

  if (err) {
    return (
      <p className="text-[11px] text-zinc-600">Capital on-chain : {err}</p>
    )
  }

  if (!snap) {
    return (
      <p className="text-[11px] text-zinc-500 animate-pulse">Lecture soldes SC…</p>
    )
  }

  if (compact) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] uppercase tracking-wider text-emerald-300/90 font-semibold">
          RCE
        </span>
        <span className="text-sm font-semibold text-white tabular-nums">
          {formatEgld(snap.totalEgld)} EGLD
        </span>
        <span className="text-[11px] text-zinc-500">
          dans {snap.known} SC · hors crédits Fun / local
        </span>
        <Link to="/go-live" className="text-[11px] text-cyan-400 underline ml-auto">
          Détail →
        </Link>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/90 font-semibold">
            Real Capital Engaged
          </p>
          <p className="text-xl font-bold text-white tabular-nums">
            {formatEgld(snap.totalEgld)}{' '}
            <span className="text-sm font-normal text-zinc-400">EGLD on-chain</span>
          </p>
        </div>
        <p className="text-[11px] text-zinc-500">
          API MultiversX · {new Date(snap.at).toLocaleTimeString()}
        </p>
      </div>
      <p className="text-[12px] text-zinc-400">
        Soldes natifs des contrats (pas les packs appareil, pas le bank Fun, pas localStorage).
      </p>
      <ul className="grid sm:grid-cols-2 gap-2">
        {snap.lines.map(l => (
          <li
            key={l.id}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[12px]"
          >
            <div className="flex justify-between gap-2">
              <span className="text-zinc-300">{l.label}</span>
              <span className="tabular-nums text-white font-medium">
                {formatEgld(l.egld)}
              </span>
            </div>
            {l.address ? (
              <a
                href={`https://explorer.multiversx.com/accounts/${l.address}`}
                target="_blank"
                rel="noreferrer"
                className="mono text-[10px] text-zinc-600 truncate block hover:text-cyan-400"
              >
                {l.address.slice(0, 12)}…
              </a>
            ) : null}
            {l.error && <p className="text-[10px] text-amber-500/80">{l.error}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
