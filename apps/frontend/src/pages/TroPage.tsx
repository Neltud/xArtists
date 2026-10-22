import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * $TRO tokenomics — cap 500k, burns, flows, pools, utilitaire (pas share).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTroInfo, getEgldPrice } from '../services/priceService'
import TreasurySplitViz from '../components/treasury/TreasurySplitViz'
import TroBurnFeed from '../components/treasury/TroBurnFeed'
import PageGuide from '../components/PageGuide'
import {
  BURN_POLICY,
  TREASURY_FLOW_MATRIX,
  type RevenueSource,
} from '../config/treasuryFlows'

const TRO_ID = 'TRO-94c925'
const EXPLORER = `https://explorer.multiversx.com/tokens/${TRO_ID}`
const MAX_SUPPLY = BURN_POLICY.maxSupply // 500_000

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
}

const BUY_LINKS = [
  { name: 'OneDex TRO/EGLD', url: 'https://onedex.app', icon: '🟠' },
  {
    name: 'xExchange USDC→TRO',
    url: 'https://xexchange.com/swap/USDC-c76f1f/TRO-94c925',
    icon: '🔵',
  },
]

const UTILITY = [
  { t: 'DAO vote', d: 'Power = LP TRO éligibles + ArtPass staked (paper jusqu’à SC)' },
  { t: 'Rewards holders', d: 'Part des flux packs / ads / venue / slot (matrice trésorerie)' },
  { t: 'RWA / physique', d: 'Max 1 TRO reward créateur par œuvre réelle vendue' },
  { t: 'Burn', d: 'Direct ESDT burn préféré · LP burn seulement via DAO' },
  { t: 'Pas une share', d: 'Aucun droit sur trésorerie LIA · tips ≠ investissement' },
]

