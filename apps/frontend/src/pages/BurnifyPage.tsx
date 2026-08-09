import { Link } from 'react-router-dom'
import PreMainnetBanner from '../components/PreMainnetBanner'
import { PRE_MAINNET_MODULES } from '../config/preMainnet'

const mod = PRE_MAINNET_MODULES.find((m) => m.id === 'burnify')

export default function BurnifyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <PreMainnetBanner module={mod} />
      <header>
        <h1 className="text-2xl font-bold">🔥 Burnify</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Shell pre-mainnet. <strong className="text-amber-200">Aucune transaction</strong> depuis
          cette page.
        </p>
      </header>
      <div className="card space-y-4">
        <p className="text-sm text-amber-300/90 border border-amber-500/30 rounded-lg p-3">
          Activation après SC vérifié (codeHash ≠ null) + signature wallet.
        </p>
        <label className="block text-sm text-zinc-400">
          Amount to burn (TRO)
          <input
            type="number"
            min={1}
            placeholder="100"
            disabled
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white opacity-60"
          />
        </label>
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-zinc-800 text-zinc-500 py-2.5 text-sm cursor-not-allowed"
        >
          Burn (disabled · pre-mainnet)
        </button>
      </div>
      <Link to="/tro" className="text-sm text-violet-400 hover:underline">
        ← Tokenomics $TRO
      </Link>
    </div>
  )
}
