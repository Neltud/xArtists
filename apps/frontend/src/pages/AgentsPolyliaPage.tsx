import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
import { useEffect, useState, type ReactNode } from 'react'

type PaperPortfolio = {
  cash?: number
  positions?: Array<{ side: string; size: number; avgPrice: number; marketId: string }>
  totalPnl?: number
  updatedAt?: string
}

type GsPayload = {
  updated_at?: string
  aggregated_signals?: { regime?: string }
  agents?: Record<string, { name: string; domain: string; confidence_avg: number; status: string }>
}

const BASE = import.meta.env.BASE_URL || '/'

export default function AgentsPolyliaPage() {
  xaUsePhraseLocale()

  const [paper, setPaper] = useState<PaperPortfolio | null>(null)
  const [gs, setGs] = useState<GsPayload | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [p, g] = await Promise.all([
          fetch(`${BASE}data/paper_portfolio.json`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${BASE}data/greensmoke_forecasts.json`).then((r) => (r.ok ? r.json() : null)),
        ])
        setPaper(p)
        setGs(g)
      } catch {
        /* ignore */
      }
    }
    load()
  }, [])

  const regime = gs?.aggregated_signals?.regime ?? '—'

  return (
    <div className="min-h-[50vh] text-zinc-100">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{xaRender("PolyLIA · Agents")}</h1>
        <p className="text-zinc-400 text-sm mt-1">{xaRender("Prediction markets (paper) · GreenSmoke · MultiversX")}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card title={xaLocalize("Régime GreenSmoke")}>
          <p className="text-3xl font-mono text-emerald-400">{xaRender(regime)}</p>
          <p className="text-xs text-zinc-500 mt-2">{xaRender("updated ")}{xaRender(gs?.updated_at ?? '—')}</p>
        </Card>
        <Card title={xaLocalize("Paper portfolio")}>
          {xaRender(paper ? (
            <p className="font-mono text-lg">{xaRender((paper.cash ?? 0).toFixed(2))} {xaRender(" pUSD · ")}{xaRender(paper.positions?.length ?? 0)} {xaRender(" pos")}</p>
          ) : (
            <p className="text-zinc-500 text-sm">{xaRender("No paper portfolio yet")}</p>
          ))}
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">{xaRender("GreenSmoke agents")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {xaRender(gs?.agents &&
            Object.values(gs.agents).map((a) => (
              <div key={a.name} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{xaRender(a.name)}</span>
                  <span className="text-xs text-zinc-500">{xaRender(a.status)}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {xaRender(a.domain)} {xaRender(" · conf ")}{xaRender(((a.confidence_avg || 0) * 100).toFixed(0))}%
                </p>
              </div>
            )))}
        </div>
      </section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{xaRender(title)}</h3>
      {xaRender(children)}
    </div>
  )
}
