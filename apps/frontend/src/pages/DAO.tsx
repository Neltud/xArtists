import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import TreasuryBanner from '../components/TreasuryBanner'
import PageGuide from '../components/PageGuide'
import { LINKS } from '../config/links'

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
          $TRO live · policy treasury · vote TX pas encore branché
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong>Mode lecture seule (P0 UX).</strong> Pas de bouton « Voter » factice. Holders & supply =
        API mainnet. Vote on-chain = après ABI + sdk-dapp. $TRO n’est <strong>pas</strong> une share du
        fonds.
      </div>

      <div className="mb-6">
        <TreasuryBanner />
      </div>

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
            <p className="text-[10px] text-gray-500">cap produit {TRO_MAX_SUPPLY.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Market cap</p>
            <p className="text-xl font-bold">
              {troLive?.marketCap != null ? `$${troLive.marketCap.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>Supply vs cap 500k</span>
            <span>{supplyPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500"
              style={{ width: `${supplyPct}%` }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={LINKS.xexchangeTroUsdc} target="_blank" rel="noreferrer" className="btn-primary text-sm">
            Buy $TRO ↗
          </a>
          <Link to="/studio" className="btn-secondary text-sm">
            Studio mint
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Statut données</p>
          <p className="text-xl font-bold">{daoActive ? '🟢 Live JSON' : '⏸️ Standby'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">TRO Staking signal</p>
          <p className="text-xl font-bold">{troStaked ? '✅' : '⏳'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Votes (JSON)</p>
          <p className="text-xl font-bold">{Number(totalVotes).toFixed(2)} TRO</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Reco LIA</p>
          <p className="text-xl font-bold text-yellow-400">{recommendedPair}</p>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-2">Top holders $TRO (mainnet)</h2>
        <p className="text-xs text-gray-500 mb-4">
          Source API <code>/tokens/{TRO_ID}/accounts</code> — pas le contrat de vote.
        </p>
        {holdersErr && <p className="text-sm text-red-400 mb-2">{holdersErr}</p>}
        {loadingHolders ? (
          <p className="text-gray-500 text-sm">Chargement…</p>
        ) : holders.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun holder listé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a3a]">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Wallet</th>
                  <th className="py-2 text-right">Balance TRO</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((h, i) => (
                  <tr key={h.address} className="border-b border-[#1a1a24]">
                    <td className="py-2 pr-2 text-gray-500">{i + 1}</td>
                    <td className="py-2 pr-2 mono text-xs">
                      <a
                        href={LINKS.explorerAccount(h.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-purple-300"
                      >
                        {h.address.slice(0, 12)}…{h.address.slice(-6)}
                      </a>
                    </td>
                    <td className="py-2 text-right font-semibold">
                      {h.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-8 border-purple-500/20">
        <p className="text-xs text-gray-500 mb-1">Balance LIA Ops — distincte de votre wallet Connect</p>
        <p className="text-xl font-bold">{troBalanceLia.toFixed(2)} TRO</p>
        <p className="text-xs text-gray-500">
          ≈ ${troValueUsd.toFixed(2)} · NFT staking {nftStaked ? '✅' : '⏳'}{' '}
          {nftStakedCount > 0 && `(${nftStakedCount})`}
        </p>
      </div>

      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="text-lg font-bold">Proposal (aperçu JSON)</h2>
            <p className="text-sm text-gray-400">{proposalTitle}</p>
          </div>
        </div>
        {pairs.length > 0 ? (
          <div className="space-y-3">
            {pairs.map(([pair, data]: [string, any]) => {
              const votes = data.votes ?? 0
              const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
              const isWinning = pair === winningPair
              return (
                <div
                  key={pair}
                  className={`p-4 rounded-xl border ${
                    isWinning ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-[#2a2a3a] bg-[#111118]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">
                      {pair} {isWinning && '🏆'}
                    </span>
                    <span className="text-sm text-gray-400">
                      {pct.toFixed(1)}% ({Number(votes).toFixed(2)} TRO)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: isWinning
                          ? 'linear-gradient(90deg, #d97706, #dc2626)'
                          : 'linear-gradient(90deg, #7c3aed, #2563eb)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.description} · Risque: {data.risk}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune proposal JSON chargée</p>
            <p className="text-sm mt-1">Les holders $TRO ci-dessus restent live via API</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-2">Contrats (référence)</h2>
        <p className="text-xs text-red-300/90 mb-4">
          Audit on-chain : adresses governance / staking = <strong>comptes vides</strong> (0 EGLD).
          Ne pas y envoyer de fonds tant que codeHash non vérifié.
        </p>
        <div className="space-y-2">
          {[
            {
              name: 'TRO Governance',
              addr: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8',
            },
            {
              name: 'NFT Staking',
              addr: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl',
            },
          ].map(c => (
            <div key={c.addr} className="flex items-center justify-between p-3 rounded-lg bg-[#111118]">
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs mono text-gray-500">{c.addr.slice(0, 28)}…</p>
              </div>
              <a
                href={LINKS.explorerAccount(c.addr)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Explorer
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
