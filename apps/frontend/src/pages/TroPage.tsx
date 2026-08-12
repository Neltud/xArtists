import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTroInfo, getEgldPrice } from '../services/priceService'
import TreasurySplitViz from '../components/treasury/TreasurySplitViz'
import TroBurnFeed from '../components/treasury/TroBurnFeed'
import PageGuide from '../components/PageGuide'

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
]

export default function TroPage() {
  const [info, setInfo] = useState<TroInfo | null>(null)
  const [egld, setEgld] = useState(0)
  const [pools, setPools] = useState<PoolCfg[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [t, e] = await Promise.all([getTroInfo(), getEgldPrice()])
        if (!cancelled) {
          setInfo(t)
          setEgld(e)
        }
      } catch (ex) {
        if (!cancelled) setErr(ex instanceof Error ? ex.message : 'load failed')
      }
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}data/config.json?t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (r.ok) {
          const j = (await r.json()) as AppConfig
          if (!cancelled && j.pools) setPools(j.pools)
        }
      } catch {
        /* optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const priceEgld = info && egld > 0 && info.price > 0 ? info.price / egld : 0
  const circ = info?.circulatingSupply ?? 0
  const supplyPct = MAX_SUPPLY > 0 ? Math.min(100, (circ / MAX_SUPPLY) * 100) : 0

  return (
    <div className="animate-fade-in">
      <PageGuide page="tro" />

      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <TreasurySplitViz />
        <TroBurnFeed />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">
            <span className="gradient-text">$TRO</span>{' '}
            <span className="text-lg font-semibold text-gray-400">xArtists utility</span>
          </h1>
          <p className="text-gray-500 mt-1 mono text-sm">
            {TRO_ID} · Supply max{' '}
            <strong className="text-white">{MAX_SUPPLY.toLocaleString('fr-FR')}</strong> (hard cap produit)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BUY_LINKS.filter(l => l.primary).map(l => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn-primary text-sm">
              {l.icon} Buy $TRO
            </a>
          ))}
          <a href={EXPLORER} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            Explorer ↗
          </a>
          <Link to="/dao" className="btn-secondary text-sm">
            DAO
          </Link>
        </div>
      </div>

      {err && <p className="text-amber-400 text-sm mb-4">{err}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <p className="text-xs text-gray-500">Price USD</p>
          <p className="text-xl font-bold">{info ? `$${info.price.toFixed(6)}` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Price EGLD</p>
          <p className="text-xl font-bold">{priceEgld ? priceEgld.toFixed(8) : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Market cap</p>
          <p className="text-xl font-bold">{info ? `$${info.marketCap.toFixed(0)}` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Holders</p>
          <p className="text-xl font-bold">{info ? info.holders.toLocaleString() : '—'}</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Circulating vs cap 500 000</span>
          <span>{supplyPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500"
            style={{ width: `${supplyPct}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">
          Circulating on-chain (API) · cap = règle produit xArtists, pas un supply affiché à 1M.
        </p>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        $TRO = token utilitaire (rewards, DAO, RWA claim 1 TRO max physique) —{' '}
        <strong className="text-gray-400">pas une share de fonds</strong>. Tips ≠ investissement.{' '}
        <Link to="/dao" className="text-purple-300 underline">
          DAO / policy
        </Link>
        {' · '}
        <Link to="/tip" className="text-purple-300 underline">
          Tip
        </Link>
      </p>

      {pools.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-bold mb-2">Pools (config)</h2>
          <ul className="text-xs space-y-1">
            {pools.map(p => (
              <li key={p.address} className="flex flex-wrap gap-2">
                <span>{p.dex}</span>
                <span className="text-gray-500">{p.pair}</span>
                {p.swap_url && (
                  <a
                    href={p.swap_url}
                    className="text-purple-300 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    swap
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
