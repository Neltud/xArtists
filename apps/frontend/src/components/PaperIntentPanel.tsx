import { useState } from 'react'
import { classifyUtterance, POSTURE, type PaperIntent } from '../lia/intentPaper.mjs'

const EXAMPLES = [
  'Quel est le statut du prix EGLD',
  'Acheter le pack Pulse en euros',
  'buy sentinel with 2.5 EGLD',
] as const

function line(label: string, value: string) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-800 py-2 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="text-right text-zinc-100">{value}</span>
    </div>
  )
}

export default function PaperIntentPanel() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<PaperIntent | null>(null)

  function read(next: string) {
    setText(next)
    setResult(classifyUtterance(next))
  }

  return (
    <section aria-label="Commande papier" className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-zinc-50">Commande papier</h2>
        <p className="text-sm leading-6 text-zinc-300">
          LIA lit une intention et sépare le catalogue euro du relevé EGLD.
          Aucune lecture n’ouvre un paiement, un mint ou un trade.
          Sonde publique {POSTURE.probedAt.slice(0, 10)} · epoch {POSTURE.epoch} · EGLD {POSTURE.egldUsd} USD.
          Revue KR encore ouverte jusqu’au 16–20 novembre.
        </p>
      </div>
      <label className="block text-sm text-zinc-300" htmlFor="paper-intent">
        Intention
        <input
          id="paper-intent"
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="Exemple : statut du réseau"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-zinc-50"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm" onClick={() => read(text)}>
          Lire l’intention
        </button>
        {EXAMPLES.map(example => (
          <button key={example} type="button" className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm" onClick={() => read(example)}>
            {example}
          </button>
        ))}
      </div>
      {result && (
        <div role="status" className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3">
          {line('Intention', result.intent)}
          {line('Exécutable', 'non')}
          {result.reason ? line('Motif', result.reason) : null}
          {result.rail ? line('Rail', result.rail) : null}
          {result.catalogueEur ? line('Catalogue EUR', `${result.catalogueEur} € · non encaissable`) : null}
          {result.snapshotEgld ? line('Relevé EGLD', `${result.snapshotEgld} · figé au ${result.snapshotAsOf}, pas un devis`) : null}
          {result.intent === 'STATUS' ? line('EGLD', `${POSTURE.egldUsd} USD · cap ${POSTURE.egldMarketCapUsd}`) : null}
          {result.intent === 'STATUS' ? line('$TRO', `${POSTURE.troId} · ${POSTURE.troSupply} · ${POSTURE.troAccounts} comptes`) : null}
        </div>
      )}
    </section>
  )
}
