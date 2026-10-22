import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Pouvoir de vote DAO — pools LP TRO (xExchange · OneDex · JExchange).
 * Lecture seule. Yield farming reste sur /staking (pas ici).
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
import { useWallet } from '../../context/WalletContext'

type Row = {
  pool: TroPool
  tvlUsd: number | null
  voteUnits: number
}

async function fetchUserLpHints(address: string): Promise<{ token: string; balance: number }[]> {
  try {
    const r = await fetch(
      `https://api.multiversx.com/accounts/${address}/tokens?size=200`,
      { cache: 'no-store' }
    )
    if (!r.ok) return []
    const list = (await r.json()) as Array<{ identifier?: string; balance?: string; decimals?: number }>
    return (Array.isArray(list) ? list : [])
      .filter(t => {
        const id = (t.identifier || '').toUpperCase()
        return id.includes('TRO') && (id.includes('WEGLD') || id.includes('EGLD') || id.includes('USDC') || id.includes('LP'))
      })
      .map(t => ({
        token: t.identifier || '',
        balance: Number(t.balance || 0) / 10 ** (t.decimals ?? 18),
      }))
      .filter(x => x.balance > 0)
  } catch {
    return []
  }
}

export default function TroLpVotePanel() {
  const { connected, address } = useWallet()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [userLp, setUserLp] = useState<{ token: string; balance: number }[]>([])

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

        if (connected && address) {
          const lp = await fetchUserLpHints(address)
          if (!c) setUserLp(lp)
        } else if (!c) {
          setUserLp([])
        }
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [connected, address])

  const totalVote = rows.reduce((s, r) => s + r.voteUnits, 0)

  return (
    <div className="card mb-8 border-fuchsia-500/25 bg-fuchsia-500/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300/90">
            {xaRender("Pouvoir de vote · LP TRO ")}</p>
          <h2 className="text-lg font-bold text-white mt-1">{xaRender("xExchange · OneDex · JExchange")}</h2>
        </div>
        <Link
          to="/staking"
          className="text-xs text-zinc-400 hover:text-white underline-offset-2 hover:underline"
        >
          {xaRender("Yield farming (hors DAO) → ")}</Link>
      </div>

      <p className="text-[12px] text-zinc-400 mb-4 leading-relaxed">
        {xaRender("Pondération paper : liquidité TRO en pool multi-DEX renforce le poids de vote. Holders $TRO = base. ")}<strong className="text-zinc-300">{xaRender("Yield / farms = page Staking")}</strong>{xaRender(", pas ici. Vote TX on-chain = après SC governance. ")}</p>

      {xaRender(loading ? (
        <p className="text-sm text-zinc-500">{xaRender("Chargement pools…")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
                <th className="py-2 pr-2">{xaRender("DEX")}</th>
                <th className="py-2 pr-2">{xaRender("Pair")}</th>
                <th className="py-2 pr-2 text-right">{xaRender("TVL est.")}</th>
                <th className="py-2 text-right">{xaRender("Vote units")}</th>
              </tr>
            </thead>
            <tbody>
              {xaRender(rows.map(({ pool, tvlUsd, voteUnits }) => (
                <tr key={pool.id} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-2 text-zinc-300">{xaRender(DEX_LABEL[pool.dex])}</td>
                  <td className="py-2.5 pr-2">
                    <span className="text-white font-medium">{xaRender(pool.pair)}</span>
                    {xaRender(pool.lpTokenId && (
                      <span className="block text-[10px] mono text-zinc-600">{xaRender(pool.lpTokenId)}</span>
                    ))}
                    {xaRender(pool.note && (
                      <span className="block text-[10px] text-zinc-600 mt-0.5">{xaRender(pool.note)}</span>
                    ))}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-zinc-300">
                    {xaRender(tvlUsd != null
                      ? `$${tvlUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                      : '—')}
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-fuchsia-300">
                    {xaRender(voteUnits > 0
                      ? voteUnits.toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : '—')}
                  </td>
                </tr>
              )))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td colSpan={3} className="py-3 text-zinc-500 text-xs">
                  {xaRender("Total unités pool (paper · écosystème) ")}</td>
                <td className="py-3 text-right font-bold text-white tabular-nums">
                  {xaRender(totalVote > 0
                    ? totalVote.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : '—')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {xaRender(connected && address && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{xaRender("Votre LP TRO")}</p>
          {xaRender(userLp.length === 0 ? (
            <p className="text-[12px] text-zinc-500">
              {xaRender("Aucun LP TRO détecté sur ce wallet. Ajoutez de la liquidité sur un DEX listé pour renforcer le poids (paper). ")}</p>
          ) : (
            <ul className="space-y-1">
              {xaRender(userLp.map(u => (
                <li key={u.token} className="text-[12px] text-zinc-300 flex justify-between gap-2">
                  <span className="mono text-zinc-400 truncate">{xaRender(u.token)}</span>
                  <span className="tabular-nums text-white">{xaRender(u.balance.toFixed(4))}</span>
                </li>
              )))}
            </ul>
          ))}
        </div>
      ))}

      <div className="mt-4 flex flex-wrap gap-2">
        {xaRender(TRO_VOTE_POOLS.filter(p => p.swapUrl).map(p => (
          <a
            key={p.id}
            href={p.swapUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs"
          >
            {xaRender(DEX_LABEL[p.dex])} ↗
          </a>
        )))}
        <a
          href={`${LINKS.explorer}/tokens/TRO-94c925`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-xs"
        >
          {xaRender("Explorer TRO ")}</a>
        <Link to="/staking" className="btn-secondary text-xs">
          {xaRender("Staking yield ")}</Link>
      </div>
    </div>
  )
}