const FLOW_LABELS: Record<string, string> = {
  pack_paper: 'Packs',
  ads_bid: 'Ads / enchères',
  venue_rental: 'Location salles',
  marketplace_sale: 'Marketplace',
  slot_casino: 'Slot (rake)',
  tip: 'Tips',
}

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
  const sources = Object.keys(TREASURY_FLOW_MATRIX) as RevenueSource[]

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6 pb-16">
      <PageGuide page="tro" />

      <header className="space-y-2">
        <p className="section-label">{xaRender("Token · utilitaire")}</p>
        <h1 className="section-title display">{xaRender("$TRO tokenomics")}</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          {xaRender("Cap produit ")}<strong className="text-white">{xaRender(MAX_SUPPLY.toLocaleString('fr-FR'))}</strong> {xaRender(" · burns · flux trésorerie · pools. Pas une security / share de fonds. ")}</p>
        <a
          href={EXPLORER}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-cyan-400 hover:underline"
        >
          {xaRender(TRO_ID)} {xaRender(" · Explorer ↗ ")}</a>
      </header>

      {xaRender(err && <p className="text-sm text-rose-400">{xaRender(err)}</p>)}

      <div className="grid md:grid-cols-2 gap-4">
        <TreasurySplitViz />
        <TroBurnFeed />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="card">
          <p className="text-[10px] text-zinc-500">{xaRender("Prix USD")}</p>
          <p className="text-lg font-semibold text-white">
            {xaRender(info ? `$${info.price.toFixed(6)}` : '—')}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] text-zinc-500">{xaRender("Prix EGLD")}</p>
          <p className="text-lg font-semibold text-white">
            {xaRender(priceEgld ? priceEgld.toFixed(8) : '—')}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] text-zinc-500">{xaRender("Market cap")}</p>
          <p className="text-lg font-semibold text-white">
            {xaRender(info ? `$${info.marketCap.toFixed(0)}` : '—')}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] text-zinc-500">{xaRender("Holders")}</p>
          <p className="text-lg font-semibold text-white">
            {xaRender(info ? info.holders.toLocaleString() : '—')}
          </p>
        </div>
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between text-[11px] text-zinc-500">
          <span>{xaRender("Circulating vs cap ")}{xaRender(MAX_SUPPLY.toLocaleString('fr-FR'))}</span>
          <span>{xaRender(supplyPct.toFixed(1))}%</span>
        </div>
        <div className="h-2 rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
            style={{ width: `${supplyPct}%` }}
          />
        </div>
        <p className="text-[11px] text-zinc-600">
          {xaRender("Circulating API MultiversX · cap = règle produit (jamais 1M affiché comme max). ")}</p>
      </div>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">{xaRender("Utilité $TRO")}</h2>
        <ul className="space-y-2">
          {xaRender(UTILITY.map(u => (
            <li key={u.t} className="text-[13px]">
              <span className="text-violet-300 font-medium">{xaRender(u.t)}</span>
              <span className="text-zinc-500"> — {xaRender(u.d)}</span>
            </li>
          )))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">{xaRender("Matrice de flux (cible %)")}</h2>
        <p className="text-[11px] text-zinc-500">
          {xaRender("Paper-first · SC après audit. LP burn auto désactivé (")}{xaRender(String(BURN_POLICY.lpBurn.enabled))}).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead>
              <tr className="text-zinc-500 border-b border-white/10">
                <th className="py-1 pr-2">{xaRender("Source")}</th>
                <th className="py-1 pr-2">{xaRender("LIA")}</th>
                <th className="py-1 pr-2">{xaRender("Holders")}</th>
                <th className="py-1 pr-2">{xaRender("Assos")}</th>
                <th className="py-1 pr-2">{xaRender("Autre")}</th>
              </tr>
            </thead>
            <tbody>
              {xaRender(sources
                .filter(s => s !== 'lp_fees_external')
                .map(s => {
                  const m = TREASURY_FLOW_MATRIX[s] || {}
                  return (
                    <tr key={s} className="border-b border-white/5 text-zinc-300">
                      <td className="py-1.5 pr-2">{xaRender(FLOW_LABELS[s] || s)}</td>
                      <td className="pr-2">{xaRender(m.lia_treasury ?? '—')}</td>
                      <td className="pr-2">{xaRender(m.holders_rewards ?? '—')}</td>
                      <td className="pr-2">{xaRender(m.associations ?? '—')}</td>
                      <td className="pr-2 text-zinc-500">
                        {xaRender(m.institution
                          ? `inst ${m.institution}`
                          : m.creator_royalty
                            ? `créateur ${m.creator_royalty}`
                            : m.burn_tro
                              ? `burn ${m.burn_tro}`
                              : m.protocol_fee
                                ? `protocol ${m.protocol_fee}`
                                : '—')}
                      </td>
                    </tr>
                  )
                }))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold text-white">{xaRender("Acheter $TRO")}</h2>
        <div className="flex flex-wrap gap-2">
          {xaRender(BUY_LINKS.map(b => (
            <a
              key={b.name}
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-[12px]"
            >
              {xaRender(b.icon)} {xaRender(b.name)}
            </a>
          )))}
        </div>
      </section>

      {xaRender(pools.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold mb-2">{xaRender("Pools (config)")}</h2>
          <ul className="text-xs space-y-1">
            {xaRender(pools.map(p => (
              <li key={p.address} className="flex flex-wrap gap-2">
                <span>{xaRender(p.dex)}</span>
                <span className="text-zinc-500">{xaRender(p.pair)}</span>
                {xaRender(p.swap_url && (
                  <a href={p.swap_url} className="text-cyan-400 underline" target="_blank" rel="noreferrer">
                    {xaRender("swap ")}</a>
                ))}
              </li>
            )))}
          </ul>
        </div>
      ))}

      <p className="text-[12px] text-zinc-600">
        <Link to="/dao" className="text-violet-300 hover:underline">
          {xaRender("DAO ")}</Link>
        {xaRender(' · ')}
        <Link to="/burnify" className="text-violet-300 hover:underline">
          {xaRender("Burnify ")}</Link>
        {xaRender(' · ')}
        <Link to="/lia" className="text-violet-300 hover:underline">
          {xaRender("Trésorerie LIA ")}</Link>
        {xaRender(' · ')}
        <Link to="/go-live" className="text-violet-300 hover:underline">
          {xaRender("GO_LIVE ")}</Link>
      </p>
    </div>
  )
}
