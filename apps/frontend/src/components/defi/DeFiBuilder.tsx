/**
 * DeFi Builder — staking $TRO / NFT + claim rewards UI.
 * Branche les panels existants ; pas de badge partenaire tiers.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TroStakePanel from '../TroStakePanel'
import AgentNftStakePanel from '../AgentNftStakePanel'
import { useTroStakedBalance } from '../../hooks/useTroStakedBalance'
import { canStakeTro, canStakeNft } from '../../config/scStatus'
import { isPitchMode, PITCH_DEMO } from '../../lib/pitchMode'

export default function DeFiBuilder() {
  const [tab, setTab] = useState<'tro' | 'nft' | 'rewards'>('tro')
  const { userTro, totalTro, loading } = useTroStakedBalance()
  const pitch = isPitchMode()

  /** Estimation indicative (non on-chain APR officiel). */
  const estRewards = useMemo(() => {
    const staked = userTro ?? 0
    const apr = pitch ? 0.12 : 0.08
    const daily = (staked * apr) / 365
    return { apr, daily, yearly: staked * apr }
  }, [userTro, pitch])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-purple-500/30 bg-black/85 backdrop-blur-md p-4 shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/90">DeFi Builder</p>
        <h2 className="text-lg font-bold text-white">Stake · Rewards</h2>
        <p className="text-[12px] text-zinc-400 mt-1">
          $TRO SC {canStakeTro() ? 'LIVE' : 'gate'} · NFT stake {canStakeNft() ? 'LIVE' : 'gate'}.
          Non-custodial · pas un conseil financier.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
            <p className="text-zinc-500">Votre stake</p>
            <p className="font-semibold text-white tabular-nums">
              {loading ? '…' : (userTro ?? 0).toFixed(2)} TRO
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
            <p className="text-zinc-500">Pool</p>
            <p className="font-semibold text-white tabular-nums">
              {pitch ? PITCH_DEMO.tvlUsd.toLocaleString() + ' $' : (totalTro ?? 0).toFixed(0) + ' TRO'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
            <p className="text-zinc-500">Est. / jour</p>
            <p className="font-semibold text-emerald-200 tabular-nums">{estRewards.daily.toFixed(4)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['tro', 'Stake $TRO'],
            ['nft', 'Stake NFT'],
            ['rewards', 'Claim Rewards'],
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
          <p className="text-sm text-zinc-300">
            Récompenses estimées (indicatif APR {(estRewards.apr * 100).toFixed(0)}%) :{' '}
            <strong className="text-emerald-200">{estRewards.yearly.toFixed(4)} TRO / an</strong>
          </p>
          <p className="text-[12px] text-zinc-500">
            Le SC stake actuel expose stake/unstake. Claim rewards dédié s’active quand l’endpoint on-chain
            rewards est ouvert — en attendant, unstake récupère le principal.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-sm min-h-[44px] opacity-60 cursor-not-allowed"
              disabled
              title="Endpoint claim rewards non exposé sur ce SC"
            >
              Claim Rewards
            </button>
            <Link to="/staking" className="btn-secondary text-sm min-h-[44px] inline-flex items-center">
              Gérer unstake
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
