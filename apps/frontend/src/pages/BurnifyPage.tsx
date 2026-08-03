import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'

/**
 * Burnify shell — no on-chain burn until official SC endpoints verified.
 */
export default function BurnifyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold">🔥 Burnify</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Partner-ecosystem burn UI shell on MultiversX. No transaction is sent from this page.
        </p>
      </header>

      <div className="card space-y-4">
        <p className="text-sm text-amber-300/90 border border-amber-500/30 rounded-lg p-3">
          Coming online after verified contract addresses + wallet signature path.
        </p>
        <label className="block text-sm text-zinc-400">
          Amount to burn (TRO)
          <input
            type="number"
            min={1}
            placeholder="100"
            disabled
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white"
          />
        </label>
        <button type="button" className="btn-primary text-sm opacity-50 cursor-not-allowed" disabled>
          Burn TRO (disabled)
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/tro" className="btn-secondary">
          $TRO page
        </Link>
        <a href={LINKS.explorerToken(LINKS.troToken)} target="_blank" rel="noreferrer" className="btn-secondary">
          TRO on Explorer
        </a>
      </div>
    </div>
  )
}
