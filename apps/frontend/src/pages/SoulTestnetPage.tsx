import { Link } from 'react-router-dom'
import { SOUL } from '../config/soul'
import { LINKS } from '../config/links'
import PreMainnetBanner from '../components/PreMainnetBanner'
import { PRE_MAINNET_MODULES } from '../config/preMainnet'

const mod = PRE_MAINNET_MODULES.find((m) => m.id === 'soul')

export default function SoulTestnetPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <PreMainnetBanner module={mod} />
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Soul Protocol</h1>
        <p className="text-zinc-400 text-sm mt-2">
          Statut <span className="text-amber-300 font-medium">pre-mainnet</span>. MultiversX reste la
          couche de règlement pour xArtists / LIA. Native MVX :{' '}
          {SOUL.mxNative ? 'enabled' : 'not available'}.
        </p>
        <p className="text-zinc-500 text-xs mt-1">{SOUL.disclaimer}</p>
      </header>
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
          Réseaux de référence (test) — pas de dépôt xArtists
        </h2>
        <ul className="space-y-2 text-sm">
          {SOUL.testnets.map((n) => (
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
          Rester sur Hatom (MultiversX)
        </Link>
        <a
          href={LINKS.explorer}
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Explorer MultiversX
        </a>
      </div>
    </div>
  )
}
