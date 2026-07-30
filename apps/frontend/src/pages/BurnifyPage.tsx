/**
 * Burnify — TRO / NFT burn for $BFY + EGLD rewards (UI)
 * Legacy demo lived at src/features/BurnifyDemo.tsx (not wired in SPA).
 * External protocol: Burnify on MultiversX (partner ecosystem).
 */

export default function BurnifyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold">🔥 Burnify</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Burn $TRO or selected NFTs to reduce supply and earn rewards (partner protocol on MultiversX).
          Live on-chain burn requires connected user wallet + verified SC addresses.
        </p>
      </header>

      <div className="card space-y-4">
        <p className="text-sm text-amber-300/90 border border-amber-500/30 rounded-lg p-3">
          Demo / shell UI — no burn is executed until LIA/Vellum + user signature path is validated
          with official Burnify contract endpoints.
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
          Burn TRO (coming online)
        </button>
      </div>

      <div className="text-xs text-zinc-600 space-y-1">
        <p>Legacy file: <code>src/features/BurnifyDemo.tsx</code></p>
        <p>Menu route: <code>/burnify</code></p>
        <p>Ecosystem note: also listed in <code>src/features/EcosystemOverview.tsx</code></p>
      </div>
    </div>
  )
}
