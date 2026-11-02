import {renderChild as xaRender} from '../i18n/phraseRuntime'
import { PACK_COMMERCIAL, AGENT_PACKS } from '../config/agentPacks'

/** Published pack terms — do not invent a GSN subsidy, allocation or live staking. */
const STEPS = [
  { id: '01', title: 'Choisir un pack', body: 'Pulse, Yield ou Sentinel : achat unique, distinct des abonnements Whop.' },
  { id: '02', title: 'Payer et vérifier', body: 'Utiliser uniquement un rail de paiement effectivement disponible et confirmé.' },
  { id: '03', title: 'Contrôler le NFT', body: 'Vérifier l’édition SFT et les droits du pack sur MultiversX avant de revendiquer un accès.' },
  { id: '04', title: 'Accéder aux fonctions', body: 'Signaux, salle et surveillance selon le pack, sans promesse de rendement ni dépôt trading implicite.' },
] as const

export default function AgentPackJourney() {
  return (
    <section className="card border-fuchsia-500/20 mb-6" aria-labelledby="journey-title">
      <h3 id="journey-title" className="font-bold text-fuchsia-200 mb-1">
        {xaRender("Parcours · Choisir → Payer → Vérifier → Accéder")}
      </h3>
      <p className="text-xs text-zinc-500 mb-4">
        {xaRender("Prix catalogue par pack : ")}
        {xaRender(AGENT_PACKS.map(p => `${p.name} ${p.priceEur.list} €`).join(' · '))}
        {xaRender(PACK_COMMERCIAL.billing === 'one_time' ? " · achat unique" : "")}
      </p>
      <ol className="space-y-3">
        {xaRender(STEPS.map(step => (
          <li key={step.id} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-xs font-bold flex items-center justify-center">
              {xaRender(step.id)}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{xaRender(step.title)}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{xaRender(step.body)}</p>
            </div>
          </li>
        )))}
      </ol>
      <div className="mt-5 rounded-xl border border-teal-500/25 bg-teal-950/20 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-teal-400/90">{xaRender("Sécurité · pas de mandat de gestion")}</p>
        <p className="text-xs text-zinc-300">
          {xaRender("Le wallet utilisateur ne finance pas le wallet LIA ; staking et trading restent soumis à leurs contrôles on-chain explicites.")}
        </p>
      </div>
    </section>
  )
}
