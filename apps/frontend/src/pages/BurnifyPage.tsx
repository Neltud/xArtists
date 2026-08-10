import { useState } from 'react'
import { Link } from 'react-router-dom'
import PreMainnetBanner from '../components/PreMainnetBanner'
import { PRE_MAINNET_MODULES } from '../config/preMainnet'
import { useBurnTro } from '../hooks/useBurnTro'
import { LINKS, LIA_WALLET } from '../config/links'

const mod = PRE_MAINNET_MODULES.find((m) => m.id === 'burnify')

/** Burnify — SC xArtists: burn $TRO + reward EGLD (pool LIA). */
export default function BurnifyPage() {
  const {
    burnTro,
    fundRewards,
    pending,
    error,
    lastTx,
    live,
    scAddress,
    tokenId,
    decimals,
    egldPerTroHint,
  } = useBurnTro()
  const [amount, setAmount] = useState('10')
  const [fundEgld, setFundEgld] = useState('0.1')
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [showFund, setShowFund] = useState(false)

  const onBurn = async () => {
    setLocalErr(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Montant invalide')
      return
    }
    try {
      await burnTro(n)
    } catch (e: unknown) {
      setLocalErr(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const onFund = async () => {
    setLocalErr(null)
    const n = Number(fundEgld)
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('EGLD invalide')
      return
    }
    try {
      await fundRewards(n)
    } catch (e: unknown) {
      setLocalErr(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {!live && <PreMainnetBanner module={mod} />}
      <header>
        <h1 className="text-2xl font-bold">🔥 Burnify · $TRO → EGLD</h1>
        <p className="text-sm text-zinc-400 mt-2">
          SC <strong className="text-zinc-200">xArtists dédié</strong> (<code className="text-xs">tro-burn</code>)
          : brûle <span className="font-mono">{tokenId}</span>, reward EGLD au burner, fee → wallet LIA.
          Pas un service externe.
        </p>
      </header>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Statut</span>
          <span className={live ? 'text-emerald-400' : 'text-amber-300'}>
            {live ? 'SC live' : 'pre-mainnet — deploy + fundRewards'}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">SC</span>
          <span className="font-mono text-xs text-zinc-400 break-all">
            {scAddress || 'VITE_TRO_BURN_ADDRESS'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Hint EGLD/TRO</span>
          <span className="font-mono">{egldPerTroHint || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Decimals</span>
          <span className="font-mono">{decimals}</span>
        </div>
      </div>
      <div className="space-y-4 rounded-xl border border-zinc-800 p-4">
        <label className="block text-sm text-zinc-400">
          Montant ($TRO)
          <input
            type="number"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!live || pending}
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
        {(error || localErr) && (
          <p className="text-sm text-red-400 border border-red-500/30 rounded-lg p-3">
            {localErr || error}
          </p>
        )}
        {lastTx && <p className="text-xs text-emerald-400">Session TX : {lastTx}</p>}
        <button
          type="button"
          onClick={onBurn}
          disabled={!live || pending}
          className={`w-full rounded-lg py-2.5 text-sm font-medium ${
            live
              ? 'bg-orange-600 hover:bg-orange-500 text-white'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {pending ? 'Signature…' : live ? `Burn ${amount || '…'} $TRO` : 'Burn (disabled)'}
        </button>
      </div>
      <div className="rounded-xl border border-zinc-800 p-4 space-y-3">
        <button type="button" className="text-xs text-zinc-400" onClick={() => setShowFund((s) => !s)}>
          {showFund ? '▾' : '▸'} Ops — fundRewards (pool EGLD)
        </button>
        {showFund && (
          <div className="space-y-3">
            <label className="block text-sm text-zinc-400">
              EGLD
              <input
                type="number"
                min={0}
                step="any"
                value={fundEgld}
                onChange={(e) => setFundEgld(e.target.value)}
                disabled={!live || pending}
                className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white disabled:opacity-60"
              />
            </label>
            <button
              type="button"
              onClick={onFund}
              disabled={!live || pending}
              className="w-full rounded-lg py-2 text-sm bg-violet-700 hover:bg-violet-600 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              fundRewards
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/tro" className="text-violet-400 hover:underline">
          ← $TRO
        </Link>
        <a href={LINKS.explorerAccount(LIA_WALLET)} target="_blank" rel="noreferrer" className="text-zinc-400 hover:underline">
          Wallet LIA
        </a>
      </div>
    </div>
  )
}
