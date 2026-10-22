import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** RWA catalog — physical works + AI valuation proxy (paper). */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../lib/safeRender'
import PhysicalNftCertifier from '../components/PhysicalNftCertifier'

type Item = {
  id?: string
  title?: string
  artist?: string
  style?: string
  condition?: string
  shipment_status?: string
  listed?: boolean
  valuation?: {
    score?: number
    price_proxy_usd?: number
    momentum?: number
    disclaimer?: string
  }
  certificate_hash?: string
}

async function loadCatalog(): Promise<Item[]> {
  const bases = [
    `${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}rwa_catalog.json`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json()
      return Array.isArray(j.items) ? j.items : []
    } catch {
      /* */
    }
  }
  return []
}

export default function RwaCatalogPage() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    let c = false
    ;(async () => {
      const list = await loadCatalog()
      if (!c) setItems(list)
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto pb-16">
      <header>
        <p className="section-label">{xaRender("RWA")}</p>
        <h1 className="section-title display text-2xl">{xaRender("Physical · Digital")}</h1>
        <p className="text-sm text-zinc-400">
          {xaRender("AI valuation proxy + shipment status. Not a formal appraisal. Mint/sell remain HITL. ")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {xaRender(items.map(it => {
          const score = Number(it.valuation?.score ?? 0)
          return (
            <article
              key={asText(it.id)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
            >
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-600 text-xs">
                {xaRender(asText(it.style, 'artwork'))}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{xaRender(asText(it.title))}</h2>
                <p className="text-[12px] text-zinc-400">{xaRender(asText(it.artist))}</p>
              </div>
              <div>
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  <span>{xaRender("AI valuation")}</span>
                  <span>{xaRender(asText(score.toFixed(0)))} / 100</span>
                </div>
                <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-400"
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
                <p className="text-[12px] tabular-nums text-zinc-300 mt-1">
                  {xaRender("Proxy $")}{xaRender(asText(it.valuation?.price_proxy_usd))} {xaRender(" · momentum")}{xaRender(' ')}
                  {xaRender(asText(it.valuation?.momentum))}
                </p>
              </div>
              <p className="text-[11px] text-zinc-500">
                {xaRender("Shipment: ")}<span className="text-zinc-300">{xaRender(asText(it.shipment_status, '—'))}</span>
                {xaRender(it.listed ? ' · listed' : '')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/marketplace" className="btn-secondary text-[11px]">
                  {xaRender("Market ")}</Link>
                <Link to="/studio" className="btn-secondary text-[11px]">
                  {xaRender("Studio mint ")}</Link>
              </div>
              <p className="text-[9px] text-zinc-600 mono truncate">
                {xaRender("cert ")}{xaRender(asText(it.certificate_hash?.slice(0, 16)))}…
              </p>
            </article>
          )
        }))}
        {xaRender(!items.length && (
          <p className="text-zinc-500 text-sm col-span-2">{xaRender("Catalog empty — run rwa_evaluator --reassess")}</p>
        ))}
      </div>

      <section className="space-y-2 border-t border-white/10 pt-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{xaRender("Certification phygital")}</p>
        <PhysicalNftCertifier />
      </section>

      <p className="text-[10px] text-zinc-600 border-t border-white/5 pt-3">
        {xaRender("Paper valuations · physical logistics simulated · LIA_LIVE_TRADING=0 ")}</p>
      <Link to="/lia" className="btn-secondary text-sm">
        {xaRender("← LIA hub ")}</Link>
    </div>
  )
}
