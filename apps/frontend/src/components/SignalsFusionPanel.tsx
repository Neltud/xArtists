import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type Fusion = {
  updated?: string
  fused?: {
    decision?: string
    confidence?: number
    source?: string
    external_norm?: number
    external_weight_sum?: number
  }
  legs?: {
    gsn?: { n_elite?: number; bias?: string; gsn_weight?: number; top_avg_accuracy?: number }
    polymarket?: { bias?: string; weight?: number; n?: number }
    free_feeds?: { bias?: string; weight?: number; n?: number }
    social?: { bias?: string; weight?: number; n?: number; rumor_flag?: boolean }
  }
  note?: string
}

export default function SignalsFusionPanel() {
  const [data, setData] = useState<Fusion | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const urls = [
        `${import.meta.env.BASE_URL}data/lia_signal_fusion.json?t=${Date.now()}`,
        `${RAW}/data/lia_signal_fusion.json?t=${Date.now()}`,
      ]
      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as Fusion
          if (!cancelled) {
            setData(j)
            setErr(null)
          }
          return
        } catch {
          /* next */
        }
      }
      if (!cancelled) setErr('fusion offline — python -m lia.signals.fusion')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const f = data?.fused
  const legs = data?.legs

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold">Signaux fusionnés (advisory)</h2>
          <p className="text-xs text-gray-500 mt-1">
            GSN ≥80% · Polymarket (hors MVX) · feeds gratuits · social — jamais seul pour exécuter
          </p>
        </div>
        <span className="badge-gray text-[10px]">PAPER · {data?.updated?.slice(0, 19) || '—'}</span>
      </div>
      {err && <p className="text-xs text-amber-400 mb-2">{err}</p>}
      {f && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">Decision</p>
            <p className="font-black text-lg">{f.decision || 'WAIT'}</p>
          </div>
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">Conf</p>
            <p className="mono font-bold">{f.confidence ?? '—'}</p>
          </div>
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">Source</p>
            <p className="text-xs text-purple-300 break-all">{f.source || '—'}</p>
          </div>
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">Ext weight</p>
            <p className="mono font-bold">{f.external_weight_sum ?? '—'}</p>
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <Leg
          title="GSN elite"
          bias={legs?.gsn?.bias}
          extra={
            legs?.gsn
              ? `n=${legs.gsn.n_elite ?? 0} w=${legs.gsn.gsn_weight ?? 0} acc=${legs.gsn.top_avg_accuracy ?? '—'}`
              : '—'
          }
        />
        <Leg
          title="Polymarket"
          bias={legs?.polymarket?.bias}
          extra={legs?.polymarket ? `n=${legs.polymarket.n ?? 0} w=${legs.polymarket.weight ?? 0}` : '—'}
        />
        <Leg
          title="Free feeds"
          bias={legs?.free_feeds?.bias}
          extra={legs?.free_feeds ? `n=${legs.free_feeds.n ?? 0} w=${legs.free_feeds.weight ?? 0}` : '—'}
        />
        <Leg
          title="Social"
          bias={legs?.social?.bias}
          extra={
            legs?.social
              ? `n=${legs.social.n ?? 0}${legs.social.rumor_flag ? ' · RUMOR' : ''}`
              : '—'
          }
        />
      </div>
      <p className="text-[10px] text-gray-600 mt-3">
        {data?.note || 'Guardian + Intent obligatoires avant tout size live.'}
      </p>
    </div>
  )
}

function Leg({ title, bias, extra }: { title: string; bias?: string; extra: string }) {
  const color =
    bias === 'BUY' ? 'text-green-400' : bias === 'SELL' ? 'text-red-400' : 'text-gray-400'
  return (
    <div className="rounded-lg border border-[#2a2a3a] bg-[#0d0d14] p-2">
      <p className="text-[10px] uppercase text-gray-500">{title}</p>
      <p className={`font-bold ${color}`}>{bias || 'WAIT'}</p>
      <p className="text-gray-500 mt-0.5">{extra}</p>
    </div>
  )
}
