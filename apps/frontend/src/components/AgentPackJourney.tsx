import { PACK_JOURNEY_STEPS, FUNDING_MODELS, GSN_POLICY, PACK_PRICING_POLICY } from '../config/agentPacks'

export default function AgentPackJourney() {
  const v1 = FUNDING_MODELS.C_no_user_capital

  return (
    <section className="card border-fuchsia-500/20 mb-6" aria-labelledby="journey-title">
      <h3 id="journey-title" className="font-bold text-fuchsia-200 mb-1">
        Parcours · Buy → Stake → (Deposit) → Claim
      </h3>
      <p className="text-xs text-zinc-500 mb-4">
        Grammaire unique Art & Agents. Prix catalogue{' '}
        <strong className="text-zinc-300">{PACK_PRICING_POLICY.listEur} €</strong> — LIA ajuste pour marge.
      </p>
      <ol className="space-y-3">
        {PACK_JOURNEY_STEPS.map(s => (
          <li key={s.id} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-xs font-bold flex items-center justify-center">
              {s.id}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{s.title}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-xl border border-teal-500/25 bg-teal-950/20 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-teal-400/90">v1 verrouillé — {v1.id}</p>
        <p className="text-xs text-zinc-300">{v1.when}</p>
        <p className="text-[11px] text-zinc-500">
          Pas de mandat de gestion · pas de dépôt trading user vers LIA ops · GSN :{' '}
          {GSN_POLICY.description}
        </p>
      </div>
    </section>
  )
}
