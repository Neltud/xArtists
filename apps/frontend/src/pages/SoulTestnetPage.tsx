import { Link } from 'react-router-dom'
import { SOUL } from '../config/soul'
import { LINKS } from '../config/links'

export default function SoulTestnetPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
        <strong>EXPERIMENTAL</strong> — {SOUL.disclaimer}
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Soul Protocol</h1>
        <p className="text-zinc-400 text-sm mt-2">
          Exploration only. MultiversX remains the settlement layer for xArtists / LIA.
          Native MVX: {SOUL.mxNative ? 'enabled' : 'not available'}.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">Referenced test networks</h2>
        <ul className="space-y-2 text-sm">
          {SOUL.testnets.map(n => (
            <li key={n.id} className="flex justify-between border-b border-zinc-800 pb-1">
              <span>{n.name}</span>
              <span className="font-mono text-zinc-500">chainId {n.id}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/hatom"
          className="inline-flex justify-center rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-medium"
        >
          Stay on Hatom (MultiversX)
        </Link>
        <a
          href={LINKS.explorer}
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center rounded-lg border border-zinc-700 hover:border-zinc-500 px-4 py-2.5 text-sm text-zinc-300"
        >
          MultiversX Explorer
        </a>
      </div>
      <p className="text-xs text-zinc-600">
        External Soul app links are omitted until a stable public URL is verified (avoids dead links).
      </p>
    </div>
  )
}
