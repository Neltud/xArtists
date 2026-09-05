/**
 * Pouvoir de vote DAO — LP TRO sur xExchange · OneDex · JExchange.
 * Lecture seule / paper jusqu’au SC governance.
 */
import { useEffect, useState } from 'react'
import {
  TRO_VOTE_POOLS,
  DEX_LABEL,
  lpUsdToVotePower,
  type TroPool,
} from '../../config/troPools'
import { loadVotePoolTvls } from '../../lib/troPoolStats'
import { getEgldPrice } from '../../services/priceService'

export default function DaoLpVotePower() {
  const [tvls, setTvls] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      try {
        const egld = (await getEgldPrice()) || 0
        const m = await loadVotePoolTvls(TRO_VOTE_POOLS, egld)
        if (!c) setTvls(m)
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const totalTvl = Object.values(tvls).reduce<number>((s, v) => s + (v ?? 0), 0)
  const totalVoteUnits = lpUsdToVotePower(totalTvl)

  return (
    <section className="card mb-8 border-cyan-500/25 bg-cyan-500/[0.04] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/80">
            Pouvoir de vote · LP multi-DEX
          </p>
          <h2 className="text-lg font-semibold text-white mt-1">TRO pools → vote weight</h2>
          <p className="text-[13px] text-zinc-400 mt-1 max-w-xl">
            xExchange · OneDex · JExchange. Poids paper = valeur LP USD (1 $ ≈ 1 unité) jusqu’au
            smart contract governance. <strong className="text-zinc-300">Pas de yield ici</strong> —
            le farming est sur /staking.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-600 uppercase">TVL pools (est.)</p>
          <p className="text-xl font-semibold text-cyan-300 tabular-nums">
            {loading ? '…' : `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            ~{totalVoteUnits.toLocaleString('en-US', { maximumFractionDigits: 0 })} vote units
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TRO_VOTE_POOLS.map((p: TroPool) => {
          const tvl = tvls[p.id]
          return (
            <article
              key={p.id}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {DEX_LABEL[p.dex]}
                  </p>
                  <p className="font-medium text-white">{p.pair}</p>
                </div>
                <span className="text-[10px] rounded-full border border-white/10 px-2 py-0.5 text-zinc-400">
                  vote
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">{p.note}</p>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase">TVL</p>
                  <p className="tabular-nums text-emerald-400 font-medium">
                    {tvl != null
                      ? `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                      : p.address
                        ? '—'
                        : 'à confirmer'}
                  </p>
                </div>
                {p.lpTokenId && (
                  <p className="text-[10px] mono text-zinc-600">{p.lpTokenId}</p>
                )}
                <a
                  href={p.swapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400/90 hover:underline"
                >
                  DEX ↗
                </a>
              </div>
            </article>
          )
        })}
      </div>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Holders $TRO + liquidité sur ces pools alimentent le poids de gouvernance (design). TX de
        vote = post-ABI. Yield farming TRO/EGLD : page Staking.
      </p>
    </section>
  )
}
