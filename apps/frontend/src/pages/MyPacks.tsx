import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import PackCheckout from '../components/PackCheckout'
import { AGENT_PACKS } from '../config/agentPacks'

type LedgerFile = {
  scenarios?: Record<
    string,
    {
      decision?: { strategy?: string; action?: string; confidence?: number }
      tickets?: Array<{
        pack: string
        ok: boolean
        size_usd: number
        action: string
        strategy: string
        reason: string
      }>
      totals?: { notional_usd?: number; pnl_usd_paper?: number }
    }
  >
  math_notes?: Record<string, unknown>
}

const LEDGER_URL =
  (import.meta.env.VITE_PAPER_LEDGER_URL as string | undefined) ||
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/simulated_ledger.json'

export default function MyPacks() {
  const { connected, address } = useWallet()
  const [ledger, setLedger] = useState<LedgerFile | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch(`${LEDGER_URL}?t=${Date.now()}`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j = (await r.json()) as LedgerFile
        if (!cancelled) setLedger(j)
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'ledger error')
      }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const feed = useMemo(() => {
    const rows: Array<{ pack: string; strategy: string; action: string; size_usd: number; reason: string; scenario: string }> =
      []
    if (!ledger?.scenarios) return rows
    for (const [scenario, body] of Object.entries(ledger.scenarios)) {
      for (const t of body.tickets || []) {
        if (t.ok && t.size_usd > 0) {
          rows.push({
            pack: t.pack,
            strategy: t.strategy,
            action: t.action,
            size_usd: t.size_usd,
            reason: t.reason,
            scenario,
          })
        }
      }
    }
    return rows.slice(0, 10)
  }, [ledger])

  return (
    <div className="animate-fade-in max-w-3xl mx-auto pb-24 md:pb-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black">My Packs</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Access membership · <span className="text-amber-300 font-medium">PAPER performance</span> · Model
          C (no real funds traded for packs)
        </p>
      </header>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90 leading-relaxed">
        You own an <strong>access pass</strong>, not a managed account. Figures below come from LIA’s{' '}
        <strong>paper router</strong> (simulated). They are not live profits on your capital.
      </div>

      <PackCheckout />

      <section className="card">
        <h2 className="font-bold text-sm text-zinc-300 mb-2">Wallet</h2>
        {connected && address ? (
          <p className="font-mono text-xs text-zinc-400 break-all">{address}</p>
        ) : (
          <p className="text-xs text-zinc-500">Connect wallet to bind membership NFT mint address.</p>
        )}
        <p className="text-[11px] text-zinc-600 mt-2">
          On-chain ownership list requires ACCESS NFT collection + API after mint pipeline is live.
        </p>
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-bold text-sm text-teal-200">Paper simulation by pack</h2>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">poll 60s</span>
        </div>
        {err && <p className="text-xs text-red-400 mb-2">Ledger: {err}</p>}
        <div className="grid sm:grid-cols-3 gap-3">
          {AGENT_PACKS.map(p => {
            const scen = ledger?.scenarios?.A_micro_arb
            const packTickets = (scen?.tickets || []).filter(t => t.pack === p.id && t.ok)
            const notional = packTickets.reduce((s, t) => s + (t.size_usd || 0), 0)
            return (
              <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                <p className={`font-semibold text-sm ${p.color}`}>
                  {p.icon} {p.name}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Sample scenario A (MICRO_ARB)</p>
                <p className="text-lg font-black text-white mt-2">
                  {notional > 0 ? `$${notional.toFixed(2)}` : '—'}
                </p>
                <p className="text-[10px] text-zinc-600">paper notional (router tickets)</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="font-bold text-sm text-zinc-300 mb-3">Live simulation feed (last tickets)</h2>
        {feed.length === 0 ? (
          <p className="text-xs text-zinc-500">No paper tickets yet — run simulate_multi_capital_ledger.py</p>
        ) : (
          <ul className="space-y-2">
            {feed.map((t, i) => (
              <li
                key={`${t.scenario}-${t.pack}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-800/80 pb-2"
              >
                <span className="font-mono text-zinc-400">{t.pack}</span>
                <span className="text-zinc-300">
                  {t.strategy} {t.action}
                </span>
                <span className="text-teal-300 font-semibold">${t.size_usd.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-zinc-600">
        <Link to="/agents" className="text-purple-400 hover:underline">
          ← Agents & packs catalog
        </Link>
      </p>
    </div>
  )
}
