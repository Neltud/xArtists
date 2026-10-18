/**
 * Staking — $TRO lock + yield pools TRO/EGLD — protocol UI.
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
import { useI18n } from '../i18n/I18nContext'

const TABS = ['Yield', 'TRO', 'NFT', 'Rewards', 'Help'] as const

export default function StakingPage() {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Yield')
  const [lives, setLives] = useState<PoolLive[]>([])
  const [onedexTvl, setOnedexTvl] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const isFr = lang === 'fr'

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
    <div className="xa-page animate-fade-in space-y-8 pb-16">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('staking.title')}</p>
        <h1 className="xa-hero__title flex flex-wrap items-center gap-2">
          <TokenIcon token="TRO" size={28} />
          Staking & Yield
          <InfoTip k="liaVsUser" />
        </h1>
        <p className="xa-hero__lead">
          {isFr ? (
            <>
              Farming{' '}
              <span className="inline-flex items-center gap-1 font-medium text-[var(--xa-text)]">
                <TokenPairIcons a="TRO" b="EGLD" size={16} />
                TRO/EGLD
              </span>{' '}
              sur DEX + lock $TRO. Wallet <strong>utilisateur</strong>. Pas de vote DAO ici.
            </>
          ) : (
            <>
              Farming{' '}
              <span className="inline-flex items-center gap-1 font-medium text-[var(--xa-text)]">
                <TokenPairIcons a="TRO" b="EGLD" size={16} />
                TRO/EGLD
              </span>{' '}
              on DEX + $TRO lock. <strong>User</strong> wallet. No DAO vote here.
            </>
          )}
        </p>
      </header>

      <PageGuide page="staking" />
      <LiaVsUserBanner tone="user" />

      <div className="xa-card text-xs text-[var(--xa-text-secondary)] flex flex-wrap items-center gap-2">
        <TokenIcon token="EGLD" size={16} />
        {isFr
          ? 'Yield LP = farms DEX externes. Stake $TRO = onglet TRO. Aucun faux claim de rendement.'
          : 'LP yield = external DEX farms. $TRO stake = TRO tab. No fake yield claims.'}
      </div>

      <div
        className="flex gap-1 p-1 rounded-xl w-fit flex-wrap"
        style={{ background: 'var(--xa-surface)', border: '1px solid var(--xa-border)' }}
      >
        {TABS.map(tb => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === tb
                ? 'bg-white/10 text-[var(--xa-text)]'
                : 'text-[var(--xa-text-muted)] hover:text-[var(--xa-text)]'
            }`}
          >
            {tb === 'TRO' && <TokenIcon token="TRO" size={14} />}
            {tb === 'NFT' && <TokenIcon token="NFT" size={14} />}
            {tb}
          </button>
        ))}
      </div>

      {tab === 'Yield' && (
        <div className="space-y-4">
          <TroLiquidityPanel />
          <div className="xa-card space-y-2">
            <h2 className="font-semibold text-[var(--xa-text)] flex items-center gap-2">
              <TokenPairIcons a="TRO" b="EGLD" size={20} />
              Farming TRO / EGLD
            </h2>
            <p className="text-sm text-[var(--xa-text-secondary)]">
              {isFr
                ? `Liquidité sur les pools listées — rewards = fees DEX (+ farms exchange). Token ${TRO_TOKEN_ID}.`
                : `Provide liquidity on listed pools — rewards = DEX fees (+ exchange farms). Token ${TRO_TOKEN_ID}.`}
            </p>
          </div>

          {loading && (
            <p className="text-sm text-[var(--xa-text-muted)]">{t('common.loading')}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {TRO_YIELD_POOLS.map(p => {
              const live = matchLive(p, lives)
              const tvl =
                live?.tvlUsd != null
                  ? live.tvlUsd
                  : p.dex === 'onedex'
                    ? onedexTvl
                    : null
              return (
                <article key={p.id} className="xa-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <TokenPairIcons a="TRO" b="EGLD" size={22} />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--xa-text-muted)]">
                          {DEX_LABEL[p.dex]}
                        </p>
                        <h3 className="text-lg font-semibold text-[var(--xa-text)]">{p.pair}</h3>
                      </div>
                    </div>
                    {live?.state && (
                      <span className="text-[10px] rounded-full border border-[var(--xa-border)] px-2 py-0.5 text-[var(--xa-text-muted)]">
                        {live.state}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--xa-text-muted)]">{p.note}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <p className="text-[10px] text-[var(--xa-text-muted)] uppercase">TVL</p>
                      <p className="font-semibold text-emerald-400/90 tabular-nums">
                        {tvl != null
                          ? `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                          : '—'}
                      </p>
                    </div>
                    {live?.volume24h != null && (
                      <div>
                        <p className="text-[10px] text-[var(--xa-text-muted)] uppercase">Vol 24h</p>
                        <p className="tabular-nums text-[var(--xa-text-secondary)]">
                          ${live.volume24h.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {p.lpTokenId && (
                      <div>
                        <p className="text-[10px] text-[var(--xa-text-muted)] uppercase">LP</p>
                        <p className="text-[11px] mono text-[var(--xa-text-muted)] flex items-center gap-1">
                          <TokenIcon token="LP" size={12} />
                          {p.lpTokenId}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a href={p.swapUrl} target="_blank" rel="noreferrer" className="xa-btn-primary text-xs">
                      Add liquidity ↗
                    </a>
                    {p.dexscreener && (
                      <a
                        href={p.dexscreener}
                        target="_blank"
                        rel="noreferrer"
                        className="xa-btn-secondary text-xs"
                      >
                        DexScreener
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <p className="xa-disclaimer">
            <a
              href="https://xexchange.com/farms"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[var(--xa-text)]"
            >
              xexchange.com/farms
            </a>
            {' · '}
            <Link to="/lp" className="underline hover:text-[var(--xa-text)]">
              LP
            </Link>
            {' · '}
            <Link to="/dao" className="underline hover:text-[var(--xa-text)]">
              DAO
            </Link>
          </p>
        </div>
      )}

      {tab === 'TRO' && <TroStakePanel />}

      {tab === 'NFT' && (
        <div className="xa-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-[var(--xa-text)]">
            <TokenIcon token="NFT" size={22} />
            NFT staking
          </h2>
          <p className="text-sm text-[var(--xa-text-secondary)]">
            {isFr
              ? 'Stake collections xArtists pour rewards / boost. Activation progressive.'
              : 'Stake xArtists collections for rewards / boost. Progressive rollout.'}
          </p>
          <Link to="/museum" className="xa-btn-secondary inline-flex text-sm">
            {t('nav.museum')} →
          </Link>
        </div>
      )}

      {tab === 'Rewards' && (
        <div className="xa-card space-y-3">
          <h2 className="font-semibold text-[var(--xa-text)]">Rewards</h2>
          <p className="text-sm text-[var(--xa-text-secondary)]">
            {isFr
              ? 'Rapport ops. Yield LP = claim sur le DEX.'
              : 'Ops report. LP yield = claim on the DEX.'}
          </p>
        </div>
      )}

      {tab === 'Help' && (
        <div className="xa-card text-sm text-[var(--xa-text-secondary)] space-y-2">
          <p>
            <strong className="text-[var(--xa-text)]">Yield ≠ DAO :</strong>{' '}
            {isFr ? 'farming LP sur DEX ; vote = /dao.' : 'LP farming on DEX; vote = /dao.'}
          </p>
          <p>
            <strong className="text-[var(--xa-text)]">Gas :</strong>{' '}
            {isFr ? 'garder de l’EGLD.' : 'keep some EGLD.'}
          </p>
          <p>
            <strong className="text-[var(--xa-text)]">Risk :</strong> IL + non-guaranteed rewards.
          </p>
          <p>
            <strong className="text-[var(--xa-text)]">Wallet :</strong> {HELP.liaVsUser.body}
          </p>
        </div>
      )}
    </div>
  )
}
