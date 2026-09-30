/**
 * Command Center V6 — metrics wall + agent roster + rooms.
 * Museum routes untouched.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentIA_Guard from '../components/AgentIA_Guard'
import CommandWall from '../command-center/CommandWall'
import DashboardSource from '../command-center/DashboardSource'
import AgentRoster from '../command-center/AgentRoster'
import { useAgentAccess, setEmpireZone, empireTxStart } from '../store/empireStore'
import { usePulse } from '../hooks/usePulse'
import { useWallet } from '../context/WalletContext'
import { getAppMode } from '../lib/appMode'
import { AGENT_PACKS } from '../config/agentPacks'

type Room = 'hub' | 'pulse' | 'yield' | 'sentinel'

export default function CommandCenterPage() {
  return (
    <AgentIA_Guard>
      <CommandCenterInner />
    </AgentIA_Guard>
  )
}

function CommandCenterInner() {
  const access = useAgentAccess()
  const { env, source, connected: pulseWs } = usePulse()
  const { connected } = useWallet()
  const [room, setRoom] = useState<Room>('hub')
  const sentiment = typeof env?.sentiment === 'number' ? env.sentiment : 0
  const mode = getAppMode()

  useEffect(() => {
    setEmpireZone('command')
    return () => setEmpireZone('museum')
  }, [])

  useEffect(() => {
    const onRoom = (e: Event) => {
      const r = (e as CustomEvent).detail?.room as Room | undefined
      if (r === 'pulse' || r === 'yield' || r === 'sentinel' || r === 'hub') setRoom(r)
    }
    window.addEventListener('xartists:cc-room', onRoom)
    return () => window.removeEventListener('xartists:cc-room', onRoom)
  }, [])

  const onYieldAction = () => {
    empireTxStart('Command → Stake TRO')
    window.location.hash = '#/staking'
  }

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-4xl mx-auto">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-400/80 font-semibold">
            Zone 2 · Command Center
          </p>
          <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-400">
            mode {mode}
          </span>
          <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-400">
            pulse {source}
            {pulseWs ? ' · ws' : ''}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Holder Ops</h1>
        <p className="text-sm text-zinc-400">
          Accès <span className="text-cyan-200">{access.source}</span> ·{' '}
          {access.packs.length
            ? access.packs.map(id => {
                const p = AGENT_PACKS.find(x => x.id === id)
                return p ? `${p.icon} ${p.name}` : id
              }).join(' · ')
            : 'aucun pack'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['hub', 'Hub'],
            ['pulse', 'Pulse'],
            ['yield', 'Yield'],
            ['sentinel', 'Sentinel'],
          ] as const
        ).map(([id, label]) => {
          const locked = id !== 'hub' && !access.packs.includes(id)
          return (
            <button
              key={id}
              type="button"
              disabled={locked}
              onClick={() => setRoom(id)}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                room === id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                  : locked
                    ? 'border-white/5 text-zinc-600 cursor-not-allowed'
                    : 'border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {label}
              {locked ? ' 🔒' : ''}
            </button>
          )
        })}
      </div>

      {room === 'hub' && (
        <div className="space-y-6">
          <CommandWall sentiment={sentiment} />
          <DashboardSource sentiment={sentiment} className="mx-auto" />
          <AgentRoster />
        </div>
      )}

      {room === 'pulse' && (
        <AgentIA_Guard requirePack="pulse">
          <RoomCard
            title="Pulse Room · Atmospheric Feedback"
            body="Sentiment IA → couleur / rythme du mur. Bullish = gold-cyan · Bearish = rouge chaotique."
            sentiment={sentiment}
          />
        </AgentIA_Guard>
      )}

      {room === 'yield' && (
        <AgentIA_Guard requirePack="yield">
          <div className="card space-y-3 border-amber-500/20">
            <h2 className="font-bold text-amber-100">Yield Room · Direct Execution</h2>
            <p className="text-sm text-zinc-400">
              Data → action : stake TRO on-chain via TxShell / xPortal.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={!connected}
                onClick={onYieldAction}
              >
                Stake TRO →
              </button>
              <Link to="/staking" className="btn-secondary text-sm">
                Staking page
              </Link>
              <Link to="/hatom" className="btn-secondary text-sm">
                Hatom lecture
              </Link>
            </div>
            <CommandWall sentiment={Math.max(0, sentiment)} />
          </div>
        </AgentIA_Guard>
      )}

      {room === 'sentinel' && (
        <AgentIA_Guard requirePack="sentinel">
          <RoomCard
            title="Sentinel Room · Risk"
            body="Veille · alertes. Paper-first jusqu’oracles live."
            sentiment={sentiment * 0.4 - 0.2}
          />
        </AgentIA_Guard>
      )}

      <p className="text-[11px] text-zinc-600">
        <Link to="/museum" className="hover:text-zinc-400">
          ← Musée public
        </Link>
        {' · '}
        <Link to="/my-packs" className="hover:text-zinc-400">
          My Packs
        </Link>
        {' · '}
        <Link to="/agents" className="hover:text-zinc-400">
          Agents
        </Link>
        {' · '}
        <Link to="/marketplace" className="hover:text-zinc-400">
          Marketplace
        </Link>
      </p>
    </div>
  )
}

function RoomCard({
  title,
  body,
  sentiment,
}: {
  title: string
  body: string
  sentiment: number
}) {
  const bullish = sentiment >= 0
  return (
    <div
      className={`card space-y-3 ${
        bullish ? 'border-amber-500/25 bg-amber-500/5' : 'border-rose-500/25 bg-rose-500/5'
      }`}
    >
      <h2 className="font-bold text-white">{title}</h2>
      <p className="text-sm text-zinc-400">{body}</p>
      <p className="text-xs mono text-zinc-500">
        sentiment {sentiment.toFixed(2)} · {bullish ? 'gold/fluid' : 'red/chaotic'}
      </p>
      <CommandWall sentiment={sentiment} />
    </div>
  )
}
