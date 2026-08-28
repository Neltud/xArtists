import { Link } from 'react-router-dom'

export default function ToursScopeBanner() {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">
      <p className="font-semibold text-rose-100">Tours artistiques — service culturel</p>
      <p className="text-[12px] text-zinc-400 mt-1">
        Visites, expositions, parcours art. <strong className="text-zinc-300">Ce n’est pas</strong> un
        pack agent IA (Pulse / Yield / Sentinel).
      </p>
      <p className="text-[12px] mt-2">
        Packs IA →{' '}
        <Link to="/agents" className="text-violet-300 underline">
          /agents
        </Link>
      </p>
    </div>
  )
}
