/**
 * Affiche soldes EGLD + tokens + estimation USD du wallet protocole LIA.
 */
import { useEffect, useState } from 'react'
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
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: d })
  if (n > 0) return n.toPrecision(3)
  return '0'
}

export default function LiaTreasuryPanel() {
  const [egld, setEgld] = useState(0)
  const [tokens, setTokens] = useState<Tok[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const base = 'https://api.multiversx.com'
        const [accRes, tokRes] = await Promise.all([
          fetch(`${base}/accounts/${LIA_WALLET}`, { cache: 'no-store' }),
          fetch(`${base}/accounts/${LIA_WALLET}/tokens?size=100`, { cache: 'no-store' }),
        ])
        if (!accRes.ok) throw new Error('Compte LIA indisponible')
        const acc = await accRes.json()
        const balanceEgld = Number(acc.balance || 0) / 1e18

        let list: Tok[] = []
        if (tokRes.ok) {
          const raw = await tokRes.json()
          const arr = Array.isArray(raw) ? raw : []
          list = arr.map((t: Record<string, unknown>) => {
            const decimals = Number(t.decimals ?? 18)
            const balRaw = Number(t.balance ?? 0)
            const balance = balRaw / Math.pow(10, decimals)
            const valueUsd = Number(t.valueUsd ?? t.value ?? 0)
            return {
              identifier: String(t.identifier ?? ''),
              name: String(t.name ?? t.ticker ?? t.identifier ?? ''),
              ticker: t.ticker ? String(t.ticker) : undefined,
              balance,
              valueUsd: Number.isFinite(valueUsd) ? valueUsd : 0,
              decimals,
            }
          })
          list.sort((a, b) => b.valueUsd - a.valueUsd || b.balance - a.balance)
        }

        if (!c) {
          setEgld(balanceEgld)
          setTokens(list)
        }
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Erreur fetch LIA')
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const tokensUsd = tokens.reduce((s, t) => s + (t.valueUsd || 0), 0)

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-violet-950/15 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">
            Trésorerie LIA (lecture)
          </p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1 break-all">{LIA_WALLET}</p>
        </div>
        <a
          href={LINKS.liaExplorer}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline"
        >
          Explorer ↗
        </a>
      </div>

      {loading && <p className="text-sm text-zinc-500">Chargement soldes…</p>}
      {err && <p className="text-sm text-rose-300">{err}</p>}

      {!loading && !err && (
        <>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <p className="text-[10px] uppercase text-zinc-500">EGLD</p>
              <p className="text-lg font-semibold text-white tabular-nums">{fmt(egld, 4)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <p className="text-[10px] uppercase text-zinc-500">Tokens (USD API)</p>
              <p className="text-lg font-semibold text-white tabular-nums">
                ${fmt(tokensUsd, 2)}
              </p>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-zinc-950 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-2 py-1.5">Token</th>
                  <th className="px-2 py-1.5 text-right">Balance</th>
                  <th className="px-2 py-1.5 text-right">USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {tokens.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-2 py-3 text-zinc-600">
                      Aucun ESDT listé
                    </td>
                  </tr>
                )}
                {tokens.map(t => (
                  <tr key={t.identifier}>
                    <td className="px-2 py-1.5">
                      <span className="text-white font-medium">{t.ticker || t.name}</span>
                      <span className="block text-[9px] text-zinc-600 font-mono truncate max-w-[140px]">
                        {t.identifier}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(t.balance)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-zinc-400">
                      {t.valueUsd > 0 ? `$${fmt(t.valueUsd, 2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-zinc-600">
            Données api.multiversx.com · lecture seule · pas de retrait depuis le front
          </p>
        </>
      )}
    </section>
  )
}
