/**
 * Live multi-asset tape — mono tabular-nums.
 */
import { useEffect, useState } from 'react'
import { asText } from '../lib/safeRender'

export type AssetQuote = {
  id: string
  symbol: string
  usd: number | null
  change24h?: number | null
}

const CG =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,bittensor,elrond-erd-2,pax-gold,tether&vs_currencies=usd&include_24hr_change=true'

async function loadQuotes(): Promise<AssetQuote[]> {
  const out: AssetQuote[] = [
    { id: 'btc', symbol: 'BTC', usd: null },
    { id: 'eth', symbol: 'ETH', usd: null },
    { id: 'sol', symbol: 'SOL', usd: null },
    { id: 'tao', symbol: 'TAO', usd: null },
    { id: 'egld', symbol: 'EGLD', usd: null },
    { id: 'xau', symbol: 'GOLD', usd: null },
    { id: 'eur', symbol: 'EUR', usd: null },
    { id: 'usd', symbol: 'USD', usd: 1 },
  ]
  try {
    const r = await fetch(CG, { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      const map: Record<string, { key: string; sym: string }> = {
        bitcoin: { key: 'btc', sym: 'BTC' },
        ethereum: { key: 'eth', sym: 'ETH' },
        solana: { key: 'sol', sym: 'SOL' },
        bittensor: { key: 'tao', sym: 'TAO' },
        'elrond-erd-2': { key: 'egld', sym: 'EGLD' },
        'pax-gold': { key: 'xau', sym: 'GOLD' },
      }
      for (const [cg, meta] of Object.entries(map)) {
        const row = j[cg]
        if (!row) continue
        const i = out.findIndex(x => x.id === meta.key)
        if (i >= 0) {
          out[i] = {
            id: meta.key,
            symbol: meta.sym,
            usd: Number(row.usd) || null,
            change24h: Number(row.usd_24h_change) || null,
          }
        }
      }
    }
  } catch {
    /* */
  }
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD', { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      const rate = Number(j?.rates?.USD)
      if (rate > 0) {
        const i = out.findIndex(x => x.id === 'eur')
        if (i >= 0) out[i] = { id: 'eur', symbol: 'EUR', usd: rate, change24h: null }
      }
    }
  } catch {
    /* */
  }
  if (out.find(x => x.id === 'egld')?.usd == null) {
    try {
      const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        const p = Number(j.price)
        if (p > 0) {
          const i = out.findIndex(x => x.id === 'egld')
          if (i >= 0) out[i] = { id: 'egld', symbol: 'EGLD', usd: p }
        }
      }
    } catch {
      /* */
    }
  }
  return out
}

function fmt(n: number | null, sym: string): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (sym === 'USD') return '1.00'
  if (n >= 1000) return `$${Math.round(n).toLocaleString('en-US')}`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(4)}`
}

export default function LiveAssetTape({ compact }: { compact?: boolean }) {
  const [rows, setRows] = useState<AssetQuote[]>([])
  const [ts, setTs] = useState<number | null>(null)

  useEffect(() => {
    let c = false
    const run = async () => {
      const q = await loadQuotes()
      if (!c) {
        setRows(q)
        setTs(Date.now())
      }
    }
    void run()
    const id = window.setInterval(() => void run(), 60_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <div
      className={`data-overlay-tape rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/40 via-black/50 to-violet-950/40 overflow-hidden ${
        compact ? 'py-1.5' : 'py-2'
      }`}
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-2 px-3 pb-1">
        <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-300/90 font-semibold font-tech">
          Live tape
        </span>
        <span className="badge-live badge-live-on">
          <span className="badge-live-dot" />
          LIVE
        </span>
        {ts && (
          <span className="text-[9px] text-zinc-600 mono tabular-nums">
            {new Date(ts).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-3 pb-1">
        {rows.map(a => {
          const ch = a.change24h
          const up = ch != null && ch >= 0
          return (
            <div
              key={a.id}
              className="shrink-0 min-w-[92px] rounded-xl border border-white/12 bg-black/45 px-2.5 py-1.5"
            >
              <p className="text-[10px] font-semibold tracking-wide text-zinc-400">{a.symbol}</p>
              <p className="text-[14px] font-bold mono tabular-nums text-white antialiased">
                {fmt(a.usd, a.symbol)}
              </p>
              {ch != null && (
                <p
                  className={`text-[10px] mono tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {up ? '+' : ''}
                  {asText(ch.toFixed(1))}%
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="px-3 pt-0.5 text-[9px] text-zinc-600">Sources publiques · pas un conseil financier</p>
    </div>
  )
}
