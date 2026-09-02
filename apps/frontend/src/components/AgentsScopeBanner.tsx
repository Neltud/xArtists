import { Link } from 'react-router-dom'

/** Bannière stricte : page Agents = packs IA uniquement. */
export default function AgentsScopeBanner() {
  return (
    <div className="rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-3 text-sm">
      <p className="font-semibold text-violet-100">Page Agents = packs IA uniquement</p>
      <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
        Séries <strong className="text-zinc-300">Pulse · Yield · Sentinel</strong> (achat Stripe / accès NFT).
        Signaux GSN. Ce n’est <strong className="text-zinc-300">pas</strong> un agent de voyage ni un service
        de réservation.
      </p>
      <p className="text-[12px] text-zinc-500 mt-2">
        Tours artistiques (expos, visites) →{' '}
        <Link to="/tours" className="text-cyan-300 underline">
          page Tours
        </Link>{' '}
        (service séparé).
      </p>
    </div>
  )
}
