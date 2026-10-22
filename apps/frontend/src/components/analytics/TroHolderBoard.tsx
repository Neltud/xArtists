import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Ranking holders $TRO + leaderboard NFT xArtists.
 */
import { useEffect, useState } from 'react'
import {
  fetchHolderIndex,
  formatBalance,
  shortAddr,
  type HolderIndexSnapshot,
} from '../../services/analytics/holderService'

export default function TroHolderBoard() {
  const [snap, setSnap] = useState<HolderIndexSnapshot | null>(null)
  const [tab, setTab] = useState<'users' | 'vaults' | 'nft'>('users')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    setLoading(true)
    fetchHolderIndex({ size: 40 })
      .then(s => {
        if (!c) setSnap(s)
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80 font-tech">
            {xaRender("Index $TRO ")}</p>
          <h3 className="text-sm font-semibold text-white">{xaRender("Holders · Vaults · NFT")}</h3>
        </div>
        {xaRender(snap?.accountsCount != null && (
          <span className="text-[11px] text-zinc-400 mono">{xaRender(snap.accountsCount)} {xaRender(" comptes")}</span>
        ))}
      </div>

      <div className="flex gap-1">
        {xaRender((
          [
            ['users', 'Top users'],
            ['vaults', 'SC / pools'],
            ['nft', 'NFT LB'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border ${
              tab === id
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                : 'border-white/10 text-zinc-400'
            }`}
          >
            {xaRender(label)}
          </button>
        )))}
      </div>

      {xaRender(loading && !snap && <p className="text-[12px] text-zinc-500">{xaRender("Indexation…")}</p>)}

      {xaRender(snap && tab === 'users' && (
        <ul className="space-y-1 max-h-64 overflow-y-auto text-[12px]">
          {xaRender(snap.topUsers.slice(0, 20).map(h => (
            <li
              key={h.address}
              className="flex items-center gap-2 border-b border-white/5 py-1.5"
            >
              <span className="text-zinc-600 w-6 mono">#{xaRender(h.rank)}</span>
              <a
                href={`https://explorer.multiversx.com/accounts/${h.address}`}
                target="_blank"
                rel="noreferrer"
                className="mono text-cyan-200/90 hover:underline"
              >
                {xaRender(shortAddr(h.address))}
              </a>
              <span className="ml-auto mono tabular-nums text-zinc-200">
                {xaRender(formatBalance(h.balance))}
              </span>
              <span className="text-zinc-600 mono w-14 text-right">{xaRender(h.sharePct.toFixed(1))}%</span>
            </li>
          )))}
          {xaRender(snap.topUsers.length === 0 && (
            <li className="text-zinc-500">{xaRender("Aucun holder user (API ou filtre SC).")}</li>
          ))}
        </ul>
      ))}

      {xaRender(snap && tab === 'vaults' && (
        <ul className="space-y-1 max-h-64 overflow-y-auto text-[12px]">
          {xaRender(snap.vaults.map(h => (
            <li
              key={h.address}
              className="flex items-center gap-2 border-b border-white/5 py-1.5"
            >
              <span className="text-[10px] rounded border border-amber-500/30 px-1.5 text-amber-200/90">
                {xaRender(h.kind === 'sc-pool' ? 'POOL' : 'SC')}
              </span>
              <span className="text-zinc-300 truncate">{xaRender(h.label || shortAddr(h.address))}</span>
              <span className="ml-auto mono tabular-nums text-zinc-200">
                {xaRender(formatBalance(h.balance))}
              </span>
            </li>
          )))}
          {xaRender(snap.vaults.length === 0 && (
            <li className="text-zinc-500">{xaRender("Aucun vault identifié dans le top.")}</li>
          ))}
        </ul>
      ))}

      {xaRender(snap && tab === 'nft' && (
        <ul className="space-y-1 max-h-64 overflow-y-auto text-[12px]">
          {xaRender(snap.nftLeaderboard.slice(0, 20).map(r => (
            <li
              key={`${r.collection}-${r.address}`}
              className="flex items-center gap-2 border-b border-white/5 py-1.5"
            >
              <span className="text-zinc-600 w-6 mono">#{xaRender(r.rank)}</span>
              <span className="mono text-cyan-200/90">{xaRender(shortAddr(r.address))}</span>
              {xaRender(r.verified && (
                <span className="text-[9px] border border-emerald-500/30 text-emerald-300/90 px-1 rounded">
                  ✓
                </span>
              ))}
              <span className="ml-auto mono tabular-nums text-zinc-200">{xaRender(r.count)} {xaRender(" NFT")}</span>
              <span className="text-zinc-600 text-[10px] truncate max-w-[5rem]">{xaRender(r.collection)}</span>
            </li>
          )))}
          {xaRender(snap.nftLeaderboard.length === 0 && (
            <li className="text-zinc-500 text-[11px]">
              {xaRender("Configure ")}<code className="text-zinc-400">VITE_XARTISTS_NFT_COLLECTIONS</code> {xaRender(" pour le leaderboard. ")}</li>
          ))}
        </ul>
      ))}

      {xaRender(snap?.notes?.[0] && (
        <p className="text-[10px] text-zinc-600">{xaRender(snap.notes[0])}</p>
      ))}
    </div>
  )
}
