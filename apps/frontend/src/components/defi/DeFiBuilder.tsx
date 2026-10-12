/**
 * DeFi Builder — staking $TRO / NFT + récompenses.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TroStakePanel from '../TroStakePanel'
import AgentNftStakePanel from '../AgentNftStakePanel'
import { useTroStakedBalance } from '../../hooks/useTroStakedBalance'
import { canStakeTro, canStakeNft } from '../../config/scStatus'
import { isPitchMode, PITCH_DEMO } from '../../lib/pitchMode'
import { useI18n } from '../../i18n/I18nContext'

export default function DeFiBuilder() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'tro' | 'nft' | 'rewards'>('tro')
  const { userTro, totalTro, loading } = useTroStakedBalance()
  const pitch = isPitchMode()

  const estRewards = useMemo(() => {
    const staked = userTro ?? 0
    const apr = pitch ? 0.12 : 0.08
    const daily = (staked * apr) / 365
    return { apr, daily, yearly: staked * apr }
  }, [userTro, pitch])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-purple-500/30 bg-black/85 backdrop-blur-md p-4 shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/90">{t('defi.builder.kicker')}</p>
        <h2 className="text-lg font-bold text-white">{t('defi.builder.title')}</h2>
        <p className="text-[12px] text-zinc-400 mt-1">{t('defi.builder.lead')}</p>
        <p className="text-[11px] text-zinc-500 mt-2">{t('defi.troUtility')}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
            <p className="text-zinc-500">{t('defi.yourStake')}</p>
            <p className="font-semibold text-white tabular-nums">
              {loading ? '…' : (userTro ?? 0).toFixed(2)} TRO
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
            <p className="text-zinc-500">{t('defi.pool')}</p>
            <p className="font-semibold text-white tabular-nums">
              {pitch ? PITCH_DEMO.tvlUsd.toLocaleString() + ' $' : (totalTro ?? 0).toFixed(0) + ' TRO'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
            <p className="text-zinc-500">{t('defi.estDay')}</p>
            <p className="font-semibold text-emerald-200 tabular-nums">{estRewards.daily.toFixed(4)}</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">
          SC $TRO {canStakeTro() ? 'LIVE' : 'gate'} · NFT {canStakeNft() ? 'LIVE' : 'gate'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['tro', t('defi.tab.tro')],
            ['nft', t('defi.tab.nft')],
            ['rewards', t('defi.tab.rewards')],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[44px] rounded-xl border px-4 py-2 text-xs font-semibold ${
              tab === id
                ? 'border-purple-400/50 bg-purple-950/40 text-purple-100'
                : 'border-white/12 bg-white/5 text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'tro' ? <TroStakePanel /> : null}
      {tab === 'nft' ? <AgentNftStakePanel /> : null}
      {tab === 'rewards' ? (
        <div className="rounded-2xl border border-purple-500/25 bg-black/80 backdrop-blur-md p-4 space-y-3 shadow-xl">
          <p className="text-sm text-zinc-300">{t('defi.rewards.hint')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-sm min-h-[44px] opacity-60 cursor-not-allowed"
              disabled
              title="Endpoint claim non exposé"
            >
              {t('defi.claim')}
            </button>
            <Link to="/staking" className="btn-secondary text-sm min-h-[44px] inline-flex items-center">
              {t('defi.manageUnstake')}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
