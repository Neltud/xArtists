/**
 * Relayer gasless — statut honnête (paper jusqu’à infra).
 */
import { Link } from 'react-router-dom'

const LIFECYCLE = ['CREATED', 'GUARDIAN_CHECK', 'SIGNED', 'BROADCASTED', 'CONFIRMED'] as const

export default function RelayerPaperStrip() {
  return (
    <div className="card border-violet-500/25 mb-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400/80">Relayer · Trinity</p>
          <h3 className="font-bold text-sm text-white">Cycle transaction (paper)</h3>
        </div>
        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-200 bg-amber-500/10">
          Gasless OFF
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {LIFECYCLE.map((s, i) => (
          <span
            key={s}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
              i <= 1
                ? 'border-violet-400/40 text-violet-200 bg-violet-500/10'
                : 'border-zinc-700 text-zinc-600'
            }`}
          >
            {s}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 mb-2">
        Décimales imposées : <strong className="text-zinc-300">18 ETH</strong> ·{' '}
        <strong className="text-zinc-300">6 MVX</strong>. Nonce tracking paper. Broadcast mainnet = Vellum +
        fonds + audit.
      </p>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <Link to="/entity" className="text-violet-300 underline">
          Entité
        </Link>
        <a
          href="https://github.com/Neltud/xArtists/blob/main/packages/core-protocol/relayer/relayer-service.ts"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-500 underline"
        >
          relayer-service.ts
        </a>
      </div>
    </div>
  )
}
