import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * DAO governance UI — pouvoir de vote uniquement proportionnel au TRO staké.
 */
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { TRO_GOVERNANCE_ADDRESS } from '../config/scStatus'
import { useTroStakedBalance } from '../hooks/useTroStakedBalance'
import { useCopy } from '../experience/state'
import { useI18n } from '../i18n/I18nContext'

type Proposal = {
  id: string
  titleKey: string
  bodyKey: string
  status: 'demo' | 'closed'
  yes: number
  no: number
}

const STORAGE_KEY = 'xartists_dao_votes_v1'

const DEFAULT_PROPOSALS: Proposal[] = [
  { id: 'p1', titleKey: 'dao.prop1.title', bodyKey: 'dao.prop1.body', status: 'demo', yes: 0, no: 0 },
  { id: 'p2', titleKey: 'dao.prop2.title', bodyKey: 'dao.prop2.body', status: 'demo', yes: 0, no: 0 },
]

function loadVotes(): Record<string, 'yes' | 'no'> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, 'yes' | 'no'>
  } catch {
    return {}
  }
}

export default function DaoGovernance() {
  const { t } = useI18n()
  const c = useCopy()
  const { userTro, loading } = useTroStakedBalance()
  const [votes, setVotes] = useState(loadVotes)
  const [msg, setMsg] = useState('')

  const troStaked = userTro ?? 0
  const votingPower = Math.max(0, troStaked)

  const cast = useCallback(
    (proposalId: string, choice: 'yes' | 'no') => {
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
            address: null,
            at: new Date().toISOString(),
            onChain: false,
          }),
        )
      } catch {
        /* */
      }
      setMsg(c('daoPracticeSaved'))
    },
    [votingPower, votes, c],
  )

  return (
    <div className="space-y-5">
      <details className="rounded-2xl border border-purple-500/30 bg-black/85 backdrop-blur-md p-4 shadow-2xl space-y-3">
        <summary className="cursor-pointer text-sm font-semibold text-white">{t('dao.votingPower')} · {c('demoLabel')}</summary>
        <div className="mt-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300/90">
          {xaRender("DAO · ")}{xaRender(t('dao.votingPower'))}
        </p>
        <p className="text-2xl font-semibold text-white tabular-nums">
          {xaRender(loading ? '…' : votingPower.toFixed(2))}
        </p>
        <p className="text-[12px] text-zinc-400">{c('daoPowerTroOnly')}</p>
        <div className="grid grid-cols-1 gap-2 text-[12px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-500">{xaRender(t('dao.troStaked'))}</p>
            <p className="font-semibold text-emerald-200/90 tabular-nums">{xaRender(troStaked.toFixed(2))}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/staking" className="btn-primary text-xs">
            {xaRender(t('dao.stakeTro'))}
          </Link>
        </div>
        <p className="text-[10px] text-zinc-600">
          {xaRender("Contrat indicatif : ")}{xaRender(TRO_GOVERNANCE_ADDRESS.slice(0, 18))}…
        </p>
        </div>
      </details>

      <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-sm text-amber-100">{c('daoDemoWarning')}</p>
      <div className="space-y-3">
        {xaRender(DEFAULT_PROPOSALS.map(p => {
          const mine = votes[p.id]
          return (
            <article
              key={p.id}
              className="rounded-2xl border border-purple-500/25 bg-black/80 backdrop-blur-md p-4 shadow-xl space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{xaRender(t(p.titleKey))}</h3>
                <span className="text-[10px] uppercase text-amber-200/80">{c('demoLabel')}</span>
              </div>
              <p className="text-[13px] text-zinc-400">{xaRender(t(p.bodyKey))}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={p.status !== 'demo'}
                  onClick={() => cast(p.id, 'yes')}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold min-h-[44px] ${
                    mine === 'yes'
                      ? 'border-emerald-400/50 bg-emerald-950/40 text-emerald-100'
                      : 'border-white/15 bg-white/5 text-zinc-200'
                  }`}
                >
                  {c('daoPracticeYes')}
                </button>
                <button
                  type="button"
                  disabled={p.status !== 'demo'}
                  onClick={() => cast(p.id, 'no')}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold min-h-[44px] ${
                    mine === 'no'
                      ? 'border-red-400/50 bg-red-950/40 text-red-100'
                      : 'border-white/15 bg-white/5 text-zinc-200'
                  }`}
                >
                  {c('daoPracticeNo')}
                </button>
                {xaRender(mine ? (
                  <span className="self-center text-[11px] text-zinc-500">
                    {xaRender(t('dao.yourVote'))} {xaRender(mine)}
                  </span>
                ) : null)}
              </div>
            </article>
          )
        }))}
      </div>

      {xaRender(msg ? <p className="text-[12px] text-cyan-200/90">{xaRender(msg)}</p> : null)}
    </div>
  )
}
