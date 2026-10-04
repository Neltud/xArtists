/**
 * Liquidity & Farms — multi-pool TRO (xExchange + OneDex) + wallet LIA positions.
 * Live TVL via mex pair API / account reserves. Safe React children only.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWalletTokens } from '../hooks/useWalletTokens'
import { getTroInfo, getEgldPrice } from '../services/priceService'
import LiaVsUserBanner from '../components/LiaVsUserBanner'

const XEXCHANGE_APP = 'https://xexchange.com'
const ONEDEX_APP = 'https://onedex.app'
const MVX_API = 'https://api.multiversx.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

type PoolCfg = {
  dex: string
  pair: string
  address: string
  lpToken?: string
  baseId?: string
  quoteId?: string
  mexPairPath?: string
  sharedRouter?: boolean
  dexscreener?: string
  swap_url?: string
  add_liquidity_url?: string
}

type PoolLive = PoolCfg & {
  tvlUsd: number | null
  troReserve: number | null
  quoteReserve: number | null
  quoteSymbol: string
  troPrice: number | null
  note?: string
}

function num(x: unknown): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}

function fmtUsd(n: number | null | undefined, d = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${n.toFixed(d)}`
}

function fmtAmt(n: number | null | undefined, d = 4): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { maximumFractionDigits: d })
}

async function loadPoolLive(p: PoolCfg, troPriceHint: number, egldPrice: number): Promise<PoolLive> {
  let tvlUsd: number | null = null
  let troReserve: number | null = null
  let quoteReserve: number | null = null
  let quoteSymbol = (p.quoteId || '').split('-')[0] || '—'
  let troPrice: number | null = troPriceHint || null
  let note: string | undefined

  // Prefer mex pair endpoint when path known (xExchange)
  if (p.mexPairPath) {
    try {
      const r = await fetch(`${MVX_API}/mex/pairs/${p.mexPairPath}`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        tvlUsd = num(j.totalValue) || null
        troPrice = num(j.baseSymbol === 'TRO' ? j.basePrice : j.quotePrice) || troPrice
        if (j.quoteSymbol) quoteSymbol = String(j.quoteSymbol)
        if (j.baseSymbol) {
          /* reserves from pair account below */
        }
      }
    } catch {
      /* */
    }
  }

  // Pair account reserves (works for dedicated pair contracts)
  if (p.address && !p.sharedRouter) {
    try {
      const tokens = await fetch(`${MVX_API}/accounts/${p.address}/tokens?size=30`).then(r =>
        r.json(),
      )
      if (Array.isArray(tokens)) {
        for (const t of tokens) {
          const id = String(t.identifier || '')
          const dec = num(t.decimals) || 18
          const bal = num(t.balance) / Math.pow(10, dec)
          if (id.startsWith('TRO-')) troReserve = bal
          if (p.quoteId && id === p.quoteId) quoteReserve = bal
          if (!p.quoteId && (id.startsWith('WEGLD') || id.startsWith('EGLD'))) {
            quoteReserve = bal
            quoteSymbol = id.split('-')[0]
          }
        }
      }
      if (tvlUsd == null && quoteReserve != null && egldPrice > 0 && quoteSymbol.includes('EGLD')) {
        tvlUsd = quoteReserve * egldPrice * 2
      }
      if (tvlUsd == null && troReserve != null && troPrice) {
        tvlUsd = troReserve * troPrice * 2
      }
    } catch {
      /* */
    }
  }

  // OneDex shared router: TRO reserve only (WEGLD is shared across pools)
  if (p.sharedRouter && p.address) {
    try {
      const t = await fetch(`${MVX_API}/accounts/${p.address}/tokens?size=200`).then(r => r.json())
      if (Array.isArray(t)) {
        const tro = t.find((x: { identifier?: string }) =>
          String(x.identifier || '').startsWith('TRO-'),
        )
        if (tro) {
          const dec = num(tro.decimals) || 6
          troReserve = num(tro.balance) / Math.pow(10, dec)
        }
      }
      note = 'Router partagé OneDex — TVL exacte non déductible du seul WEGLD global'
      if (tvlUsd == null && troReserve != null && troPrice) {
        // lower-bound hint: TRO side only ×2 if assuming balanced pool
        tvlUsd = troReserve * troPrice * 2
        note = 'TVL estimée (2× côté TRO @ prix mex) — router partagé'
      }
    } catch {
      /* */
    }
  }

  return {
    ...p,
    tvlUsd,
    troReserve,
    quoteReserve,
    quoteSymbol,
    troPrice,
    note,
  }
}

