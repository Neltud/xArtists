import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../../i18n/phraseRuntime'
/** Decision-chain proposals — SIGN disabled while LIA_LIVE_TRADING=0. */
import { useEffect, useState } from 'react'
import { asText } from '../../lib/safeRender'

type Prop = {
  id?: string
  status?: string
  action_type?: string
  pair?: string
  amount_egld?: number
  amount_usd?: number
  strategy?: string
  reason?: string
  gas_total?: number
  slippage?: { expected_usdc?: number; min_out_usdc?: number; guard_bps?: number }
  broadcast?: boolean
  sign_enabled?: boolean
}

export default function ProposedActions() {
  xaUsePhraseLocale()

  const [items, setItems] = useState<Prop[]>([])
  const [meta, setMeta] = useState<{ ready_to_sign?: number; cycles?: number }>({})

  useEffect(() => {
    let c = false
    ;(async () => {
      const bases = [
        `${import.meta.env.BASE_URL || '/'}data/`,
        'https://neltud.github.io/xArtists/data/',
      ]
      for (const b of bases) {
        try {
          const r = await fetch(`${b}decision_proposals.json`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          if (c) return
          setItems(Array.isArray(j.proposals) ? j.proposals : [])
          setMeta({ ready_to_sign: j.ready_to_sign, cycles: j.cycles })
          return
        } catch {
          /* */
        }
      }
    })()
    return () => {
      c = true
    }
  }, [])

  // Locked on purpose: this button has no signer. A static page must not look like it broadcasts,
  // even when VITE_LIA_LIVE_TRADING arms the separate xPortal user-sign path.
  const live = false

  return (
    <section className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-3 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-[10px] uppercase tracking-wider text-sky-200/90 font-semibold">
          {xaRender("Proposed actions ")}</p>
        <span className="text-[9px] text-zinc-500">
          {xaRender(asText(meta.ready_to_sign))}/{xaRender(asText(meta.cycles))} {xaRender(" ready · no broadcast ")}</span>
      </div>
      {xaRender(items.filter(p => p.status === 'ready_to_sign' || p.status === 'blocked').map(p => (
        <div key={asText(p.id)} className="rounded-lg bg-black/40 border border-white/5 p-2 space-y-1">
          <div className="flex flex-wrap gap-2 items-center text-[11px]">
            <span className="font-bold text-sky-300">{xaRender(asText(p.action_type))}</span>
            <span className="text-zinc-400">{xaRender(asText(p.pair))}</span>
            <span className="tabular-nums text-white">
              {xaRender(asText(p.amount_egld))} {xaRender(" EGLD (~$")}{xaRender(asText(p.amount_usd))})
            </span>
            <span
              className={`text-[9px] uppercase font-bold ${
                p.status === 'ready_to_sign' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {xaRender(asText(p.status))}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500">{xaRender("Why: ")}{xaRender(asText(p.reason))}</p>
          <p className="text-[10px] text-zinc-600">
            {xaRender("Gas ~")}{xaRender(asText(p.gas_total))} {xaRender(" · min USDC ")}{xaRender(asText(p.slippage?.min_out_usdc))} {xaRender(" · guard")}{xaRender(' ')}
            {xaRender(asText(p.slippage?.guard_bps))} {xaRender(" bps ")}</p>
          <button
            type="button"
            disabled={!live}
            className={`text-[11px] px-2 py-1 rounded border ${
              live
                ? 'border-emerald-500/40 text-emerald-300'
                : 'border-white/10 text-zinc-600 cursor-not-allowed'
            }`}
            title={xaLocalize("Requires LIA_LIVE_TRADING=1 + ops executor")}
          >
            {xaRender("Sign & broadcast (locked) ")}</button>
        </div>
      )))}
      {xaRender(!items.length && (
        <p className="text-[11px] text-zinc-600">
          {xaRender("Run ")}<code className="text-zinc-400">python -m lia.genesis.decision_chain</code>
        </p>
      ))}
    </section>
  )
}
