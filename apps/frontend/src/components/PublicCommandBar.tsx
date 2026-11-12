/**
 * Visitor command bar. Submit classifies a sentence. It does not sign.
 */
import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { classifyPublicCommand, type PublicCommand } from '../lia/publicCommand'

export default function PublicCommandBar() {
  const [draft, setDraft] = useState('')
  const [result, setResult] = useState<PublicCommand>(() => classifyPublicCommand(''))

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setResult(classifyPublicCommand(draft))
  }

  const tone =
    result.lane === 'blocked'
      ? 'border-rose-400/30 bg-rose-400/10 text-rose-100'
      : result.lane === 'read'
        ? 'border-sky-400/30 bg-sky-400/10 text-sky-100'
        : 'border-amber-400/25 bg-amber-400/10 text-amber-100'

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4" aria-label="Command bar publique">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="xa-public-command" className="text-sm font-semibold text-white">
          Command bar · intention
        </label>
        <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
          Paper · 0 signature
        </span>
      </div>
      <p className="text-xs leading-5 text-zinc-400">
        Décris ce que tu veux voir. Acheter, échanger, minter ou payer reste refusé.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="xa-public-command"
          name="command"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          autoComplete="off"
          placeholder="Exemple : ouvre le musée"
          className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-black/40 px-3 text-sm text-white"
        />
        <button type="submit" className="btn-secondary inline-flex min-h-[44px] items-center justify-center px-4 text-sm">
          Lire l’intention
        </button>
      </div>
      <div role="status" className={`rounded-xl border p-3 text-sm leading-6 ${tone}`}>
        <p className="font-medium">{result.title}</p>
        <p className="mt-1 text-[13px] leading-5 opacity-90">{result.detail}</p>
        {result.href ? (
          <Link className="mt-2 inline-flex min-h-[44px] items-center text-sm underline" to={result.href}>
            Continuer →
          </Link>
        ) : null}
      </div>
    </form>
  )
}
