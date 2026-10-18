/**
 * Liquidity & Farms — TRO pools + wallet positions — protocol UI.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWalletTokens } from '../hooks/useWalletTokens'
import { getTroInfo, getEgldPrice } from '../services/priceService'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import { mergeTroPools, type TroPoolDef } from '../data/troPools'
import { asText } from '../lib/safeRender'
import { useI18n } from '../i18n/I18nContext'

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
  tokens,
  emptyText,
}: {
  title: string
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
    <div className="xa-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--xa-text)]">{title}</h2>
        {tokens.length > 0 && (
          <span className="text-xs font-medium text-[var(--xa-text-muted)]">{fmtUsd(total)}</span>
        )}
      </div>
      {tokens.length === 0 ? (
        <p className="text-center text-[var(--xa-text-muted)] py-6 text-sm">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-[var(--xa-text-muted)] uppercase border-b border-[var(--xa-border)]">
                <th className="text-left py-2 px-2">Token</th>
                <th className="text-right py-2 px-2">Balance</th>
                <th className="text-right py-2 px-2">Price</th>
                <th className="text-right py-2 px-2">USD</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(t => (
                <tr
                  key={asText(t.identifier)}
                  className="border-b border-[var(--xa-border)]/60 hover:bg-white/[0.02]"
                >
                  <td className="py-3 px-2">
                    <p className="font-semibold text-sm text-[var(--xa-text)]">
                      {asText(t.ticker || t.name)}
                    </p>
                    <p className="text-xs mono text-[var(--xa-text-muted)]">{asText(t.identifier)}</p>
                  </td>
                  <td className="py-3 px-2 text-right mono text-sm">{fmtAmt(t.balance, 6)}</td>
                  <td className="py-3 px-2 text-right mono text-sm">{fmtUsd(t.price, 6)}</td>
                  <td className="py-3 px-2 text-right mono text-sm text-emerald-400/90">
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
  const { t, lang } = useI18n()
  const { lpTokens, farmTokens, loading, refresh, totalEsdtUsd } = useWalletTokens()
  const [pools, setPools] = useState<PoolLive[]>([])
  const [meta, setMeta] = useState({ troPrice: 0, egldPrice: 0 })
  const [err, setErr] = useState<string | null>(null)
  const isFr = lang === 'fr'

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
      setErr(asText(e, isFr ? 'Chargement pools échoué' : 'Pool load failed'))
    }
  }, [isFr])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="xa-page animate-fade-in space-y-6 max-w-3xl mx-auto pb-16">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{isFr ? 'Liquidité' : 'Liquidity'}</p>
        <h1 className="xa-hero__title">Pools & LP</h1>
        <p className="xa-hero__lead">
          {isFr
            ? 'Pools $TRO (xExchange + OneDex). Rewards = fees DEX. Token TRO-94c925.'
            : '$TRO pools (xExchange + OneDex). Rewards = DEX fees. Token TRO-94c925.'}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button type="button" className="xa-btn-secondary text-sm" onClick={() => void load()}>
            {isFr ? 'Actualiser' : 'Refresh'}
          </button>
          <a
            className="xa-btn-primary text-sm"
            href={`${XEXCHANGE_APP}/trade?firstToken=TRO-94c925&secondToken=WEGLD-bd4d79`}
            target="_blank"
            rel="noreferrer"
          >
            $TRO / Buy
          </a>
          <Link to="/dao" className="xa-btn-secondary text-sm">
            DAO
          </Link>
        </div>
      </header>

      <div className="xa-stats-strip">
        <div className="xa-stat">
          <span className="xa-stat__value" style={{ fontSize: '1.25rem' }}>
            {fmtUsd(meta.troPrice, 6)}
          </span>
          <span className="xa-stat__label">TRO</span>
        </div>
        <div className="xa-stat">
          <span className="xa-stat__value" style={{ fontSize: '1.25rem' }}>
            {fmtUsd(meta.egldPrice, 2)}
          </span>
          <span className="xa-stat__label">EGLD</span>
        </div>
        <div className="xa-stat">
          <span className="xa-stat__value">{pools.length}</span>
          <span className="xa-stat__label">{isFr ? 'Pools' : 'Pools'}</span>
        </div>
      </div>

      {err && <p className="text-xs text-[var(--xa-accent)]">{asText(err)}</p>}

      <div className="space-y-4">
        {pools.length === 0 && (
          <p className="text-sm text-[var(--xa-text-muted)]">{t('common.loading')}</p>
        )}
        {pools.map(p => (
          <article key={asText(p.lpToken || p.pair)} className="xa-card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--xa-text-muted)]">
                  {asText(p.dex)}
                </p>
                <h2 className="text-lg font-bold text-[var(--xa-text)]">{asText(p.pair)}</h2>
                <p className="text-xs text-[var(--xa-text-muted)] mt-0.5">
                  LP {asText(p.lpToken)}
                  {p.sharedRouter ? (isFr ? ' · router partagé' : ' · shared router') : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-[var(--xa-text-muted)]">TVL</p>
                <p className="font-semibold text-emerald-300/90 tabular-nums">{fmtUsd(p.tvlUsd)}</p>
              </div>
              <div>
                <p className="text-[var(--xa-text-muted)]">TRO</p>
                <p className="font-semibold tabular-nums">{fmtAmt(p.troReserve)}</p>
              </div>
              <div>
                <p className="text-[var(--xa-text-muted)]">{asText(p.quoteSymbol)}</p>
                <p className="font-semibold tabular-nums">{fmtAmt(p.quoteReserve)}</p>
              </div>
            </div>
            {p.note && <p className="text-[11px] text-[var(--xa-text-muted)]">{asText(p.note)}</p>}
            <div className="flex flex-wrap gap-2">
              <a
                className="xa-btn-primary text-sm"
                href={p.add_liquidity_url || (p.dex === 'OneDex' ? ONEDEX_APP : `${XEXCHANGE_APP}/pools`)}
                target="_blank"
                rel="noreferrer"
              >
                Add liquidity ↗
              </a>
              {p.dexscreener && (
                <a className="xa-btn-secondary text-sm" href={p.dexscreener} target="_blank" rel="noreferrer">
                  DexScreener
                </a>
              )}
              {p.swap_url && (
                <a className="xa-btn-secondary text-sm" href={p.swap_url} target="_blank" rel="noreferrer">
                  Swap
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="xa-disclaimer">
        <a href={`${XEXCHANGE_APP}/farms`} className="underline" target="_blank" rel="noreferrer">
          xExchange farms
        </a>
        {' · '}
        <a href={ONEDEX_APP} className="underline" target="_blank" rel="noreferrer">
          OneDex
        </a>
        {' · '}
        <Link to="/dao" className="underline">
          DAO
        </Link>
      </p>

      <LiaVsUserBanner />

      <TokenTable
        title={isFr ? 'Tes LP tokens' : 'Your LP tokens'}
        tokens={lpTokens || []}
        emptyText={loading ? t('common.loading') : isFr ? 'Aucun LP détecté.' : 'No LP detected.'}
      />
      <TokenTable
        title="Farms"
        tokens={farmTokens || []}
        emptyText={loading ? t('common.loading') : isFr ? 'Aucune farm détectée.' : 'No farm position.'}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="xa-btn-secondary text-sm" onClick={() => void refresh()}>
          {isFr ? 'Refresh wallet' : 'Refresh wallet'}
        </button>
        {totalEsdtUsd != null && (
          <span className="text-xs text-[var(--xa-text-muted)] self-center">
            ESDT ~ {fmtUsd(totalEsdtUsd)}
          </span>
        )}
      </div>

      <p className="xa-disclaimer">
        LIA ref: {WALLET.slice(0, 12)}… — {isFr ? 'positions user = wallet connecté.' : 'user positions = connected wallet only.'}
      </p>
    </div>
  )
}
