/**
 * DAO governance UI — voting power = TRO staked + SFT/NFT staked units.
 * Votes recorded locally + intent for SC when canVoteDao().
 */
import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { canVoteDao, TRO_GOVERNANCE_ADDRESS } from '../config/scStatus'
import { useTroStakedBalance } from '../hooks/useTroStakedBalance'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

type Proposal = {
  id: string
  title: string
  body: string
  status: 'active' | 'closed'
  yes: number
  no: number
}

const STORAGE_KEY = 'xartists_dao_votes_v1'
const SFT_STAKE_KEY = 'xartists_nft_stake_units_v1'

const DEFAULT_PROPOSALS: Proposal[] = [
  {
    id: 'p1',
    title: 'Activer fee market 250 bps → treasury split',
    body: 'Orienter 50% des fees market vers le splitter une fois destination configurée.',
    status: 'active',
    yes: 0,
    no: 0,
  },
  {
    id: 'p2',
    title: 'Ouvrir REAL Slot (isPayable) après audit',
    body: 'Passer le spin EGLD en payable uniquement après checklist sécurité.',
    status: 'active',
    yes: 0,
    no: 0,
  },
]

function loadVotes(): Record<string, 'yes' | 'no'> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, 'yes' | 'no'>
  } catch {
    return {}
  }
}

function loadSftUnits(): number {
  try {
    const n = Number(localStorage.getItem(SFT_STAKE_KEY) || '0')
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

export default function DaoGovernance() {
  const live = canVoteDao()
  const { connected, address } = useWallet()
  const { userTro, loading } = useTroStakedBalance()
  const [votes, setVotes] = useState(loadVotes)
  const [sftUnits, setSftUnits] = useState(0)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setSftUnits(loadSftUnits())
  }, [])

  const troStaked = userTro ?? 0
  /** Voting power = TRO staked + SFT staked units (1 unit ≈ 1 weight). */
  const votingPower = useMemo(() => Math.max(0, troStaked) + Math.max(0, sftUnits), [troStaked, sftUnits])

  const cast = useCallback(
    (proposalId: string, choice: 'yes' | 'no') => {
      if (!connected) {
        requestOpenConnect()
        return
      }
      if (votingPower <= 0) {
        setMsg('Voting power nul — stake $TRO ou SFT d’abord.')
        return
      }
      const next = { ...votes, [proposalId]: choice }
      setVotes(next)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        localStorage.setItem(
          'xartists_dao_last_vote',
          JSON.stringify({
            proposalId,
            choice,
            votingPower,
            address: address || null,
            at: new Date().toISOString(),
            onChain: live,
          }),
        )
      } catch {
        /* */
      }
      setMsg(
        live
          ? `Vote ${choice.toUpperCase()} enregistré (poids ${votingPower.toFixed(2)}) — TX SC gouvernance à brancher sur ${TRO_GOVERNANCE_ADDRESS.slice(0, 12)}…`
          : `Vote ${choice.toUpperCase()} enregistré en local (poids ${votingPower.toFixed(2)}). SC vote live bientôt.`,
      )
    },
    [connected, votingPower, votes, address, live],
  )

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-purple-500/30 bg-black/85 backdrop-blur-md p-4 shadow-2xl space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300/90">DAO · Voting power</p>
        <p className="text-2xl font-semibold text-white tabular-nums">
          {loading ? '…' : votingPower.toFixed(2)}
        </p>
        <p className="text-[12px] text-zinc-400">
          Formule : <span className="text-zinc-200 mono">TRO staké + SFT staké</span>
        </p>
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-500">$TRO staké</p>
            <p className="font-semibold text-emerald-200/90 tabular-nums">{troStaked.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-500">SFT / NFT staké</p>
            <p className="font-semibold text-cyan-200/90 tabular-nums">{sftUnits.toFixed(0)} u</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/staking" className="btn-primary text-xs">
            Stake $TRO
          </Link>
          <Link to="/staking" className="btn-secondary text-xs">
            Stake NFT
          </Link>
        </div>
        <p className="text-[10px] text-zinc-600">
          Gouvernance SC : {live ? 'LIVE' : 'gates'} · {TRO_GOVERNANCE_ADDRESS.slice(0, 18)}…
        </p>
      </div>

      <div className="space-y-3">
        {DEFAULT_PROPOSALS.map(p => {
          const mine = votes[p.id]
          return (
            <article
              key={p.id}
              className="rounded-2xl border border-purple-500/25 bg-black/80 backdrop-blur-md p-4 shadow-xl space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                <span className="text-[10px] uppercase text-amber-200/80">{p.status}</span>
              </div>
              <p className="text-[13px] text-zinc-400">{p.body}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={p.status !== 'active'}
                  onClick={() => cast(p.id, 'yes')}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold min-h-[44px] ${
                    mine === 'yes'
                      ? 'border-emerald-400/50 bg-emerald-950/40 text-emerald-100'
                      : 'border-white/15 bg-white/5 text-zinc-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  disabled={p.status !== 'active'}
                  onClick={() => cast(p.id, 'no')}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold min-h-[44px] ${
                    mine === 'no'
                      ? 'border-red-400/50 bg-red-950/40 text-red-100'
                      : 'border-white/15 bg-white/5 text-zinc-200'
                  }`}
                >
                  No
                </button>
                {mine ? (
                  <span className="self-center text-[11px] text-zinc-500">Votre vote : {mine}</span>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      {msg ? <p className="text-[12px] text-cyan-200/90">{msg}</p> : null}
    </div>
  )
}
