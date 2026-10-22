import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Staking - $TRO lock + yield farming pools TRO/EGLD (hors DAO).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import TokenIcon, { TokenPairIcons } from '../components/TokenIcon'
import { HELP } from '../content/helpCopy'
import { TRO_YIELD_POOLS, DEX_LABEL, TRO_TOKEN_ID } from '../config/troPools'
import { fetchMexTroPairs, fetchPoolAccountTvl, matchLive, type PoolLive } from '../lib/troPoolStats'
import { getEgldPrice } from '../services/priceService'
import TroStakePanel from '../components/TroStakePanel'
import TroLiquidityPanel from '../components/defi/TroLiquidityPanel'

const TABS = ['Yield', 'TRO', 'NFT', 'Rewards', 'Help'] as const

export default function StakingPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Yield')
  const [lives, setLives] = useState<PoolLive[]>([])
  const [onedexTvl, setOnedexTvl] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      try {
        const [mex, egld] = await Promise.all([fetchMexTroPairs(), getEgldPrice()])
        if (c) return
        setLives(mex)
        const od = TRO_YIELD_POOLS.find(p => p.dex === 'onedex')
        if (od?.address) {
          const tvl = await fetchPoolAccountTvl(od.address, egld || 0)
          if (!c) setOnedexTvl(tvl)
        }
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
          <TokenIcon token="TRO" size={28} />
          {xaRender("Staking & Yield ")}<InfoTip k="liaVsUser" />
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl flex flex-wrap items-center gap-2">
          {xaRender("Farming")}{xaRender(' ')}
          <span className="inline-flex items-center gap-1 text-zinc-200 font-medium">
            <TokenPairIcons a="TRO" b="EGLD" size={16} />
            {xaRender("TRO/EGLD ")}</span>{xaRender(' ')}
          {xaRender("sur DEX (xExchange, OneDex) + lock $TRO on-chain. Wallet")}{xaRender(' ')}
          <strong className="text-green-300">{xaRender("utilisateur")}</strong>{xaRender(". Pas de vote DAO ici. ")}</p>
      </header>

      <PageGuide page="staking" />
      <LiaVsUserBanner tone="user" />

      <div className="rounded-xl border border-zinc-600/40 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-300 flex flex-wrap items-center gap-2">
        <TokenIcon token="EGLD" size={16} />
        {xaRender("Yield LP = farms ")}<strong>{xaRender("DEX externes")}</strong>{xaRender(". Stake $TRO on-chain = onglet TRO. Aucun faux claim de rendement. ")}</div>

      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] w-fit flex-wrap">
        {xaRender(TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t ? 'bg-violet-600/30 text-violet-200' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {xaRender(t === 'TRO' && <TokenIcon token="TRO" size={14} />)}
            {xaRender(t === 'NFT' && <TokenIcon token="NFT" size={14} />)}
            {xaRender(t)}
          </button>
        )))}
      </div>

      {xaRender(tab === 'Yield' && (
        <div className="space-y-4">
          <TroLiquidityPanel />
          <div className="card space-y-2">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TokenPairIcons a="TRO" b="EGLD" size={20} />
              {xaRender("Farming TRO / EGLD ")}</h2>
            <p className="text-sm text-zinc-400">
              {xaRender("Fournissez de la liquidite sur les pools listees — rewards = fees DEX (+ farms si actives cote exchange). Token ")}{xaRender(TRO_TOKEN_ID)}.
            </p>
          </div>

          {xaRender(loading && <p className="text-sm text-zinc-500">{xaRender("Chargement TVL…")}</p>)}

          <div className="grid gap-3 sm:grid-cols-2">
            {xaRender(TRO_YIELD_POOLS.map(p => {
              const live = matchLive(p, lives)
              let tvl =
                live?.tvlUsd != null
                  ? live.tvlUsd
                  : p.dex === 'onedex'
                    ? onedexTvl
                    : null
              return (
                <article
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <TokenPairIcons a="TRO" b="EGLD" size={22} />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                          {xaRender(DEX_LABEL[p.dex])}
                        </p>
                        <h3 className="text-lg font-semibold text-white">{xaRender(p.pair)}</h3>
                      </div>
                    </div>
                    {xaRender(live?.state && (
                      <span className="text-[10px] rounded-full border border-white/10 px-2 py-0.5 text-zinc-400">
                        {xaRender(live.state)}
                      </span>
                    ))}
                  </div>
                  <p className="text-[12px] text-zinc-500">{xaRender(p.note)}</p>
                  <div className="flex flex-wrap gap-4 text-[13px]">
                    <div>
                      <p className="text-[10px] text-zinc-600 uppercase">{xaRender("TVL est.")}</p>
                      <p className="font-semibold text-emerald-400 tabular-nums">
                        {xaRender(tvl != null
                          ? `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                          : '—')}
                      </p>
                    </div>
                    {xaRender(live?.volume24h != null && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">{xaRender("Vol 24h")}</p>
                        <p className="tabular-nums text-zinc-300">${xaRender(live.volume24h.toFixed(2))}</p>
                      </div>
                    ))}
                    {xaRender(p.lpTokenId && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">LP</p>
                        <p className="text-[11px] mono text-zinc-400 flex items-center gap-1">
                          <TokenIcon token="LP" size={12} />
                          {xaRender(p.lpTokenId)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={p.swapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs"
                    >
                      {xaRender("Add liquidity ↗ ")}</a>
                    {xaRender(p.dexscreener && (
                      <a
                        href={p.dexscreener}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-xs"
                      >
                        {xaRender("DexScreener ")}</a>
                    ))}
                  </div>
                </article>
              )
            }))}
          </div>

          <p className="text-[11px] text-zinc-600">
            {xaRender("Lien farms xExchange :")}{xaRender(' ')}
            <a
              href="https://xexchange.com/farms"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400/90 hover:underline"
            >
              {xaRender("xexchange.com/farms ")}</a>
            {xaRender(' · ')}
            <Link
              to="/lp"
              className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
            >
              {xaRender("Liquidity & Farms ")}</Link>
            {xaRender(' · vote DAO : ')}
            <Link
              to="/dao"
              className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
            >
              {xaRender("/dao ")}</Link>
          </p>
        </div>
      ))}

      {xaRender(tab === 'TRO' && <TroStakePanel />)}

      {xaRender(tab === 'NFT' && (
        <div className="card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TokenIcon token="NFT" size={22} />
            {xaRender("NFT staking ")}</h2>
          <p className="text-sm text-zinc-400">
            {xaRender("Stake collections xArtists pour rewards / boost. Activation progressive. ")}</p>
          <Link to="/museum" className="btn-secondary text-sm inline-block">
            {xaRender("Voir la galerie → ")}</Link>
        </div>
      ))}

      {xaRender(tab === 'Rewards' && (
        <div className="card space-y-3">
          <h2 className="font-semibold">{xaRender("Rewards report")}</h2>
          <p className="text-sm text-zinc-400">
            {xaRender("Rapport de simulation disponible côté ops. Yield LP = claim sur le DEX. ")}</p>
        </div>
      ))}

      {xaRender(tab === 'Help' && (
        <div className="card text-sm text-zinc-400 space-y-2">
          <p>
            <strong className="text-zinc-200">{xaRender("Yield ≠ DAO :")}</strong> {xaRender(" farming LP sur DEX ; vote = holders + LP power sur /dao. ")}</p>
          <p>
            <strong className="text-zinc-200">{xaRender("Gas :")}</strong> {xaRender(" garder de l'EGLD. ")}</p>
          <p>
            <strong className="text-zinc-200">{xaRender("Risque :")}</strong> {xaRender(" IL + rewards non garantis. ")}</p>
          <p>
            <strong className="text-zinc-200">{xaRender("Wallet :")}</strong> {xaRender(HELP.liaVsUser.body)}
          </p>
        </div>
      ))}
    </div>
  )
}
