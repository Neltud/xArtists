/**
 * xOrus Assisted Swap Panel — OneDex MCP, human-in-the-loop only.
 * Never holds keys. Displays quote, costSummary, warnings, signingLink.
 * XORUS_LIVE_TRADING remains false; this panel only prepares unsigned txs.
 */
import { useCallback, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'

const MCP = 'https://aggregator.onedex.app/ai/mcp'

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

async function mcpCall(name: string, args: Record<string, unknown>) {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name, arguments: args },
  }
  const res = await fetch(MCP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || 'RPC error')
  const result = json.result
  if (result?.structuredContent) return result.structuredContent
  const text = result?.content?.[0]?.text
  if (text) {
    try {
      return JSON.parse(text)
    } catch {
      return { text }
    }
  }
  return result || {}
}

function pickMinOut(data: Record<string, unknown>): string | undefined {
  const mo = data.minOut
  if (mo && typeof mo === 'object') {
    const o = mo as Record<string, unknown>
    return String(o.human || o.amount || '')
  }
  if (mo != null) return String(mo)
  return undefined
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

  const run = useCallback(async () => {
    setError(null)
    setQuote(null)
    setBuild(null)
    setSimOk(null)
    if (!sender.startsWith('erd1') || sender.length < 62) {
      setError(fr ? 'Adresse publique erd1… requise' : 'Public erd1… address required')
      return
    }
    setBusy(true)
    try {
      const q = await mcpCall('get_quote', {
        tokenIn,
        tokenOut,
        amountIn,
      })
      const qView: QuoteView = {
        quotedOut: String(q.quotedOut || q.amountOut || ''),
        minOut: pickMinOut(q),
        costSummary: String(q.costSummary || q.costs || ''),
        priceImpact: String(q.priceImpact || ''),
        warnings: Array.isArray(q.warnings) ? q.warnings.map(String) : [],
      }
      setQuote(qView)

      const b = await mcpCall('build_swap_tx', {
        tokenIn,
        tokenOut,
        amountIn,
        sender,
      })
      const bView: BuildView = {
        summary: String(b.summary || ''),
        signingLink: b.signingLink ? String(b.signingLink) : undefined,
        minOut: pickMinOut(b),
        expiresAt: b.expiresAt ? String(b.expiresAt) : undefined,
      }
      setBuild(bView)

      if (b.transaction) {
        const s = await mcpCall('simulate_swap_tx', {
          transaction: b.transaction,
          minOut:
            (b.minOut && typeof b.minOut === 'object'
              ? (b.minOut as { raw?: string }).raw
              : undefined) || b.minOutRaw,
        })
        const status = String(s.status || '').toLowerCase()
        const meets = s.meetsMinOut
        const ok = status === 'success' || status === 'ok'
        setSimOk(ok && meets !== false)
      } else {
        setSimOk(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [tokenIn, tokenOut, amountIn, sender, fr])

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-black/40 p-5 space-y-4"
      aria-label={fr ? 'Swap assisté OneDex' : 'Assisted OneDex swap'}
      data-testid="xorus-assisted-swap"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
          {fr ? 'Exécution assistée · beta' : 'Assisted execution · beta'}
        </p>
        <h2 className="text-lg font-medium text-white mt-1">
          {fr
            ? 'Préparer un swap OneDex (signature humaine)'
            : 'Prepare a OneDex swap (human signature)'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
          {fr
            ? 'xOrus appelle OneDex MCP pour le quote, la construction de la tx non signée et la simulation. Aucune clé privée ne quitte votre wallet. Vous signez via le lien fourni.'
            : 'xOrus calls OneDex MCP for quote, unsigned tx build and simulation. No private key leaves your wallet. You sign via the provided link.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-zinc-400 space-y-1">
          <span>{fr ? 'Token entrant' : 'Token in'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white"
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
          />
        </label>
        <label className="text-xs text-zinc-400 space-y-1">
          <span>{fr ? 'Token sortant' : 'Token out'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white"
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value)}
          />
        </label>
        <label className="text-xs text-zinc-400 space-y-1">
          <span>{fr ? 'Montant' : 'Amount'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
          />
        </label>
        <label className="text-xs text-zinc-400 space-y-1 sm:col-span-2 lg:col-span-1">
          <span>{fr ? 'Adresse publique (erd1…)' : 'Public address (erd1…)'}</span>
          <input
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-sm text-white font-mono"
            value={sender}
            onChange={(e) => setSender(e.target.value.trim())}
            placeholder="erd1…"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="rounded-lg bg-amber-600/90 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:opacity-50"
      >
        {busy
          ? fr
            ? 'Préparation…'
            : 'Preparing…'
          : fr
            ? 'Quote → Build → Simulate'
            : 'Quote → Build → Simulate'}
      </button>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
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
          {simOk !== null && (
            <p className={simOk ? 'text-emerald-400' : 'text-red-400'}>
              {fr
                ? simOk
                  ? 'Simulation OK — vous pouvez signer'
                  : 'Simulation échouée — ne pas signer'
                : simOk
                  ? 'Simulation OK — safe to sign'
                  : 'Simulation failed — do not sign'}
            </p>
          )}
          {build.signingLink && simOk !== false && (
            <a
              href={build.signingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-amber-300 hover:bg-white/20"
            >
              {fr ? 'Ouvrir le lien de signature' : 'Open signing link'}
              <span aria-hidden>↗</span>
            </a>
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
          ? 'OneDex MCP · non-custodial · minOut on-chain · xOrus ne signe jamais. Mode autonome non activé.'
          : 'OneDex MCP · non-custodial · on-chain minOut · xOrus never signs. Autonomous mode not enabled.'}
      </p>
    </section>
  )
}
