import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Marché RWA — œuvres physiques uniquement (dimensions, médium, NFC, certificat on-chain).
 * Pas de Frameit / Xoxno / SFT génériques.
 */
import { useCallback, useEffect, useState } from 'react'

type RwaItem = {
  id: string
  title: string
  artist?: string
  style?: string
  medium?: string
  year?: number | string
  condition?: string
  provenance?: string
  certificate_hash?: string
  shipment_status?: string
  dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number }
  nfc_chip_id?: string
  valuation?: { score?: number; price_proxy_usd?: number }
}

type Catalog = { items?: RwaItem[]; updated?: string }

function publicDataUrl(file: string): string {
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/'
  return `${base.replace(/\/?$/, '/')}${file.replace(/^\//, '')}`
}

export default function RwaMarketPanel() {
  const [items, setItems] = useState<RwaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch(publicDataUrl('data/rwa_catalog.json'), { cache: 'no-store' })
      if (!r.ok) throw new Error(`catalog ${r.status}`)
      const j = (await r.json()) as Catalog
      setItems(Array.isArray(j.items) ? j.items : [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'catalogue indisponible')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-white">{xaRender("Art physique · RWA")}</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
        >
          {xaRender("Actualiser ")}</button>
      </div>

      {xaRender(loading && <p className="text-sm text-white/50">{xaRender("Chargement du catalogue…")}</p>)}
      {xaRender(err && <p className="text-sm text-rose-300">{xaRender(err)}</p>)}

      {xaRender(!loading && items.length === 0 && !err && (
        <p className="text-sm text-zinc-500">{xaRender("Aucune œuvre physique référencée pour le moment.")}</p>
      ))}

      <div className="grid gap-3 sm:grid-cols-2">
        {xaRender(items.map(it => (
          <article
            key={it.id}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4"
          >
            <h3 className="text-sm font-semibold text-white">{xaRender(it.title)}</h3>
            <p className="mt-0.5 text-[12px] text-zinc-400">{xaRender(it.artist || '—')}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <div>
                <dt className="text-zinc-500">{xaRender("Médium")}</dt>
                <dd className="text-zinc-200">{xaRender(it.medium || it.style || '—')}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{xaRender("Année")}</dt>
                <dd className="text-zinc-200">{xaRender(it.year ?? '—')}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{xaRender("Provenance")}</dt>
                <dd className="text-zinc-200">{xaRender(it.provenance || '—')}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">{xaRender("Statut")}</dt>
                <dd className="text-zinc-200">{xaRender(it.shipment_status || it.condition || '—')}</dd>
              </div>
              {xaRender(it.dimensions && (
                <div className="col-span-2">
                  <dt className="text-zinc-500">{xaRender("Dimensions")}</dt>
                  <dd className="text-zinc-200">
                    {xaRender([it.dimensions.widthCm, it.dimensions.heightCm, it.dimensions.depthCm]
                      .filter(v => v != null)
                      .join(' × '))}{xaRender(' ')}
                    cm
                  </dd>
                </div>
              ))}
              {xaRender(it.nfc_chip_id && (
                <div className="col-span-2">
                  <dt className="text-zinc-500">{xaRender("Puce NFC")}</dt>
                  <dd className="font-mono text-zinc-200">{xaRender(it.nfc_chip_id)}</dd>
                </div>
              ))}
              {xaRender(it.certificate_hash && (
                <div className="col-span-2">
                  <dt className="text-zinc-500">{xaRender("Certificat on-chain")}</dt>
                  <dd className="break-all font-mono text-[10px] text-cyan-200/90">{xaRender(it.certificate_hash)}</dd>
                </div>
              ))}
            </dl>
          </article>
        )))}
      </div>
    </section>
  )
}
