/**
 * Liquidity & Farms — all TRO pools (xExchange + OneDex) + wallet positions.
 * Safe React children only (React #31).
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWalletTokens } from '../hooks/useWalletTokens'
import { getTroInfo, getEgldPrice } from '../services/priceService'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import { mergeTroPools, type TroPoolDef } from '../data/troPools'
import { asText } from '../lib/safeRender'

const XEXCHANGE_APP = 'https://xexchange.com'
const ONEDEX_APP = 'https://onedex.app'
const MVX_API = 'https://api.multiversx.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

type PoolCfg = TroPoolDef

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

async function loadPoolLive(
  p: PoolCfg,
  troPriceHint: number,
  egldPrice: number,
): Promise<PoolLive> {
  let tvlUsd: number | null = null
  let troReserve: number | null = null
  let quoteReserve: number | null = null
  let quoteSymbol = (p.quoteId || '').split('-')[0] || '—'
  let troPrice: number | null = troPriceHint || null
  let note: string | undefined

  if (p.mexPairPath) {
    try {
      const r = await fetch(`${MVX_API}/mex/pairs/${p.mexPairPath}`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        tvlUsd = num(j.totalValue) || null
        troPrice = num(j.baseSymbol === 'TRO' ? j.basePrice : j.quotePrice) || troPrice
        if (j.quoteSymbol) quoteSymbol = String(j.quoteSymbol)
      }
    } catch {
      /* */
    }
  }

  if (p.address && p.address.startsWith('erd1') && !p.sharedRouter) {
    try {
      const r = await fetch(`${MVX_API}/accounts/${p.address}/tokens?size=20`, {
        cache: 'no-store',
      })
      if (r.ok) {
        const toks = (await r.json()) as { identifier?: string; balance?: string; decimals?: number }[]
        if (Array.isArray(toks)) {
          for (const t of toks) {
            const id = String(t.identifier || '')
            const dec = Number(t.decimals ?? 18)
            const bal = Number(BigInt(t.balance || '0')) / 10 ** dec
            if (id.startsWith('TRO-')) troReserve = bal
            else if (id.includes('WEGLD') || id.includes('USDC') || id.includes('EGLD')) {
              quoteReserve = bal
              quoteSymbol = id.split('-')[0]
            }
          }
        }
      }
    } catch {
      /* */
    }
  }

  if (p.sharedRouter) {
    note = 'Router partagé OneDex — TVL indicative'
    try {
      const r = await fetch(`${MVX_API}/accounts/${p.address}/tokens?size=30`, {
        cache: 'no-store',
      })
      if (r.ok) {
        const toks = (await r.json()) as { identifier?: string; balance?: string; decimals?: number }[]
        const tro = (toks || []).find(x => String(x.identifier || '').startsWith('TRO-'))
        if (tro) {
          const dec = Number(tro.decimals ?? 18)
          troReserve = Number(BigInt(tro.balance || '0')) / 10 ** dec
          if (troPrice && troReserve) {
            tvlUsd = troReserve * troPrice * 2
            note = 'TVL estimée (2× côté TRO) — router partagé'
          }
        }
      }
    } catch {
      /* */
    }
  }

  if (tvlUsd == null && troReserve != null && quoteReserve != null) {
    const qPx =
      quoteSymbol === 'WEGLD' || quoteSymbol === 'EGLD'
        ? egldPrice
        : quoteSymbol === 'USDC'
          ? 1
          : 0
    if (troPrice && qPx) tvlUsd = troReserve * troPrice + quoteReserve * qPx
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

function TokenTable({
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
        {tokens.length > 0 && <span className="badge-purple">{fmtUsd(total)}</span>}
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
                  key={asText(t.identifier)}
                  className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors"
                >
                  <td className="py-3 px-3">
                    <p className="font-semibold text-sm">{asText(t.ticker || t.name)}</p>
                    <p className="text-xs mono text-gray-500">{asText(t.identifier)}</p>
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
      const base = import.meta.env.BASE_URL || '/'
      const [troInfo, egldPrice, cfgRes] = await Promise.all([
        getTroInfo().catch(() => ({ price: 0 })),
        getEgldPrice().catch(() => 0),
        fetch(`${base}data/config.json`, { cache: 'no-store' }).catch(() => null),
      ])
      const troPrice = num((troInfo as { price?: number })?.price)
      setMeta({ troPrice, egldPrice: num(egldPrice) })

      let cfgPools: PoolCfg[] = []
      if (cfgRes && cfgRes.ok) {
        const cfg = await cfgRes.json()
        cfgPools = Array.isArray(cfg?.pools) ? cfg.pools : []
      }
      const list = mergeTroPools(cfgPools)
      const live = await Promise.all(list.map(p => loadPoolLive(p, troPrice, num(egldPrice))))
      setPools(live)
    } catch (e) {
      setErr(asText(e, 'Chargement pools échoué'))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto pb-16">
      <header className="space-y-2">
        <p className="section-label">Liquidité</p>
        <h1 className="section-title display text-2xl">Pools & LP</h1>
        <p className="text-sm text-zinc-400">
          Toutes les pools $TRO listées (xExchange + OneDex). Rewards = fees DEX (+ farms si
          actives). Token TRO-94c925.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={() => void load()}>
            Actualiser pools
          </button>
          <a
            className="btn-primary text-sm"
            href={`${XEXCHANGE_APP}/trade?firstToken=TRO-94c925&secondToken=WEGLD-bd4d79`}
            target="_blank"
            rel="noreferrer"
          >
            $TRO / Buy
          </a>
          <Link to="/dao" className="btn-secondary text-sm">
            DAO
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">Prix TRO</p>
          <p className="font-bold tabular-nums">{fmtUsd(meta.troPrice, 6)}</p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">EGLD</p>
          <p className="font-bold tabular-nums">{fmtUsd(meta.egldPrice, 2)}</p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">Pools listées</p>
          <p className="font-bold">{pools.length}</p>
        </div>
      </div>

      {err && <p className="text-[12px] text-amber-200">{asText(err)}</p>}

      <div className="space-y-4">
        {pools.length === 0 && <p className="text-sm text-zinc-500">Chargement des pools…</p>}
        {pools.map(p => (
          <article
            key={asText(p.lpToken || p.pair)}
            className="card space-y-3 border border-white/10"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {asText(p.dex)}
                </p>
                <h2 className="text-lg font-bold text-white">{asText(p.pair)}</h2>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  {asText(p.dex)} · LP {asText(p.lpToken)}
                  {p.sharedRouter ? ' · router partagé' : ''}
                </p>
              </div>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-zinc-400">
                active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[12px]">
              <div>
                <p className="text-zinc-500">TVL EST.</p>
                <p className="font-semibold text-emerald-300 tabular-nums">{fmtUsd(p.tvlUsd)}</p>
              </div>
              <div>
                <p className="text-zinc-500">TRO in pool</p>
                <p className="font-semibold tabular-nums">{fmtAmt(p.troReserve)}</p>
              </div>
              <div>
                <p className="text-zinc-500">{asText(p.quoteSymbol)} in pool</p>
                <p className="font-semibold tabular-nums">{fmtAmt(p.quoteReserve)}</p>
              </div>
            </div>
            {p.note && <p className="text-[11px] text-zinc-500">{asText(p.note)}</p>}
            <div className="flex flex-wrap gap-2">
              <a
                className="btn-primary text-sm"
                href={p.add_liquidity_url || (p.dex === 'OneDex' ? ONEDEX_APP : `${XEXCHANGE_APP}/pools`)}
                target="_blank"
                rel="noreferrer"
              >
                Add liquidity ↗
              </a>
              {p.dexscreener && (
                <a className="btn-secondary text-sm" href={p.dexscreener} target="_blank" rel="noreferrer">
                  DexScreener
                </a>
              )}
              {p.swap_url && (
                <a className="btn-secondary text-sm" href={p.swap_url} target="_blank" rel="noreferrer">
                  Swap
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="text-[12px] text-zinc-500">
        Lien farms xExchange :{' '}
        <a href={`${XEXCHANGE_APP}/farms`} className="text-cyan-400 underline" target="_blank" rel="noreferrer">
          xexchange.com/farms
        </a>
        {' · '}
        <a href={ONEDEX_APP} className="text-cyan-400 underline" target="_blank" rel="noreferrer">
          OneDex
        </a>
        {' · DAO : '}
        <Link to="/dao" className="text-cyan-400 underline">
          /dao
        </Link>
      </p>

      <LiaVsUserBanner />

      <TokenTable
        title="Tes LP tokens"
        icon="💧"
        tokens={lpTokens || []}
        emptyText={loading ? 'Chargement…' : 'Aucun LP détecté dans le wallet connecté.'}
      />
      <TokenTable
        title="Farms"
        icon="🌾"
        tokens={farmTokens || []}
        emptyText={loading ? 'Chargement…' : 'Aucune position farm détectée.'}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-sm" onClick={() => void refresh()}>
          Refresh wallet
        </button>
        <a href={`${XEXCHANGE_APP}/pools`} className="btn-secondary text-sm" target="_blank" rel="noreferrer">
          xExchange pools
        </a>
        <a href={ONEDEX_APP} className="btn-secondary text-sm" target="_blank" rel="noreferrer">
          OneDex
        </a>
        {totalEsdtUsd != null && (
          <span className="text-[12px] text-zinc-500 self-center">
            ESDT wallet ~ {fmtUsd(totalEsdtUsd)}
          </span>
        )}
      </div>

      <p className="text-[11px] text-zinc-600">
        Wallet LIA (réf.) : {WALLET.slice(0, 12)}… — positions user = wallet connecté uniquement.
      </p>
    </div>
  )
}
