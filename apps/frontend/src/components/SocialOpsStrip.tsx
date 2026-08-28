/**
 * Ops social — checklist manuelle (Zapier / Vellum). Aucune clé ici.
 */
export default function SocialOpsStrip() {
  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3 text-[12px] text-zinc-400">
      <p className="font-semibold text-sky-100/90 text-sm mb-1">Posts X · ops</p>
      <ol className="list-decimal pl-4 space-y-0.5">
        <li>Zapier : connecter X (OAuth) — à faire dans ton compte Zapier</li>
        <li>Zap : Schedule 30 min → LLM → Create Tweet</li>
        <li>Ou Vellum cron 30 min → vault secrets X / Catch Hook Zapier</li>
      </ol>
      <p className="mt-2 text-[10px] text-zinc-600">
        Grok automation = drafts only. Aucun token X dans le front.
      </p>
    </div>
  )
}
