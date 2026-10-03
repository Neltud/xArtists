/**
 * Stake agent (UI) → points clone LIA.
 * Stockage local uniquement — PAS un stake on-chain tant que SC NFT-stake absent.
 */
import { useCallback, useEffect, useState } from 'react'
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'
import { useI18n } from '../i18n/I18nContext'
import { useToast } from './ui/Toast'
import { dispatch8008 } from '../config/agent8008'

const KEY = 'xartists_agent_nft_stake'

type StakeMap = Partial<Record<PackId, { stakedAt: number; claims: number; pts: number }>>

function load(): StakeMap {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as StakeMap & Record<string, { paperPts?: number; pts?: number }>
    // migrate paperPts → pts
    for (const k of Object.keys(raw)) {
      const row = raw[k as PackId]
      if (row && row.pts == null && row.paperPts != null) row.pts = row.paperPts
    }
    return raw as StakeMap
  } catch {
    return {}
  }
}

function save(m: StakeMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {
    /* */
  }
}

export default function AgentNftStakePanel({ packIds }: { packIds: PackId[] }) {
  const { t } = useI18n()
  const { push } = useToast()
  const [map, setMap] = useState<StakeMap>(() => load())
  const [focus, setFocus] = useState<PackId | null>(packIds[0] || null)

  useEffect(() => {
    if (packIds.length && (!focus || !packIds.includes(focus))) setFocus(packIds[0])
  }, [packIds, focus])

  const stake = useCallback(
    (id: PackId) => {
      const next = {
        ...map,
        [id]: { stakedAt: Date.now(), claims: map[id]?.claims || 0, pts: map[id]?.pts || 0 },
      }
      setMap(next)
      save(next)
      dispatch8008('AGENT_NFT_STAKE', { pack_id: id, local: true })
      push(`${id} engagé (aperçu appareil)`, 'ok')
    },
    [map, push],
  )

  const unstake = useCallback(
    (id: PackId) => {
      const next = { ...map }
      delete next[id]
      setMap(next)
      save(next)
      dispatch8008('AGENT_NFT_UNSTAKE', { pack_id: id, local: true })
      push(`${id} retiré`, 'info')
    },
    [map, push],
  )

  const claim = useCallback(
    (id: PackId) => {
      const cur = map[id]
      if (!cur) {
        push('Engage d’abord l’agent', 'err')
        return
      }
      const gain = 1 + Math.floor(Math.random() * 3)
      const next = {
        ...map,
        [id]: { ...cur, claims: cur.claims + 1, pts: (cur.pts || 0) + gain },
      }
      setMap(next)
      save(next)
      dispatch8008('AGENT_CLONE_CLAIM', { pack_id: id, pts: gain, local: true })
      push(`+${gain} pts clone (local · non retirables)`, 'ok')
    },
    [map, push],
  )

  if (!packIds.length) {
    return <div className="card text-sm text-zinc-500">{t('cc.no.pack')}</div>
  }

  const id = focus || packIds[0]
  const pack = AGENT_PACKS.find(p => p?.id === id)
  const st = map[id]

  return (
    <section className="card space-y-3">
      <h2 className="text-sm font-semibold text-white">{t('cc.stake.nft')}</h2>
      <p className="text-[12px] text-zinc-500">{t('cc.stake.nft.help')}</p>
      <div className="flex flex-wrap gap-2">
        {packIds.map(pid => {
          const p = AGENT_PACKS.find(x => x?.id === pid)
          return (
            <button
              key={pid}
              type="button"
              onClick={() => setFocus(pid)}
              className={`rounded-full px-3 py-1 text-[12px] border active:scale-[0.98] ${
                id === pid ? 'border-cyan-400/40 bg-cyan-500/15 text-white' : 'border-white/10 text-zinc-400'
              }`}
            >
              {p?.icon} {p?.name}
              {map[pid] ? ' ●' : ''}
            </button>
          )
        })}
      </div>
      {pack && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <p className="text-sm text-white">
            {pack.icon} {pack.name}
          </p>
          <p className="text-[11px] text-zinc-500 mono">
            {st ? `engagé · claims ${st.claims} · pts ${st.pts || 0}` : 'non engagé'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!st ? (
              <button type="button" className="btn-primary text-sm active:scale-[0.98]" onClick={() => stake(id)}>
                {t('cc.stake.nft')}
              </button>
            ) : (
              <>
                <button type="button" className="btn-primary text-sm active:scale-[0.98]" onClick={() => claim(id)}>
                  {t('cc.claim')}
                </button>
                <button type="button" className="btn-secondary text-sm active:scale-[0.98]" onClick={() => unstake(id)}>
                  Retirer
                </button>
              </>
            )}
          </div>
          <p className="text-[11px] text-zinc-600">{t('cc.claim.note')}</p>
        </div>
      )}
    </section>
  )
}

export function isAgentNftStaked(packId: PackId): boolean {
  return !!load()[packId]
}
