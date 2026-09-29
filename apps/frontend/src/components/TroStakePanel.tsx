/**
 * TRO stake / unstake panel — gated by canStakeTro() (VITE_TRO_STAKING_CODEHASH_OK).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { canStakeTro, TRO_STAKING_ADDRESS, troStakingStatusLabel, TRO_TOKEN_ID } from '../config/scStatus'
import { useTroStakeTx } from '../hooks/useTroStakeTx'

export default function TroStakePanel() {
  const live = canStakeTro()
  const { stake, unstake, pending, error, lastTx } = useTroStakeTx()
  const [amount, setAmount] = useState('1')

  const onStake = async () => {
    const n = Number(amount)
    if (!(n > 0)) return
    try {
      await stake(n)
    } catch {
      /* error in state */
    }
  }

  const onUnstake = async () => {
    const n = Number(amount)
    if (!(n > 0)) return
    try {
      await unstake(n)
    } catch {
      /* error in state */
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">$TRO staking (SC on-chain)</h2>
        <span
          className={`text-[10px] rounded-full border px-2 py-0.5 ${
            live
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-amber-500/40 text-amber-200'
          }`}
        >
          {troStakingStatusLabel()}
        </span>
      </div>

      <ul className="text-sm text-zinc-400 space-y-2">
        <li>
          <strong className="text-zinc-200">Flexible</strong> — unstake anytime
        </li>
        <li>
          <strong className="text-zinc-200">Bonded 30 / 90 j</strong> — APR policy
        </li>
        <li>
          <strong className="text-zinc-200">Vote-locked</strong> — pouvoir DAO (separe du yield LP)
        </li>
      </ul>

      <p className="text-[11px] mono text-zinc-500 break-all">
        SC: {TRO_STAKING_ADDRESS || '—'}
      </p>

      {!live && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90">
          Fail-closed : rebuild Pages avec secret{' '}
          <code className="text-[10px]">VITE_TRO_STAKING_CODEHASH_OK=1</code>.
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Montant TRO
          <input
            type="number"
            min="0"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!live || pending}
            className="rounded-lg border border-[#2a2a3a] bg-[#0c0c12] px-3 py-2 text-sm text-white w-32"
          />
        </label>
        <button
          type="button"
          disabled={!live || pending}
          onClick={onStake}
          className={`btn-primary text-sm ${!live || pending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {pending ? 'En cours…' : 'Stake $TRO'}
        </button>
        <button
          type="button"
          disabled={!live || pending}
          onClick={onUnstake}
          className={`btn-secondary text-sm ${!live || pending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Unstake
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {lastTx && (
        <p className="text-xs text-emerald-400">
          TX: <span className="mono">{lastTx}</span>
        </p>
      )}

      <p className="text-[11px] text-zinc-500">
        Token {TRO_TOKEN_ID}. Wallet utilisateur (xPortal). Vote DAO →{' '}
        <Link to="/dao" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          /dao
        </Link>
        .
      </p>
    </div>
  )
}
