import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * DAO — vote weight = LP éligibles (wallet user) + ArtPass staked (paper/NFT).
 * TX vote on-chain pas encore branchée (SC OFF).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useMultiversX } from '../hooks/useMultiversX'
import { requestOpenConnect } from '../lib/walletEvents'
import {
  ELIGIBLE_LP_PAIRS,
  matchEligiblePair,
  isArtPassNft,
} from '../config/lpPools'
import LiaTreasuryPanel from '../components/LiaTreasuryPanel'
import AdSlot from '../components/AdSlot'

const PROPOSALS = [
  {
    id: 'p1',
    title: 'Allouer 10 % des fees treasury → seed progressive slot',
    status: 'paper',
  },
  {
    id: 'p2',
    title: 'Prioriser paire TRO/USDC pour incentives LP',
    status: 'paper',
  },
]

export default function DAO() {
  const { connected, address, shortAddress } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const { xartists, bonData } = useMultiversX()
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no'>>({})

  const lpHoldings = useMemo(() => {
    const tokens = account.tokens || []
    const rows: { pair: string; identifier: string; balance: number }[] = []
    for (const t of tokens) {
      const id = String((t as { identifier?: string }).identifier || '')
      const name = String((t as { name?: string }).name || '')
      const bal = Number((t as { balance?: number }).balance ?? 0)
      const pair = matchEligiblePair(id, name)
      if (pair && bal > 0) {
        rows.push({ pair: pair.label, identifier: id, balance: bal })
      }
    }
    return rows
  }, [account.tokens])

  const artPassCount = useMemo(() => {
    const nfts = account.nfts || []
    return nfts.filter(n =>
      isArtPassNft(
        String((n as { collection?: string }).collection || ''),
        String((n as { name?: string }).name || ''),
      ),
    ).length
  }, [account.nfts])

  // Paper weight: 1 per LP unit normalized + 10 per ArtPass (demo formula)
  const votePower = useMemo(() => {
    const lpW = lpHoldings.reduce((s, r) => s + Math.min(r.balance, 1e6), 0)
    return lpW + artPassCount * 10
  }, [lpHoldings, artPassCount])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('xartists_dao_votes_v1')
      if (raw) setVotes(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  const cast = (id: string, v: 'yes' | 'no') => {
    if (!connected || votePower <= 0) return
    setVotes(prev => {
      const next = { ...prev, [id]: v }
      try {
        localStorage.setItem('xartists_dao_votes_v1', JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div className="animate-fade-in space-y-6 pb-14 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {xaRender("Gouvernance ")}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{xaRender("DAO xArtists")}</h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
          {xaRender("Poids de vote = ")}<strong className="text-zinc-300">{xaRender("LP éligibles")}</strong> {xaRender(" dans ton wallet +")}{xaRender(' ')}
          <strong className="text-zinc-300">{xaRender("ArtPass / NFT staked")}</strong>{xaRender(". Paper — TX on-chain plus tard. ")}</p>
      </header>

      <AdSlot id="market_sidebar" />

      {xaRender(!connected ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5 space-y-3">
          <p className="text-sm text-zinc-400">{xaRender("Connecte ton wallet pour calculer ton poids de vote.")}</p>
          <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
            {xaRender("Connecter ")}</button>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 space-y-2">
          <p className="text-[11px] text-emerald-300/80 font-mono">{xaRender(shortAddress)}</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {xaRender(votePower.toLocaleString('en-US', { maximumFractionDigits: 2 }))}
            <span className="text-sm font-normal text-zinc-500 ml-2">{xaRender("vote power")}</span>
          </p>
          <p className="text-[12px] text-zinc-500">
            {xaRender("LP matchés : ")}{xaRender(lpHoldings.length)} {xaRender(" · ArtPass-like NFT : ")}{xaRender(artPassCount)}
          </p>
        </div>
      ))}

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {xaRender("Pools LP éligibles ")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {xaRender(ELIGIBLE_LP_PAIRS.map(p => (
            <div
              key={p.id}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-center text-[12px] text-zinc-300"
            >
              {xaRender(p.label)}
            </div>
          )))}
        </div>
        {xaRender(lpHoldings.length > 0 && (
          <ul className="text-[12px] text-zinc-400 space-y-1 mt-2">
            {xaRender(lpHoldings.map(r => (
              <li key={r.identifier} className="flex justify-between gap-2 border-t border-white/5 py-1">
                <span className="text-zinc-200">{xaRender(r.pair)}</span>
                <span className="tabular-nums font-mono text-zinc-500">
                  {xaRender(r.balance.toLocaleString('en-US', { maximumFractionDigits: 4 }))}
                </span>
              </li>
            )))}
          </ul>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {xaRender("Proposals (paper) ")}</p>
        {xaRender(PROPOSALS.map(p => (
          <div
            key={p.id}
            className="rounded-xl border border-white/10 bg-zinc-950/50 p-4 space-y-3"
          >
            <p className="text-sm text-white font-medium">{xaRender(p.title)}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!connected || votePower <= 0}
                onClick={() => cast(p.id, 'yes')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                  votes[p.id] === 'yes'
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                    : 'border-white/10 text-zinc-400 hover:border-emerald-500/30'
                } disabled:opacity-40`}
              >
                {xaRender("Oui ")}</button>
              <button
                type="button"
                disabled={!connected || votePower <= 0}
                onClick={() => cast(p.id, 'no')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                  votes[p.id] === 'no'
                    ? 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                    : 'border-white/10 text-zinc-400 hover:border-rose-500/30'
                } disabled:opacity-40`}
              >
                {xaRender("Non ")}</button>
              {xaRender(votes[p.id] && (
                <span className="text-[11px] text-zinc-500 self-center">
                  {xaRender("Vote local enregistré (")}{xaRender(votes[p.id])})
                </span>
              ))}
            </div>
          </div>
        )))}
      </section>

      {xaRender((bonData || xartists) && (
        <p className="text-[11px] text-zinc-600">
          {xaRender("Snapshot ops : ")}{xaRender(bonData?.current_proposal_title || '—')} {xaRender(" · staking NFT")}{xaRender(' ')}
          {xaRender(xartists?.staking?.nft_staked_count ?? 0)}
        </p>
      ))}

      <LiaTreasuryPanel />

      <p className="text-[11px] text-zinc-600">
        <Link to="/lia" className="text-zinc-400 hover:text-white">
          {xaRender("LIA performance ")}</Link>
        {xaRender(' · ')}
        <Link to="/wallet" className="text-zinc-400 hover:text-white">
          {xaRender("Wallet ")}</Link>
        {xaRender(' · ')}
        <Link to="/staking" className="text-zinc-400 hover:text-white">
          {xaRender("Staking ")}</Link>
      </p>
    </div>
  )
}
