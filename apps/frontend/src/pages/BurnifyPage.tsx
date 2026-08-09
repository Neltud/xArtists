import { useState } from 'react'
import { Link } from 'react-router-dom'
import PreMainnetBanner from '../components/PreMainnetBanner'
import { PRE_MAINNET_MODULES } from '../config/preMainnet'
import { useBurnTro } from '../hooks/useBurnTro'
import { LINKS } from '../config/links'

const mod = PRE_MAINNET_MODULES.find((m) => m.id === 'burnify')

export default function BurnifyPage() {
  const { burnTro, pending, error, lastTx, live, scAddress, tokenId, decimals } = useBurnTro()
  const [amount, setAmount] = useState('10')
  const [localErr, setLocalErr] = useState<string | null>(null)

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {!live && <PreMainnetBanner module={mod} />}
      <header>
        <h1 className="text-2xl font-bold">🔥 Burnify · $TRO</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Brûlage <span className="font-mono text-zinc-300">{tokenId}</span> via{' '}
          <code className="text-xs">tro-burn</code>. Signature user uniquement.
        </p>
      </header>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Statut</span>
          <span className={live ? 'text-emerald-400' : 'text-amber-300'}>
            {live ? 'SC live' : 'pre-mainnet — SC non déployé'}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Contrat</span>
          <span className="font-mono text-xs text-zinc-400 break-all">
            {scAddress || 'VITE_TRO_BURN_ADDRESS non défini'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Decimals</span>
          <span className="font-mono">{decimals}</span>
        </div>
        <p className="text-[11px] text-zinc-500">
          Rôle <code>ESDTLocalBurn</code> requis. Endpoint <code>burnTro</code>.
        </p>
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
          {pending ? 'Signature…' : live ? `Burn ${amount || '…'} $TRO` : 'Burn (disabled · pre-mainnet)'}
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/tro" className="text-violet-400 hover:underline">
          ← Tokenomics $TRO
        </Link>
        <a href={LINKS.explorerToken(tokenId)} target="_blank" rel="noreferrer" className="text-zinc-400 hover:underline">
          Explorer token
        </a>
      </div>
    </div>
  )
}
