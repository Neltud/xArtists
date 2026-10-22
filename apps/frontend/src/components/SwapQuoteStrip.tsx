import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Aperçu prix pendant la frappe (Sprint 2) — paper only.
 */
import { useEffect, useState } from 'react'
import { quoteSwapPreview } from '../services/aggregatorService'
import type { SwapQuotePreview } from '../types/intent'

function detectPair(q: string): { from: string; to: string; amount: string } | null {
  const lower = q.toLowerCase()
  if (!/swap|échanger|exchange|trade/.test(lower)) return null
  const amount = lower.match(/(\d+(?:[.,]\d+)?)/)?.[1]?.replace(',', '.') || '1'
  let from = 'EGLD'
  let to = 'USDC'
  if (/tro/.test(lower)) from = 'TRO'
  if (/usdc/.test(lower)) to = 'USDC'
  else if (/egld/.test(lower) && /tro/.test(lower)) {
    from = 'TRO'
    to = 'EGLD'
  }
  if (/mex/.test(lower)) from = 'MEX'
  return { from, to, amount }
}

export default function SwapQuoteStrip({ query }: { query: string }) {
  const [quote, setQuote] = useState<SwapQuotePreview | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const pair = detectPair(query)
    if (!pair) {
      setQuote(null)
      setErr(null)
      return
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      quoteSwapPreview(pair.from, pair.to, pair.amount)
        .then(q => {
          if (!cancelled) {
            setQuote(q)
            setErr(q ? null : 'Pas de route')
          }
        })
        .catch(() => {
          if (!cancelled) setErr('Quote offline')
        })
    }, 280)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query])

  if (!detectPair(query)) return null

  return (
    <div className="px-4 pb-2 text-[11px] font-mono border-t border-white/5 pt-2">
      <p className="text-[10px] uppercase tracking-wider text-amber-500/80 mb-1">
        {xaRender("Quote paper · Sprint 2 ")}</p>
      {xaRender(err && <p className="text-rose-400/90">{xaRender(err)}</p>)}
      {xaRender(quote && (
        <div className="text-zinc-300 space-y-0.5">
          <p>
            {xaRender(quote.amountInHuman)} {xaRender(quote.assetFrom)} → ~{xaRender(quote.amountOutHuman)} {xaRender(quote.assetTo)}
          </p>
          <p className="text-zinc-500">
            {xaRender(quote.dex)} {xaRender(" · route ")}{xaRender(quote.route.join('→'))} {xaRender(" · impact ~")}{xaRender(quote.priceImpactBps)} {xaRender(" bps ")}</p>
          <p className="text-amber-200/70">{xaRender("Non exécuté on-chain tant que live OFF")}</p>
        </div>
      ))}
    </div>
  )
}