function CategorySection({
  title,
  icon,
  tokens,
  emptyText,
}: {
  title: string
  icon: string
  tokens: Array<{
    identifier: string
    ticker: string
    name: string
    balance: number
    price: number
    valueUsd: number
  }>
  emptyText: string
}) {
  const total = tokens.reduce((s, t) => s + (Number(t.valueUsd) || 0), 0)
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          {icon} {title}
        </h2>
        {tokens.length > 0 && (
          <span className="badge-purple">{fmtUsd(total)}</span>
        )}
      </div>
      {tokens.length === 0 ? (
        <p className="text-center text-gray-500 py-6">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                <th className="text-left py-2 px-3">Token</th>
                <th className="text-right py-2 px-3">Balance</th>
                <th className="text-right py-2 px-3">Prix</th>
                <th className="text-right py-2 px-3">Valeur USD</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(t => (
                <tr
                  key={t.identifier}
                  className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors"
                >
                  <td className="py-3 px-3">
                    <p className="font-semibold text-sm">{String(t.ticker || t.name)}</p>
                    <p className="text-xs mono text-gray-500">{String(t.identifier)}</p>
                  </td>
                  <td className="py-3 px-3 text-right mono text-sm">{fmtAmt(t.balance, 6)}</td>
                  <td className="py-3 px-3 text-right mono text-sm">{fmtUsd(t.price, 6)}</td>
                  <td className="py-3 px-3 text-right mono text-sm text-green-400">
                    {fmtUsd(t.valueUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function LPPoolsPage() {
  const { lpTokens, farmTokens, loading, refresh, totalEsdtUsd } = useWalletTokens()
  const [pools, setPools] = useState<PoolLive[]>([])
  const [meta, setMeta] = useState({ troPrice: 0, egldPrice: 0 })
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const base =
        (typeof import.meta !== 'undefined' && (import.meta as { env?: { BASE_URL?: string } }).env
          ?.BASE_URL) ||
        '/'
      const [cfg, tro, egld] = await Promise.all([
        fetch(`${base}data/config.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null),
        getTroInfo(),
        getEgldPrice(),
      ])
      const troPrice = num(tro?.price)
      const egldPrice = num(egld)
      setMeta({ troPrice, egldPrice })

      const list: PoolCfg[] = Array.isArray(cfg?.pools) ? cfg.pools : []
      const live = await Promise.all(list.map(p => loadPoolLive(p, troPrice, egldPrice)))
      setPools(live)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Chargement pools échoué')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const totalLp = (lpTokens || []).reduce((s, t) => s + (Number(t.valueUsd) || 0), 0)
  const totalFarm = (farmTokens || []).reduce((s, t) => s + (Number(t.valueUsd) || 0), 0)

  return (
    <div className="animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black">Liquidity & Farms</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Pools $TRO listées (xExchange + OneDex). Rewards = fees DEX (+ farms si actives).
            Token TRO-94c925.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} className="btn-secondary text-sm">
            Actualiser pools
          </button>
          <button type="button" onClick={refresh} className="btn-secondary text-sm">
            Wallet LIA
          </button>
          <Link to="/tro" className="btn-primary text-sm">
            $TRO / Buy
          </Link>
        </div>
      </div>

      <LiaVsUserBanner tone="protocol" />

      {err && <p className="text-sm text-amber-200 mb-4">{err}</p>}

      <div className="grid sm:grid-cols-3 gap-3 mb-6 text-sm">
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">Prix TRO</p>
          <p className="font-bold text-purple-300">
            {meta.troPrice > 0 ? `$${meta.troPrice.toFixed(8)}` : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">Prix EGLD</p>
          <p className="font-bold">{meta.egldPrice > 0 ? `$${meta.egldPrice.toFixed(2)}` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">Pools listées</p>
          <p className="font-bold">{pools.length}</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {pools.length === 0 && (
          <p className="text-sm text-zinc-500">Chargement des pools…</p>
        )}
        {pools.map(p => (
          <article
            key={`${p.dex}-${p.pair}-${p.lpToken || p.address}`}
            className="card border border-white/10 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-semibold">
                  {p.dex}
                </p>
                <h2 className="text-lg font-bold text-white">{p.pair}</h2>
                {p.lpToken && (
                  <p className="text-[11px] mono text-zinc-500">{p.lpToken}</p>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] border ${
                  p.tvlUsd && p.tvlUsd > 0
                    ? 'border-emerald-400/40 text-emerald-200'
                    : 'border-white/15 text-zinc-400'
                }`}
              >
                {p.tvlUsd && p.tvlUsd > 0 ? 'active' : 'low / n/a'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
              <div className="rounded-xl bg-black/30 p-2">
                <p className="text-zinc-500">TVL est.</p>
                <p className="font-semibold text-green-400">{fmtUsd(p.tvlUsd)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-2">
                <p className="text-zinc-500">TRO in pool</p>
                <p className="font-semibold">{fmtAmt(p.troReserve, 2)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-2">
                <p className="text-zinc-500">{p.quoteSymbol} in pool</p>
                <p className="font-semibold">{fmtAmt(p.quoteReserve, 4)}</p>
              </div>
              <div className="rounded-xl bg-black/30 p-2">
                <p className="text-zinc-500">Prix TRO</p>
                <p className="font-semibold text-purple-300">
                  {p.troPrice ? `$${p.troPrice.toFixed(8)}` : '—'}
                </p>
              </div>
            </div>

            {p.note && <p className="text-[11px] text-amber-200/80">{p.note}</p>}

            <div className="flex flex-wrap gap-2">
              <a
                href={p.add_liquidity_url || p.swap_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs"
              >
                Add liquidity
              </a>
              {p.dexscreener && (
                <a href={p.dexscreener} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                  DexScreener
                </a>
              )}
              {p.swap_url && (
                <a href={p.swap_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                  Swap
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        Lien farms xExchange :{' '}
        <a className="text-cyan-400 underline" href={`${XEXCHANGE_APP}/farms`} target="_blank" rel="noreferrer">
          xexchange.com/farms
        </a>
        {' · '}
        <a className="text-cyan-400 underline" href={ONEDEX_APP} target="_blank" rel="noreferrer">
          OneDex
        </a>
        {' · DAO : '}
        <Link to="/dao" className="text-cyan-400 underline">
          /dao
        </Link>
      </p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <p className="text-[10px] text-zinc-500">LP wallet LIA</p>
              <p className="text-xl font-bold">{fmtUsd(totalLp)}</p>
            </div>
            <div className="card">
              <p className="text-[10px] text-zinc-500">Farms wallet LIA</p>
              <p className="text-xl font-bold">{fmtUsd(totalFarm)}</p>
            </div>
            <div className="card">
              <p className="text-[10px] text-zinc-500">ESDT total (hook)</p>
              <p className="text-xl font-bold">{fmtUsd(Number(totalEsdtUsd) || 0)}</p>
            </div>
          </div>
          <CategorySection
            title="Positions LP (wallet LIA)"
            icon="💧"
            tokens={lpTokens || []}
            emptyText="Aucune position LP détectée sur le wallet protocole."
          />
          <CategorySection
            title="Farms"
            icon="🚜"
            tokens={farmTokens || []}
            emptyText="Aucune farm détectée."
          />
          <div className="flex flex-wrap gap-2">
            <a href={`${XEXCHANGE_APP}/pools`} className="btn-secondary text-sm" target="_blank" rel="noreferrer">
              xExchange pools
            </a>
            <a href={ONEDEX_APP} className="btn-secondary text-sm" target="_blank" rel="noreferrer">
              OneDex
            </a>
            <a
              href={`https://explorer.multiversx.com/accounts/${WALLET}`}
              className="btn-secondary text-sm"
              target="_blank"
              rel="noreferrer"
            >
              Explorer LIA
            </a>
          </div>
        </>
      )}
    </div>
  )
}
