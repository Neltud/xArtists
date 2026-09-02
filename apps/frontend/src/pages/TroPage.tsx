import { useEffect, useState } from 'react'
import { fetchMirroredJson } from '../config/dataSources'
import { getTroInfo, getEgldPrice } from '../services/priceService'

const TRO_ID = 'TRO-94c925'
const EXPLORER = `https://explorer.multiversx.com/tokens/${TRO_ID}`

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
  tro_token?: string
  tro_name?: string
}

const BUY_LINKS = [
  {
    name: 'OneDex TRO/EGLD',
    url: 'https://onedex.app',
    icon: '🟠',
    primary: true,
  },
  {
    name: 'xExchange USDC→TRO',
    url: 'https://xexchange.com/swap/USDC-c76f1f/TRO-94c925',
    icon: '🔵',
    primary: true,
  },
  {
    name: 'JEXchange',
    url: 'https://app.jexchange.io',
    icon: '🟡',
    primary: false,
  },
  {
    name: 'AshSwap',
    url: 'https://ashswap.io',
    icon: '🔥',
    primary: false,
  },
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
          fetchMirroredJson<AppConfig>('config.json', { cache: 'no-store' }).catch(() => null),
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
          <p className="text-gray-500 mt-1 mono text-sm">{TRO_ID} · MultiversX Mainnet</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BUY_LINKS.filter((l) => l.primary).map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn-primary text-sm">
              {l.icon} Buy $TRO — {l.name.split(' ')[0]}
            </a>
          ))}
          <a href={EXPLORER} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            Explorer ↗
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                ${info?.marketCap ? info.marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Supply circ.</p>
              <p className="text-2xl font-black">
                {info?.circulatingSupply
                  ? info.circulatingSupply.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                  : '—'}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Holders</p>
              <p className="text-2xl font-black">{info?.holders ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">{info?.transactions ?? 0} txs</p>
            </div>
          </div>

          {/* Buy panel */}
          <div className="card mb-6 border-purple-500/30 bg-purple-500/5">
            <h2 className="text-lg font-bold mb-2">🛒 Acheter $TRO</h2>
            <p className="text-sm text-gray-400 mb-4">
              Swap via DEX MultiversX. Paiement possible en EGLD, USDC, WEGLD selon la pool.
            </p>
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

          {/* Pool */}
          {pool && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">💧 Liquidity Pool — {pool.pair}</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">DEX</p>
                  <p className="font-semibold">{pool.dex}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Adresse pool</p>
                  <p className="mono text-xs break-all text-gray-300">{pool.address}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {pool.dexscreener && (
                  <a href={pool.dexscreener} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                    DexScreener ↗
                  </a>
                )}
                {pool.swap_url && (
                  <a href={pool.swap_url} target="_blank" rel="noreferrer" className="btn-primary text-xs">
                    Swap / Add LP ↗
                  </a>
                )}
                <a
                  href={`https://explorer.multiversx.com/accounts/${pool.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs"
                >
                  Explorer pool ↗
                </a>
              </div>
            </div>
          )}

          {/* Tokenomics / burn design */}
          <div className="card mb-6">
            <h2 className="text-lg font-bold mb-4">🔥 Tokenomics marketplace (design)</h2>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <span className="text-white font-medium">Burn $TRO à la vente NFT</span> — prévu on-chain à chaque{' '}
                <code className="text-purple-300">buyNft</code> (pas encore déployé sur le SC marketplace actuel).
              </li>
              <li>
                <span className="text-white font-medium">Escrow phygital</span> — si le NFT est locké en escrow, list/buy{' '}
                <span className="text-orange-400">bloqué</span> jusqu’à unlock.
              </li>
              <li>
                <span className="text-white font-medium">Multi-currency</span> — cible : EGLD, USDC, WEGLD, $TRO (UI achete via DEX en attendant).
              </li>
              {cfg?.commissions && (
                <li className="pt-2 border-t border-[#2a2a3a]">
                  Fees config (doc) : seller {cfg.commissions.marketplace_seller_fee_pct}% · buyer{' '}
                  {cfg.commissions.marketplace_buyer_fee_pct}% · royalty secondaire{' '}
                  {cfg.commissions.secondary_royalty_pct}% · escrow RWA {cfg.commissions.rwa_escrow_fee_pct}%
                </li>
              )}
            </ul>
            <p className="text-xs text-gray-600 mt-3">
              Détail des lacunes : <span className="mono">docs/LACUNES_PRODUIT.md</span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
