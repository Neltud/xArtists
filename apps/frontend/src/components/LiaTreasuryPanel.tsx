/**
 * Trésorerie LIA — soldes lisibles, poussière filtrée, USD clair.
 */
import { useEffect, useMemo, useState } from 'react'
import { LIA_WALLET, LINKS } from '../config/links'

type Tok = {
  identifier: string
  name: string
  ticker?: string
  balance: number
  valueUsd: number
  decimals: number
}

function fmt(n: number, d = 4): string {
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: d })
  if (n >= 0.0001) return n.toFixed(Math.min(6, d + 2))
  return '<0.0001'
}

/** Ignore dust sans valeur USD significative */
function isMeaningful(t: Tok): boolean {
  if (t.valueUsd >= 0.01) return true
  if (t.balance >= 0.001 && (t.ticker === 'TRO' || t.ticker?.includes('TRO'))) return true
  if (t.balance >= 1) return true
  return false
}

export default function LiaTreasuryPanel() {
  const [egld, setEgld] = useState(0)
  const [tokens, setTokens] = useState<Tok[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let stop = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const acc = await fetch(`https://api.multiversx.com/accounts/${LIA_WALLET}`).then(r => r.json())
        if (stop) return
        setEgld(Number(acc.balance || 0) / 1e18)
        const esdts = await fetch(
          `https://api.multiversx.com/accounts/${LIA_WALLET}/tokens?size=100`,
        ).then(r => r.json())
        if (stop) return
        const list: Tok[] = (Array.isArray(esdts) ? esdts : []).map((t: Record<string, unknown>) => {
          const dec = Number(t.decimals ?? 18)
          const bal = Number(t.balance || 0) / 10 ** dec
          const price = Number((t as { valueUsd?: number; price?: number }).valueUsd ?? (t as { price?: number }).price ?? 0)
          const valueUsd =
            typeof (t as { valueUsd?: number }).valueUsd === 'number'
              ? Number((t as { valueUsd?: number }).valueUsd)
              : bal * (price || 0)
          return {
            identifier: String(t.identifier || ''),
            name: String(t.name || t.ticker || ''),
            ticker: t.ticker ? String(t.ticker) : undefined,
            balance: bal,
            valueUsd: Number.isFinite(valueUsd) ? valueUsd : 0,
            decimals: dec,
          }
        })
        setTokens(list)
      } catch (e) {
        if (!stop) setErr(String(e))
      } finally {
        if (!stop) setLoading(false)
      }
    })()
    return () => {
      stop = true
    }
  }, [])

  const visible = useMemo(() => {
    return tokens
      .filter(isMeaningful)
      .sort((a, b) => b.valueUsd - a.valueUsd || b.balance - a.balance)
      .slice(0, 24)
  }, [tokens])

  const tokensUsd = visible.reduce((s, t) => s + (t.valueUsd || 0), 0)
  const dustHidden = tokens.length - visible.length

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-4 space-y-3 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80">
            Trésorerie LIA (lecture)
          </p>
          <p className="text-[11px] font-mono text-zinc-500 break-all mt-1">{LIA_WALLET}</p>
          <a
            href={LINKS.explorerAccount?.(LIA_WALLET) || `https://explorer.multiversx.com/accounts/${LIA_WALLET}`}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-cyan-300 hover:text-cyan-200 mt-1 inline-block"
          >
            Explorer ↗
          </a>
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500">Chargement soldes…</p>}
      {err && <p className="text-sm text-rose-300">{err}</p>}

      {!loading && !err && (
        <>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
              <p className="text-[10px] uppercase text-zinc-500">EGLD</p>
              <p className="text-xl font-semibold text-white tabular-nums">{fmt(egld, 4)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
              <p className="text-[10px] uppercase text-zinc-500">Tokens (USD)</p>
              <p className="text-xl font-semibold text-emerald-200 tabular-nums">
                ${fmt(tokensUsd, 2)}
              </p>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-zinc-950 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-2.5 py-2">Token</th>
                  <th className="px-2.5 py-2 text-right">Balance</th>
                  <th className="px-2.5 py-2 text-right">USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-2.5 py-3 text-zinc-600">
                      Aucun token significatif
                    </td>
                  </tr>
                )}
                {visible.map(t => (
                  <tr key={t.identifier} className="hover:bg-white/[0.03]">
                    <td className="px-2.5 py-2">
                      <span className="text-white font-medium">{t.ticker || t.name}</span>
                      <span className="block text-[9px] text-zinc-600 font-mono truncate max-w-[150px]">
                        {t.identifier}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-zinc-100">{fmt(t.balance)}</td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-zinc-400">
                      {t.valueUsd > 0 ? `$${fmt(t.valueUsd, 2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-zinc-600">
            api.multiversx.com · lecture seule
            {dustHidden > 0 ? ` · ${dustHidden} poussière masquée` : ''}
          </p>
        </>
      )}
    </section>
  )
}
