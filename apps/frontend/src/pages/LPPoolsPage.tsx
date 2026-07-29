import { useEffect, useState } from 'react'
import { useWalletTokens } from '../hooks/useWalletTokens'
import { getTroInfo, getEgldPrice } from '../services/priceService'

const XEXCHANGE_APP = 'https://xexchange.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const MVX_API = 'https://api.multiversx.com'

interface PoolCfg {
  dex: string
  pair: string
  address: string
  dexscreener?: string
  swap_url?: string
}

function CategorySection({
  title,
  icon,
  tokens,
  emptyText,
}: {
  title: string
  icon: string
  tokens: Array<{ identifier: string; ticker: string; name: string; balance: number; price: number; valueUsd: number }>
  emptyText: string
}) {
  const total = tokens.reduce((s, t) => s + t.valueUsd, 0)
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          {icon} {title}
        </h2>
        {tokens.length > 0 && (
          <span className="badge-purple">${total.toFixed(2)} USD</span>
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
                <th className="text-right py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(t => (
                <tr key={t.identifier} className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-sm">{t.ticker || t.name}</p>
                    <p className="text-xs mono text-gray-500">{t.identifier}</p>
                  </td>
                  <td className="py-3 px-3 text-right mono text-sm">
                    {t.balance.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {t.price > 0 ? `$${t.price.toFixed(6)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-sm text-purple-400">
                    {t.valueUsd > 0 ? `$${t.valueUsd.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={`${XEXCHANGE_APP}/farms`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      xExchange
                    </a>
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
  const [pool, setPool] = useState<PoolCfg | null>(null)
  const [poolMeta, setPoolMeta] = useState<{ troPrice: number; egldPrice: number; poolEgld: number | null; poolTroHint: string }>({
    troPrice: 0,
    egldPrice: 0,
    poolEgld: null,
    poolTroHint: '',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cfg, tro, egld] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/config.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          getTroInfo(),
          getEgldPrice(),
        ])
        if (cancelled) return
        const p: PoolCfg | undefined = cfg?.pools?.[0]
        setPool(p ?? null)

        let poolEgld: number | null = null
        let poolTroHint = ''
        if (p?.address) {
          try {
            const acc = await fetch(`${MVX_API}/accounts/${p.address}`).then((r) => r.json())
            poolEgld = Number(acc.balance ?? 0) / 1e18
            const tokens = await fetch(`${MVX_API}/accounts/${p.address}/tokens?size=50`).then((r) => r.json())
            const troTok = Array.isArray(tokens)
              ? tokens.find((t: any) => (t.identifier || '').startsWith('TRO-'))
              : null
            if (troTok) {
              const dec = troTok.decimals ?? 18
              const bal = Number(troTok.balance ?? 0) / Math.pow(10, dec)
              poolTroHint = `${bal.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} TRO`
            }
          } catch {
            /* best-effort */
          }
        }
        setPoolMeta({
          troPrice: tro.price || 0,
          egldPrice: egld || 0,
          poolEgld,
          poolTroHint,
        })
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totalLp = lpTokens.reduce((s, t) => s + t.valueUsd, 0)
  const totalFarm = farmTokens.reduce((s, t) => s + t.valueUsd, 0)
  const totalDefi = totalLp + totalFarm
  const poolTvlUsd =
    poolMeta.poolEgld != null && poolMeta.egldPrice > 0
      ? poolMeta.poolEgld * poolMeta.egldPrice * 2
      : null

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">💧 Liquidity & Farms</h1>
          <p className="text-gray-500 mt-1">Pool $TRO + positions LP/Farm wallet LIA</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className="btn-secondary text-sm">🔄 Actualiser</button>
          <a href="/xArtists/tro" className="btn-primary text-sm">🎨 $TRO / Buy</a>
          <a href={`${XEXCHANGE_APP}/farms`} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            xExchange
          </a>
        </div>
      </div>

      {/* Official TRO pool from config — not only wallet LP tokens */}
      {pool && (
        <div className="card mb-6 border-purple-500/25 bg-purple-500/5">
          <h2 className="text-lg font-bold mb-3">📌 Pool {pool.pair} — {pool.dex}</h2>
          <p className="text-xs mono text-gray-500 mb-4 break-all">{pool.address}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl bg-[#111118] p-3">
              <p className="text-[10px] uppercase text-gray-500">Prix $TRO</p>
              <p className="font-bold text-purple-400">
                {poolMeta.troPrice > 0 ? `$${poolMeta.troPrice.toFixed(8)}` : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-[#111118] p-3">
              <p className="text-[10px] uppercase text-gray-500">EGLD in pool (approx)</p>
              <p className="font-bold">
                {poolMeta.poolEgld != null
                  ? poolMeta.poolEgld.toLocaleString('fr-FR', { maximumFractionDigits: 4 })
                  : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-[#111118] p-3">
              <p className="text-[10px] uppercase text-gray-500">TRO in pool (approx)</p>
              <p className="font-bold">{poolMeta.poolTroHint || '—'}</p>
            </div>
            <div className="rounded-xl bg-[#111118] p-3">
              <p className="text-[10px] uppercase text-gray-500">TVL est. (2× EGLD)</p>
              <p className="font-bold text-green-400">
                {poolTvlUsd != null ? `$${poolTvlUsd.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : '—'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Reserves lues via API MultiversX (balance compte pool). Pour le prix mid exact, utiliser DexScreener.
          </p>
          <div className="flex flex-wrap gap-2">
            {pool.dexscreener && (
              <a href={pool.dexscreener} target="_blank" rel="noreferrer" className="btn-primary text-xs">
                DexScreener
              </a>
            )}
            {pool.swap_url && (
              <a href={pool.swap_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                Add liquidity
              </a>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">LP Positions (wallet)</p>
              <p className="text-2xl font-black">{lpTokens.length}</p>
              <p className="text-sm text-gray-400 mt-1">${totalLp.toFixed(2)} USD</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Farm Positions</p>
              <p className="text-2xl font-black">{farmTokens.length}</p>
              <p className="text-sm text-gray-400 mt-1">${totalFarm.toFixed(2)} USD</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total DeFi wallet</p>
              <p className="text-2xl font-black text-purple-400">${totalDefi.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalEsdtUsd > 0 ? `${((totalDefi / totalEsdtUsd) * 100).toFixed(1)}% du portfolio` : ''}
              </p>
            </div>
          </div>

          <CategorySection
            title="LP Tokens (Liquidité du wallet LIA)"
            icon="💧"
            tokens={lpTokens}
            emptyText="Aucun LP token dans le wallet LIA — la pool OneDex ci-dessus peut quand même avoir de la liquidité externe."
          />

          <CategorySection
            title="Farm / Staking Tokens"
            icon="🌾"
            tokens={farmTokens}
            emptyText="Aucun farm token détecté dans le wallet de LIA"
          />

          <div className="card">
            <h2 className="text-lg font-bold mb-4">🔵 Liens DEX</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { href: `${XEXCHANGE_APP}/swap`, label: 'Swap', icon: '🔄' },
                { href: `${XEXCHANGE_APP}/pools`, label: 'Pools', icon: '💧' },
                { href: `${XEXCHANGE_APP}/farms`, label: 'Farms', icon: '🌾' },
                { href: `${XEXCHANGE_APP}/swap/USDC-c76f1f/TRO-94c925`, label: 'Buy $TRO', icon: '🎨' },
                { href: 'https://onedex.app', label: 'OneDex', icon: '🟠' },
                { href: `https://explorer.multiversx.com/accounts/${WALLET}`, label: 'Explorer Wallet', icon: '🔍' },
              ].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn-secondary text-sm text-center">
                  {l.icon} {l.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
