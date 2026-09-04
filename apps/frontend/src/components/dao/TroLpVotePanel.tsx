/**
 * Pouvoir de vote DAO basé sur les pools LP TRO (multi-DEX).
 * Lecture seule — pas de vote TX factice.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TRO_VOTE_POOLS,
  DEX_LABEL,
  lpUsdToVotePower,
  type TroPool,
} from '../../config/troPools'
import { fetchMexTroPairs, fetchPoolAccountTvl, matchLive, type PoolLive } from '../../lib/troPoolStats'
import { getEgldPrice } from '../../services/priceService'
import { LINKS } from '../../config/links'

type Row = {
  pool: TroPool
  tvlUsd: number | null
  voteUnits: number
}

export default function TroLpVotePanel() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      try {
        const [mex, egld] = await Promise.all([fetchMexTroPairs(), getEgldPrice()])
        if (c) return
        const out: Row[] = []
        for (const p of TRO_VOTE_POOLS) {
          const live = matchLive(p, mex)
          let tvl = live?.tvlUsd ?? null
          if (tvl == null && p.address) {
            tvl = await fetchPoolAccountTvl(p.address, egld || 0)
          }
          const voteUnits = tvl != null ? lpUsdToVotePower(tvl) : 0
          out.push({ pool: p, tvlUsd: tvl, voteUnits })
        }
        if (!c) setRows(out)
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const totalVote = rows.reduce((s, r) => s + r.voteUnits, 0)

  return (
    <div className="card mb-8 border-fuchsia-500/25 bg-fuchsia-500/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300/90">
            Pouvoir de vote · LP TRO
          </p>
          <h2 className="text-lg font-bold text-white mt-1">xExchange · OneDex · JExchange</h2>
        </div>
        <Link to="/staking" className="text-xs text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Yield farming →
        </Link>
      </div>

      <p className="text-[12px] text-zinc-400 mb-4 leading-relaxed">
        Pondération paper : 1 USD de liquidité TRO en pool ≈ 1 unité de vote. Les holders $TRO restent
        la base ; les LP multi-DEX renforcent le poids. Vote TX = après SC governance.
      </p>

      {loading ? (
        <p className="text-sm text-zinc-500">Chargement pools…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
                <th className="py-2 pr-2">DEX</th>
                <th className="py-2 pr-2">Pair</th>
                <th className="py-2 pr-2 text-right">TVL est.</th>
                <th className="py-2 text-right">Vote units</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ pool, tvlUsd, voteUnits }) => (
                <tr key={pool.id} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-2 text-zinc-300">{DEX_LABEL[pool.dex]}</td>
                  <td className="py-2.5 pr-2">
                    <span className="text-white font-medium">{pool.pair}</span>
                    {pool.lpTokenId && (
                      <span className="block text-[10px] mono text-zinc-600">{pool.lpTokenId}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-zinc-300">
                    {tvlUsd != null
                      ? `$${tvlUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                      : '—'}
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-fuchsia-300">
                    {voteUnits > 0 ? voteUnits.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td colSpan={3} className="py-3 text-zinc-500 text-xs">
                  Total unités (paper)
                </td>
                <td className="py-3 text-right font-bold text-white tabular-nums">
                  {totalVote > 0 ? totalVote.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {TRO_VOTE_POOLS.filter(p => p.swapUrl).map(p => (
          <a
            key={p.id}
            href={p.swapUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs"
          >
            {DEX_LABEL[p.dex]} ↗
          </a>
        ))}
        <a
          href={`${LINKS.explorer}/tokens/TRO-94c925`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-xs"
        >
          Explorer TRO
        </a>
      </div>
    </div>
  )
}
