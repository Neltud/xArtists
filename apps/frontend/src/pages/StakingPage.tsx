/**
 * Staking — $TRO lock design + yield farming pools TRO/EGLD (hors DAO).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import { HELP } from '../content/helpCopy'
import { TRO_YIELD_POOLS, DEX_LABEL, TRO_TOKEN_ID } from '../config/troPools'
import { fetchMexTroPairs, fetchPoolAccountTvl, matchLive, type PoolLive } from '../lib/troPoolStats'
import { getEgldPrice } from '../services/priceService'

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
          Staking &amp; Yield
          <InfoTip k="liaVsUser" />
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Farming <strong className="text-zinc-200">TRO/EGLD</strong> sur DEX (xExchange, OneDex) +
          design lock $TRO. Wallet <strong className="text-green-300">utilisateur</strong>. Pas de
          vote DAO ici.
        </p>
      </header>

      <PageGuide page="staking" />
      <LiaVsUserBanner tone="user" />

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90">
        Yield = liquidité / farms <strong>DEX externes</strong>. Stake SC xArtists désactivé tant que
        codeHash non vérifié. Aucun faux claim on-chain.
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-violet-600/30 text-violet-200' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Yield' && (
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-semibold text-white">Farming TRO / EGLD</h2>
            <p className="text-sm text-zinc-400">
              Fournissez de la liquidité sur les pools listées — rewards = fees DEX (+ farms si
              activés côté exchange). Token {TRO_TOKEN_ID}.
            </p>
          </div>

          {loading && <p className="text-sm text-zinc-500">Chargement TVL…</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {TRO_YIELD_POOLS.map(p => {
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
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {DEX_LABEL[p.dex]}
                      </p>
                      <h3 className="text-lg font-semibold text-white">{p.pair}</h3>
                    </div>
                    {live?.state && (
                      <span className="text-[10px] rounded-full border border-white/10 px-2 py-0.5 text-zinc-400">
                        {live.state}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-zinc-500">{p.note}</p>
                  <div className="flex flex-wrap gap-4 text-[13px]">
                    <div>
                      <p className="text-[10px] text-zinc-600 uppercase">TVL est.</p>
                      <p className="font-semibold text-emerald-400 tabular-nums">
                        {tvl != null ? `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
                      </p>
                    </div>
                    {live?.volume24h != null && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">Vol 24h</p>
                        <p className="tabular-nums text-zinc-300">${live.volume24h.toFixed(2)}</p>
                      </div>
                    )}
                    {p.lpTokenId && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">LP</p>
                        <p className="text-[11px] mono text-zinc-400">{p.lpTokenId}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={p.swapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs"
                    >
                      Add liquidity ↗
                    </a>
                    {p.dexscreener && (
                      <a
                        href={p.dexscreener}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-xs"
                      >
                        DexScreener
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <p className="text-[11px] text-zinc-600">
            Lien farms xExchange :{' '}
            <a
              href="https://xexchange.com/farms"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400/90 hover:underline"
            >
              xexchange.com/farms
            </a>
            {' · '}
            <Link to="/lp" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
              Liquidity &amp; Farms
            </Link>
            {' · vote DAO : '}
            <Link to="/dao" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
              /dao
            </Link>
          </p>
        </div>
      )}

      {tab === 'TRO' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">$TRO staking (design SC)</h2>
          <ul className="text-sm text-zinc-400 space-y-2">
            <li>
              <strong className="text-zinc-200">Flexible</strong> — unstake anytime
            </li>
            <li>
              <strong className="text-zinc-200">Bonded 30 / 90 j</strong> — APR policy
            </li>
            <li>
              <strong className="text-zinc-200">Vote-locked</strong> — pouvoir DAO (séparé du yield LP)
            </li>
          </ul>
          <button type="button" disabled className="btn-secondary text-sm opacity-50 cursor-not-allowed">
            Stake $TRO — SC bientôt
          </button>
        </div>
      )}

      {tab === 'NFT' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">NFT staking</h2>
          <p className="text-sm text-zinc-400">
            Stake collections xArtists pour rewards / boost. Activation post-deploy SC.
          </p>
          <Link to="/museum" className="btn-secondary text-sm inline-block">
            Voir la galerie →
          </Link>
        </div>
      )}

      {tab === 'Rewards' && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Rewards report</h2>
          <p className="text-sm text-zinc-400">
            Rapport paper Vellum → <code className="text-[10px]">data/rewards_report.json</code> quand le
            workflow tourne. Yield LP = claim sur le DEX.
          </p>
        </div>
      )}

      {tab === 'Help' && (
        <div className="card text-sm text-zinc-400 space-y-2">
          <p>
            <strong className="text-zinc-200">Yield ≠ DAO :</strong> farming LP sur DEX ; vote = holders
            + LP power sur /dao.
          </p>
          <p>
            <strong className="text-zinc-200">Gas :</strong> garder de l’EGLD.
          </p>
          <p>
            <strong className="text-zinc-200">Risque :</strong> IL + rewards non garantis.
          </p>
          <p>
            <strong className="text-zinc-200">Wallet :</strong> {HELP.liaVsUser.body}
          </p>
        </div>
      )}
    </div>
  )
}
