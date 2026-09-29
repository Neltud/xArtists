/**
 * TRO stake / unstake panel — gated by canStakeTro().
 * SC bytecode: instant unstake (no on-chain unbonding).
 * Bonded 30/90 = product policy / future DAO — not enforced on this SC.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  canStakeTro,
  TRO_STAKING_ADDRESS,
  troStakingStatusLabel,
  TRO_TOKEN_ID,
} from '../config/scStatus'
import { useTroStakeTx } from '../hooks/useTroStakeTx'
import { useTroStakedBalance } from '../hooks/useTroStakedBalance'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

export default function TroStakePanel() {
  const live = canStakeTro()
  const { connected } = useWallet()
  const { stake, unstake, pending, error, lastTx } = useTroStakeTx()
  const { userTro, totalTro, loading, refresh } = useTroStakedBalance()
  const [amount, setAmount] = useState('1')
  const [mode, setMode] = useState<'flexible' | 'bond30' | 'bond90'>('flexible')
  const [bondEndsAt, setBondEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (lastTx) void refresh()
  }, [lastTx, refresh])

  const onStake = async () => {
    const n = Number(amount)
    if (!(n > 0)) return
    try {
      const r = await stake(n)
      if (r.ok && mode !== 'flexible') {
        const days = mode === 'bond30' ? 30 : 90
        const ends = Date.now() + days * 24 * 60 * 60 * 1000
        setBondEndsAt(ends)
        try {
          localStorage.setItem(
            'xartists_tro_bond_policy',
            JSON.stringify({ mode, ends, amount: n, at: Date.now() }),
          )
        } catch {
          /* */
        }
      }
      void refresh()
    } catch {
      /* error in state */
    }
  }

  const onUnstake = async () => {
    const n = Number(amount)
    if (!(n > 0)) return
    // Soft policy warning only — SC allows anytime
    if (bondEndsAt && now < bondEndsAt && mode !== 'flexible') {
      const ok = window.confirm(
        'Policy bond encore active (soft UI). Le SC permet unstake immédiat. Continuer ?',
      )
      if (!ok) return
    }
    try {
      await unstake(n)
      void refresh()
    } catch {
      /* */
    }
  }

  const setMaxStaked = () => {
    if (userTro != null && userTro > 0) setAmount(String(userTro))
  }

  const remainingMs = bondEndsAt && bondEndsAt > now ? bondEndsAt - now : 0
  const remainLabel =
    remainingMs > 0
      ? formatCountdown(remainingMs)
      : bondEndsAt
        ? 'Policy terminée'
        : null

  useEffect(() => {
    try {
      const raw = localStorage.getItem('xartists_tro_bond_policy')
      if (!raw) return
      const p = JSON.parse(raw) as { mode?: string; ends?: number }
      if (p.ends && p.ends > Date.now()) {
        setBondEndsAt(p.ends)
        if (p.mode === 'bond30' || p.mode === 'bond90') setMode(p.mode)
      }
    } catch {
      /* */
    }
  }, [])

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

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Ton stake</p>
          <p className="font-semibold text-emerald-200 tabular-nums">
            {loading && userTro == null
              ? '…'
              : userTro != null
                ? `${userTro.toLocaleString(undefined, { maximumFractionDigits: 6 })} TRO`
                : connected
                  ? '0 TRO'
                  : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Total SC</p>
          <p className="font-semibold text-zinc-200 tabular-nums">
            {totalTro != null
              ? `${totalTro.toLocaleString(undefined, { maximumFractionDigits: 6 })} TRO`
              : '—'}
          </p>
        </div>
      </div>

      <ul className="text-sm text-zinc-400 space-y-2">
        <li>
          <strong className="text-zinc-200">Flexible</strong> — unstake{' '}
          <em className="text-zinc-300">immédiat</em> on-chain (bytecode actuel)
        </li>
        <li>
          <strong className="text-zinc-200">Bonded 30 / 90 j</strong> — policy UI / APR futur
          (pas de lock dans ce SC)
        </li>
        <li>
          <strong className="text-zinc-200">Vote-locked</strong> — pouvoir DAO →{' '}
          <Link to="/dao" className="underline-offset-2 hover:underline text-zinc-300">
            /dao
          </Link>
        </li>
      </ul>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['flexible', 'Flexible'],
            ['bond30', 'Bond 30j'],
            ['bond90', 'Bond 90j'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              mode === id
                ? 'border-violet-500 bg-violet-500/20 text-violet-100'
                : 'border-[#2a2a3a] text-zinc-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {remainLabel && mode !== 'flexible' && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
          Compte à rebours policy (soft) : <strong className="mono">{remainLabel}</strong>
          <span className="block text-[10px] text-violet-200/70 mt-1">
            Le SC autorise quand même unstake immédiat — ce timer est informatif.
          </span>
        </div>
      )}

      <p className="text-[11px] mono text-zinc-500 break-all">
        SC: {TRO_STAKING_ADDRESS || '—'}
      </p>

      {!connected && (
        <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
          Connect wallet
        </button>
      )}

      {!live && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90">
          Fail-closed : secret{' '}
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
            onChange={e => setAmount(e.target.value)}
            disabled={!live || pending}
            className="rounded-lg border border-[#2a2a3a] bg-[#0c0c12] px-3 py-2 text-sm text-white w-32"
          />
        </label>
        <button
          type="button"
          className="btn-secondary text-xs py-2"
          disabled={userTro == null || userTro <= 0}
          onClick={setMaxStaked}
        >
          Max stake
        </button>
        <button
          type="button"
          disabled={!live || pending}
          onClick={onStake}
          className={`btn-primary text-sm ${!live || pending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {pending ? '…' : 'Stake $TRO'}
        </button>
        <button
          type="button"
          disabled={!live || pending}
          onClick={onUnstake}
          className={`btn-secondary text-sm ${!live || pending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Unstake
        </button>
        <button type="button" className="btn-secondary text-xs py-2" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {lastTx && (
        <p className="text-xs text-emerald-400">
          TX: <span className="mono break-all">{lastTx}</span>
        </p>
      )}

      <p className="text-[11px] text-zinc-500">
        Token {TRO_TOKEN_ID}. Unstake = endpoint SC <code className="text-[10px]">unstake</code>{' '}
        (immédiat). Wallet utilisateur uniquement.
      </p>
    </div>
  )
}

function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}j ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${sec}s`
  return `${m}m ${sec}s`
}
