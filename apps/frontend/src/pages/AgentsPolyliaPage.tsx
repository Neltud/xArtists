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
        <h1 className="text-2xl font-bold tracking-tight">PolyLIA · Agents</h1>
        <p className="text-zinc-400 text-sm mt-1">Prediction markets (paper) · GreenSmoke · MultiversX</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card title="Régime GreenSmoke">
          <p className="text-3xl font-mono text-emerald-400">{regime}</p>
          <p className="text-xs text-zinc-500 mt-2">updated {gs?.updated_at ?? '—'}</p>
        </Card>
        <Card title="Paper portfolio">
          {paper ? (
            <p className="font-mono text-lg">{(paper.cash ?? 0).toFixed(2)} pUSD · {paper.positions?.length ?? 0} pos</p>
          ) : (
            <p className="text-zinc-500 text-sm">No paper portfolio yet</p>
          )}
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">GreenSmoke agents</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {gs?.agents &&
            Object.values(gs.agents).map((a) => (
              <div key={a.name} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-zinc-500">{a.status}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {a.domain} · conf {((a.confidence_avg || 0) * 100).toFixed(0)}%
                </p>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{title}</h3>
      {children}
    </div>
  )
}
