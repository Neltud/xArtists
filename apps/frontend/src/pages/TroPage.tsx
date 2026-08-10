import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTroInfo, getEgldPrice } from '../services/priceService'

const TRO_ID = 'TRO-94c925'
const EXPLORER = `https://explorer.multiversx.com/tokens/${TRO_ID}`
/** Product hard cap — never display 1_000_000 as max */
const MAX_SUPPLY = 500_000

interface TroInfo {
  price: number
  marketCap: number
  circulatingSupply: number
  totalSupply: number
  name: string
  holders: number
  transactions: number
}

interface PoolCfg {
  dex: string
  pair: string
  address: string
  dexscreener?: string
  swap_url?: string
}

interface AppConfig {
  pools?: PoolCfg[]
  commissions?: Record<string, number>
}

const BUY_LINKS = [
  { name: 'OneDex TRO/EGLD', url: 'https://onedex.app', icon: '🟠', primary: true },
  {
    name: 'xExchange USDC→TRO',
    url: 'https://xexchange.com/swap/USDC-c76f1f/TRO-94c925',
    icon: '🔵',
    primary: true,
  },
  { name: 'JEXchange', url: 'https://app.jexchange.io', icon: '🟡', primary: false },
  { name: 'AshSwap', url: 'https://ashswap.io', icon: '🔥', primary: false },
]

export default function TroPage() {
  const [info, setInfo] = useState<TroInfo | null>(null)
  const [egld, setEgld] = useState(0)
  const [cfg, setCfg] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [tro, egldP, cfgRes] = await Promise.all([
          getTroInfo(),
          getEgldPrice(),
          fetch(`${import.meta.env.BASE_URL}data/config.json`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ])
        if (cancelled) return
        setInfo(tro)
        setEgld(egldP)
        setCfg(cfgRes)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pool = cfg?.pools?.[0]
  const priceEgld = info && egld > 0 && info.price > 0 ? info.price / egld : 0

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">
            <span className="gradient-text">$TRO</span>{' '}
            <span className="text-lg font-semibold text-gray-400">TUDURIORIGINAL</span>
          </h1>
          <p className="text-gray-500 mt-1 mono text-sm">
            {TRO_ID} · Supply max <strong className="text-white">{MAX_SUPPLY.toLocaleString('fr-FR')}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BUY_LINKS.filter((l) => l.primary).map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn-primary text-sm">
              {l.icon} Buy $TRO
            </a>
          ))}
          <a href={EXPLORER} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            Explorer ↗
          </a>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
        <strong>Plafond produit :</strong> 500 000 TRO maximum. Toute mention 1 000 000 est obsolète.
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-busy="true">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Prix USD</p>
              <p className="text-2xl font-black text-purple-400">
                ${info?.price ? info.price.toFixed(8) : '—'}
              </p>
              {priceEgld > 0 && (
                <p className="text-xs text-gray-500 mt-1 mono">{priceEgld.toFixed(8)} EGLD</p>
              )}
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Market Cap</p>
              <p className="text-2xl font-black">
                ${
                  info?.marketCap
                    ? info.marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : '—'
                }
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Supply circ.</p>
              <p className="text-2xl font-black">
                {info?.circulatingSupply
                  ? info.circulatingSupply.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Max {MAX_SUPPLY.toLocaleString('fr-FR')}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Holders</p>
              <p className="text-2xl font-black">{info?.holders ?? '—'}</p>
            </div>
          </div>

          <div className="card mb-6 border-purple-500/30 bg-purple-500/5">
            <h2 className="text-lg font-bold mb-2">Acheter $TRO</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BUY_LINKS.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className={l.primary ? 'btn-primary text-center text-sm' : 'btn-secondary text-center text-sm'}
                >
                  {l.icon} {l.name}
                </a>
              ))}
            </div>
          </div>

          {pool && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">Liquidity — {pool.pair}</h2>
              <p className="mono text-xs break-all text-gray-300">{pool.address}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {pool.dexscreener && (
                  <a href={pool.dexscreener} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                    DexScreener ↗
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-orange-500/25 bg-orange-950/20 p-4 mb-6">
            <h2 className="font-semibold text-orange-100 mb-1">🔥 Burnify · déflation $TRO</h2>
            <p className="text-sm text-zinc-400 mb-3">
              SC xArtists dédié : brûle $TRO et peut redistribuer de l'EGLD (pool LIA). Pre-mainnet
              jusqu'au deploy + codeHash.
            </p>
            <Link
              to="/burnify"
              className="inline-flex rounded-lg bg-orange-600/90 hover:bg-orange-500 px-4 py-2 text-sm font-medium text-white"
            >
              Ouvrir Burnify →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
