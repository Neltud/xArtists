import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import TreasuryBanner from '../components/TreasuryBanner'
import PageGuide from '../components/PageGuide'
import { LINKS } from '../config/links'
import DaoLpVotePower from '../components/dao/DaoLpVotePower'

const TRO_ID = 'TRO-94c925'
const API = 'https://api.multiversx.com'
const TRO_MAX_SUPPLY = 500_000

type TroTokenLive = {
  accounts: number
  circulating: number
  price: number
  marketCap: number
  name: string
}

type HolderRow = { address: string; balance: number }

export default function DAO() {
  const { bonData, xartists, prices } = useMultiversX()
  const [troLive, setTroLive] = useState<TroTokenLive | null>(null)
  const [holders, setHolders] = useState<HolderRow[]>([])
  const [holdersErr, setHoldersErr] = useState<string | null>(null)
  const [loadingHolders, setLoadingHolders] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingHolders(true)
      setHoldersErr(null)
      try {
        const [tokRes, accRes] = await Promise.all([
          fetch(`${API}/tokens/${TRO_ID}`, { cache: 'no-cache' }),
          fetch(`${API}/tokens/${TRO_ID}/accounts?size=20&from=0`, { cache: 'no-cache' }),
        ])
        if (!tokRes.ok) throw new Error(`token HTTP ${tokRes.status}`)
        const tok = await tokRes.json()
        const decimals = Number(tok.decimals ?? 6)
        const circRaw = Number(tok.circulatingSupply ?? tok.supply ?? 0)
        const circulating = circRaw / Math.pow(10, decimals)
        if (!cancelled) {
          setTroLive({
            accounts: Number(tok.accounts ?? 0),
            circulating,
            price: Number(tok.price ?? 0),
            marketCap: Number(tok.marketCap ?? 0),
            name: String(tok.name ?? 'TRO'),
          })
        }
        if (accRes.ok) {
          const list = await accRes.json()
          const rows: HolderRow[] = (Array.isArray(list) ? list : []).map((h: any) => ({
            address: String(h.address ?? ''),
            balance: Number(h.balance ?? 0) / Math.pow(10, decimals),
          }))
          if (!cancelled) setHolders(rows.filter(r => r.address))
        }
      } catch (e: any) {
        if (!cancelled) setHoldersErr(e?.message || 'fetch failed')
      } finally {
        if (!cancelled) setLoadingHolders(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const daoActive = bonData?.dao_active ?? false
  const proposalTitle = bonData?.current_proposal_title ?? 'Aucune proposal active'
  const voteResults = bonData?.vote_results ?? {}
  const winningPair = bonData?.winning_pair ?? ''
  const totalVotes = bonData?.total_votes_cast ?? 0
  const recommendedPair = bonData?.recommended_pair ?? 'TRO/WEGLD'
  const troStaked = xartists?.staking?.tro_staking_active ?? false
  const nftStaked = xartists?.staking?.nft_staking_active ?? false
  const nftStakedCount = xartists?.staking?.nft_staked_count ?? 0
  const troBalanceLia = xartists?.tro_token?.balance_wallet ?? 0
  const troValueUsd = xartists?.tro_token?.value_usd ?? 0
  const troPrice = troLive?.price || prices.tro || xartists?.tro_token?.price_usd || 0
  const pairs = Object.entries(voteResults)
  const circ = troLive?.circulating ?? 0
  const supplyPct = TRO_MAX_SUPPLY > 0 ? Math.min(100, (circ / TRO_MAX_SUPPLY) * 100) : 0

  return (
    <div className="animate-fade-in">
      <PageGuide page="dao" />

      <div className="mb-6">
        <h1 className="text-3xl font-black">🗳️ Gouvernance DAO xArtists</h1>
        <p className="text-gray-500 mt-1">
          $TRO live · LP multi-DEX (vote weight) · policy treasury · vote TX pas encore branché
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong>Mode lecture seule (P0 UX).</strong> Pas de bouton « Voter » factice. Holders & supply =
        API mainnet. Vote on-chain = après ABI + sdk-dapp. Yield farming TRO/EGLD ={' '}
        <Link to="/staking" className="underline text-amber-50">
          /staking
        </Link>
        , pas ici.
      </div>

      <div className="mb-6">
        <TreasuryBanner />
      </div>

      <DaoLpVotePower />

      <p className="mb-6 text-xs">
        <a
          href={LINKS.treasuryPolicy}
          target="_blank"
          rel="noreferrer"
          className="text-purple-300 underline"
        >
          docs/TREASURY_POLICY.md ↗
        </a>
      </p>

      <div className="card mb-8 border-purple-500/30 bg-purple-500/5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            $TRO pool live · {TRO_ID}
          </p>
          <a
            href={`${LINKS.explorer}/tokens/${TRO_ID}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-400 hover:text-white"
          >
            Explorer ↗
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Prix</p>
            <p className="text-xl font-bold text-purple-300">
              ${troPrice ? troPrice.toFixed(8) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Holders (wallets)</p>
            <p className="text-xl font-bold">
              {loadingHolders ? '…' : troLive?.accounts?.toLocaleString() ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Circulating</p>
            <p className="text-xl font-bold">
              {circ ? circ.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Market cap</p>
            <p className="text-xl font-bold">
              {troLive?.marketCap
                ? `$${troLive.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : '—'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Supply vs max {TRO_MAX_SUPPLY.toLocaleString()}</span>
            <span>{supplyPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500/80"
              style={{ width: `${supplyPct}%` }}
            />
          </div>
        </div>
      </div>

      {holdersErr && (
        <p className="text-sm text-amber-200 mb-4">Holders: {holdersErr}</p>
      )}

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-3">Top holders $TRO</h2>
        {loadingHolders ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : holders.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun holder listé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                  <th className="text-left py-2">Adresse</th>
                  <th className="text-right py-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {holders.map(h => (
                  <tr key={h.address} className="border-b border-[#2a2a3a]/40">
                    <td className="py-2 mono text-xs">
                      <a
                        href={`${LINKS.explorer}/accounts/${h.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-purple-300"
                      >
                        {h.address.slice(0, 12)}…{h.address.slice(-6)}
                      </a>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {h.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-2">Proposal / votes (paper board)</h2>
        <p className="text-sm text-gray-400 mb-2">
          Status: {daoActive ? 'active' : 'idle'} · {proposalTitle}
        </p>
        <p className="text-xs text-gray-500">
          Votes cast (board): {totalVotes} · winning: {winningPair || '—'} · reco: {recommendedPair}
        </p>
        {pairs.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {pairs.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="tabular-nums">{String(v)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mb-8 text-sm text-gray-400 space-y-2">
        <p>
          Staking SC: TRO {troStaked ? 'on' : 'off'} · NFT {nftStaked ? `on (${nftStakedCount})` : 'off'}
        </p>
        <p>
          Wallet LIA TRO: {troBalanceLia} (~${troValueUsd.toFixed?.(2) ?? troValueUsd})
        </p>
        <p>
          <Link to="/staking" className="text-purple-300 underline">
            Yield TRO/EGLD → /staking
          </Link>
        </p>
      </div>
    </div>
  )
}
