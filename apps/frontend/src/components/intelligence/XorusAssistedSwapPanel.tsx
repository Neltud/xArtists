/**
 * xOrus Assisted Swap Panel — human-in-the-loop via backend proxy.
 * Never holds keys. Displays quote, costSummary, warnings, signingLink.
 * XORUS_LIVE_TRADING remains false; this panel only prepares unsigned txs.
 *
 * Security:
 * - All OneDex MCP calls go through POST /v1/xorus/assisted-swap (access-api).
 * - Policy (exact allowlist + amount caps) is enforced server-side.
 * - signingLink only returned by backend when simulation is strictly OK.
 * - Client still mirrors basic checks for UX; backend is source of truth.
 */
import { useCallback, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'

const API_BASE = ((import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || '')
  .trim()
  .replace(/\/+$/, '')

function approvedSigningLink(link: string): boolean {
  try {
    const url = new URL(link)
    return url.protocol === 'https:' && url.hostname === 'wallet.multiversx.com'
      && (url.port === '' || url.port === '443')
      && url.username === '' && url.password === ''
      && url.pathname === '/hook/transaction' && !url.hash
  } catch {
    return false
  }
}

type QuoteView = {
  quotedOut?: string
  minOut?: string
  costSummary?: string
  priceImpact?: string
  warnings: string[]
}

type BuildView = {
  summary?: string
  signingLink?: string
  minOut?: string
  expiresAt?: string
}

type ProxyResponse = {
  ok: boolean
  stage: string
  message?: string
  quote?: {
    quotedOut?: string
    minOut?: string
    costSummary?: string
    priceImpact?: string
    warnings?: string[]
  }
  build?: {
    summary?: string
    signingLink?: string | null
    minOut?: string
    expiresAt?: string
  }
  simulation?: {
    ok?: boolean
    status?: string
    meetsMinOut?: boolean | null
  }
  policy?: { reason?: string }
}

export default function XorusAssistedSwapPanel() {
  const { lang } = useI18n()
  const fr = lang === 'fr'

  const [tokenIn, setTokenIn] = useState('EGLD')
  const [tokenOut, setTokenOut] = useState('ONE')
  const [amountIn, setAmountIn] = useState('0.1')
  const [sender, setSender] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<QuoteView | null>(null)
  const [build, setBuild] = useState<BuildView | null>(null)
  const [simOk, setSimOk] = useState<boolean | null>(null)
  const [stage, setStage] = useState<string | null>(null)

  // A preview is strictly tied to the exact intent that produced it.
  // Editing any field immediately revokes a previously shown signing link.
  const clearPreview = () => {
    setError(null)
    setQuote(null)
    setBuild(null)
    setSimOk(null)
    setStage(null)
  }

  const run = useCallback(async () => {
    setError(null)
    setQuote(null)
    setBuild(null)
    setSimOk(null)
    setStage(null)

    if (!API_BASE) {
      setError(
        fr
          ? 'VITE_ACCESS_API_BASE non configuré — proxy backend requis'
          : 'VITE_ACCESS_API_BASE not configured — backend proxy required',
      )
      return
    }
    if (!sender.startsWith('erd1') || sender.length < 62) {
      setError(fr ? 'Adresse publique erd1… requise' : 'Public erd1… address required')
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`${API_BASE}/v1/xorus/assisted-swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ tokenIn, tokenOut, amountIn, sender }),
      })
      const data = (await res.json()) as ProxyResponse
      setStage(data.stage || null)

      if (data.quote) {
        setQuote({
          quotedOut: data.quote.quotedOut,
          minOut: data.quote.minOut,
          costSummary: data.quote.costSummary,
          priceImpact: data.quote.priceImpact,
          warnings: Array.isArray(data.quote.warnings) ? data.quote.warnings : [],
        })
      }
      if (data.build) {
        setBuild({
          summary: data.build.summary,
          signingLink: data.build.signingLink || undefined,
          minOut: data.build.minOut,
          expiresAt: data.build.expiresAt,
        })
      }

      if (res.ok && data.stage === 'ready_to_sign' && data.ok === true
          && data.simulation?.ok === true && data.simulation.meetsMinOut === true) {
        setSimOk(true)
      } else if (data.stage === 'simulate') {
        setSimOk(false)
      } else if (data.simulation) {
        setSimOk(data.simulation.ok === true && data.simulation.meetsMinOut === true)
      } else {
        setSimOk(null)
      }

      if (!data.ok) {
        setError(data.message || data.policy?.reason || `stage=${data.stage}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [tokenIn, tokenOut, amountIn, sender, fr])

  const canShowSigningLink = Boolean(
    !busy && !error && stage === 'ready_to_sign' && simOk === true &&
    build?.signingLink && approvedSigningLink(build.signingLink) &&
    (!build.expiresAt || (Number.isFinite(Date.parse(build.expiresAt))
      && Date.parse(build.expiresAt) > Date.now())),
  )

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-black/40 p-5 space-y-4"
      aria-label={fr ? 'Swap assisté OneDex' : 'Assisted OneDex swap'}
      data-testid="xorus-assisted-swap"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
          {fr ? 'Exécution assistée · proxy · beta' : 'Assisted execution · proxy · beta'}
        </p>
        <h2 className="text-lg font-medium text-white mt-1">
          {fr
            ? 'Préparer un swap OneDex (signature humaine)'
            : 'Prepare a OneDex swap (human signature)'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
          {fr
            ? 'Le navigateur n’appelle plus OneDex directement. xOrus (access-api) applique la policy, puis quote → build → simulate. Aucune clé privée ne quitte votre wallet.'
            : 'The browser no longer calls OneDex directly. xOrus (access-api) enforces policy, then quote → build → simulate. No private key leaves your wallet.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-zinc-400 space-y-1">
          <span>{fr ? 'Token entrant' : 'Token in'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white"
            value={tokenIn}
            disabled={busy}
            onChange={(e) => { clearPreview(); setTokenIn(e.target.value) }}
          />
        </label>
        <label className="text-xs text-zinc-400 space-y-1">
          <span>{fr ? 'Token sortant' : 'Token out'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white"
            value={tokenOut}
            disabled={busy}
            onChange={(e) => { clearPreview(); setTokenOut(e.target.value) }}
          />
        </label>
        <label className="text-xs text-zinc-400 space-y-1">
          <span>{fr ? 'Montant' : 'Amount'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white"
            value={amountIn}
            disabled={busy}
            onChange={(e) => { clearPreview(); setAmountIn(e.target.value) }}
          />
        </label>
        <label className="text-xs text-zinc-400 space-y-1 sm:col-span-2 lg:col-span-1">
          <span>{fr ? 'Adresse publique (erd1…)' : 'Public address (erd1…)'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white font-mono"
            value={sender}
            disabled={busy}
            onChange={(e) => { clearPreview(); setSender(e.target.value.trim()) }}
            placeholder="erd1…"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={busy || !API_BASE}
        onClick={run}
        className="rounded-lg bg-amber-600/90 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:opacity-50"
      >
        {busy
          ? fr
            ? 'Préparation…'
            : 'Preparing…'
          : fr
            ? 'Policy → Quote → Build → Simulate'
            : 'Policy → Quote → Build → Simulate'}
      </button>

      {!API_BASE && (
        <p className="text-sm text-amber-400" role="status">
          {fr
            ? 'Proxy non configuré (VITE_ACCESS_API_BASE). Aucun appel MCP depuis le navigateur.'
            : 'Proxy not configured (VITE_ACCESS_API_BASE). No browser-side MCP calls.'}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
          {stage ? ` · ${stage}` : ''}
        </p>
      )}

      {quote && (
        <div className="rounded-lg border border-white/10 bg-black/50 p-3 space-y-2 text-sm">
          <p className="text-xs uppercase tracking-wider text-zinc-500">{fr ? 'Quote' : 'Quote'}</p>
          <p>
            <span className="text-zinc-400">{fr ? 'Sortie estimée' : 'Quoted out'}: </span>
            <span className="text-white">{quote.quotedOut || '—'}</span>
          </p>
          <p>
            <span className="text-zinc-400">minOut: </span>
            <span className="text-white">{quote.minOut || '—'}</span>
          </p>
          {quote.costSummary && (
            <p className="text-zinc-300 whitespace-pre-wrap">{quote.costSummary}</p>
          )}
          {quote.priceImpact && (
            <p>
              <span className="text-zinc-400">{fr ? 'Impact prix' : 'Price impact'}: </span>
              {quote.priceImpact}
            </p>
          )}
          {quote.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-amber-400/90">
              {quote.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {build && (
        <div className="rounded-lg border border-white/10 bg-black/50 p-3 space-y-2 text-sm">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {fr ? 'Transaction non signée' : 'Unsigned transaction'}
          </p>
          {build.summary && <p className="text-zinc-300">{build.summary}</p>}
          <p>
            <span className="text-zinc-400">minOut: </span>
            {build.minOut || '—'}
          </p>
          {simOk === true && (
            <p className="text-emerald-400">
              {fr
                ? 'Simulation favorable — vérifiez chaque détail dans votre wallet'
                : 'Simulation passed — verify every detail in your wallet'}
            </p>
          )}
          {simOk === false && (
            <p className="text-red-400">
              {fr
                ? 'Simulation échouée ou minOut non respecté — ne pas signer'
                : 'Simulation failed or minOut not met — do not sign'}
            </p>
          )}
          {simOk === null && (
            <p className="text-amber-400">
              {fr
                ? 'Simulation non conclusive ou non atteinte — ne pas signer'
                : 'Simulation inconclusive or not reached — do not sign'}
            </p>
          )}
          {canShowSigningLink ? (
            <a
              href={build.signingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-amber-300 hover:bg-white/20"
            >
              {fr ? 'Ouvrir le lien de signature' : 'Open signing link'}
              <span aria-hidden>↗</span>
            </a>
          ) : (
            <p className="text-xs text-zinc-500">
              {fr
                ? 'Lien de signature uniquement si le proxy valide policy + simulation.'
                : 'Signing link only when the proxy validates policy + simulation.'}
            </p>
          )}
          {build.expiresAt && (
            <p className="text-xs text-zinc-500">
              {fr ? 'Expire' : 'Expires'}: {build.expiresAt}
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] text-zinc-500">
        {fr
          ? 'Proxy access-api · OneDex MCP serveur · non-custodial · xOrus ne signe jamais. Mode autonome non activé.'
          : 'access-api proxy · server-side OneDex MCP · non-custodial · xOrus never signs. Autonomous mode not enabled.'}
      </p>
    </section>
  )
}
