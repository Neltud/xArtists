import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { Link } from 'react-router-dom'

/** Bannière stricte : page Agents = packs IA uniquement. */
export default function AgentsScopeBanner() {
  return (
    <div className="rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-3 text-sm">
      <p className="font-semibold text-violet-100">{xaRender("Page Agents = packs IA uniquement")}</p>
      <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
        {xaRender("Séries ")}<strong className="text-zinc-300">{xaRender("Pulse · Yield · Sentinel")}</strong> {xaRender(" (achat Stripe / accès NFT). Ce n’est ")}<strong className="text-zinc-300">{xaRender("pas")}</strong> {xaRender(" un agent de voyage ni un service de réservation. ")}</p>
      <p className="text-[12px] text-zinc-500 mt-2">
        {xaRender("Tours artistiques (expos, visites) →")}{xaRender(' ')}
        <Link to="/tours" className="text-cyan-300 underline">
          {xaRender("page Tours ")}</Link>{xaRender(' ')}
        {xaRender("(service séparé). ")}</p>
    </div>
  )
}
