import { PACK_JOURNEY_STEPS, FUNDING_MODELS } from '../config/agentPacks'

export default function AgentPackJourney() {
  const rec = FUNDING_MODELS.B_escrow_stake
  const simple = FUNDING_MODELS.C_no_user_capital

  return (
    <section className="card border-fuchsia-500/20 mb-6" aria-labelledby="journey-title">
      <h3 id="journey-title" className="font-bold text-fuchsia-200 mb-1">
        Parcours utilisateur (impeccable)
      </h3>
      <p className="text-xs text-zinc-500 mb-4">
        Ordre fixe — chaque étape a un état UI clair (bloqué / prêt / fait).
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

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Stake puis envoyer des tokens ?
        </p>
        <div className="text-xs text-zinc-300 space-y-2">
          <p>
            <strong className="text-teal-300">Recommandé v1 ({simple.id})</strong> : le pack donne un{' '}
            <em>droit de part</em> sur le pool protocole alloué au profil —{' '}
            <strong>sans</strong> que l’utilisateur envoie du capital de trading. Moins de confusion
            « fonds géré ».
          </p>
          <p>
            <strong className="text-amber-200">v1.5 ({rec.id})</strong> : après stake NFT,{' '}
            <code className="text-[10px]">deposit</code> vers un <strong>escrow SC du pack</strong>{' '}
            (pas le wallet LIA ops). Cap par agent · withdraw unstake · LIA exécute seulement dans les
            bornes SC. Jamais « colle ton EGLD à erd1 LIA ».
          </p>
          <p className="text-zinc-500">
            Éviter le modèle A (tokens → adresse agent libre) : ressemble à de la custody et mélange
            les soldes.
          </p>
        </div>
      </div>
    </section>
  )
}
