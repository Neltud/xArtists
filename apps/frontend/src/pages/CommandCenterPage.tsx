/**
 * Command Center V6 — Neural Bridge (Semantic Compiler + LIA terminal).
 * Museum routes untouched.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentIA_Guard from '../components/AgentIA_Guard'
import CommandWall from '../command-center/CommandWall'
import DashboardSource from '../command-center/DashboardSource'
import AgentRoster from '../command-center/AgentRoster'
import DataTunnelTransition from '../command-center/DataTunnelTransition'
import { useAgentAccess, setEmpireZone, empireTxStart } from '../store/empireStore'
import { usePulse } from '../hooks/usePulse'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import LiaCommandTerminal from '../components/LiaCommandTerminal'
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
  const [tunnel, setTunnel] = useState(true)
  const sentiment = typeof env?.sentiment === 'number' ? env.sentiment : 0
  const lia = useLIAInterpreter(env)
  const mode = getAppMode()

  useEffect(() => {
    const t = window.setTimeout(() => lia.requestComment('command-center enter'), 1200)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div className="animate-fade-in space-y-6 pb-24 max-w-4xl mx-auto">
      <DataTunnelTransition active={tunnel} onDone={() => setTunnel(false)} />
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-400/80 font-semibold font-tech">
            Zone 2 · Command Center
          </p>
          <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-400">
            mode {mode}
          </span>
          <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-400">
            pulse {source}
            {pulseWs ? ' · live' : ''}
          </span>
          <span className="text-[9px] rounded-full border border-cyan-500/30 px-2 py-0.5 text-cyan-200/90">
            LIA {lia.source} · {(lia.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-tech title-glow">Holder Ops</h1>
        <p className="text-sm text-zinc-400">
          Accès <span className="text-cyan-200">{access.source}</span> ·{' '}
          {access.packs.length
            ? access.packs
                .map(id => {
                  const p = AGENT_PACKS.find(x => x.id === id)
                  return p ? `${p.icon} ${p.name}` : id
                })
                .join(' · ')
            : 'aucun pack'}
        </p>
        <p className="text-[11px] text-zinc-500">{lia.uniforms.label}</p>
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
              className={`rounded-full px-3 py-1.5 text-[12px] border transition ${
                room === id
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-white'
                  : locked
                    ? 'border-white/5 text-zinc-600 opacity-50'
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
        <div className="space-y-4">
          <CommandWall
            sentiment={lia.uniforms.uSentiment}
            volatility={lia.uniforms.uVolatility}
            pulseSpeed={lia.uniforms.uPulseSpeed}
            colorRgb={lia.uniforms.uColor}
          />
          <DashboardSource />
          <AgentRoster />
          <div className="card flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={onYieldAction}>
              Stake TRO
            </button>
            <Link to="/marketplace" className="btn-secondary text-sm">
              Marketplace
            </Link>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => lia.requestComment(`agent pack ${access.packs.join(',')}`)}
            >
              Brief LIA packs
            </button>
          </div>
        </div>
      )}

      {room === 'pulse' && (
        <RoomCard
          title="Pulse room"
          body="Signaux haute fréquence · micro-arb · board."
          sentiment={lia.uniforms.uSentiment}
        />
      )}
      {room === 'yield' && (
        <RoomCard
          title="Yield room"
          body="Hatom / LP sleeve · claims."
          sentiment={Math.max(0, lia.uniforms.uSentiment * 0.6)}
        />
      )}
      {room === 'sentinel' && (
        <RoomCard
          title="Sentinel room"
          body="Veille · alertes · risk."
          sentiment={Math.min(0, lia.uniforms.uSentiment)}
        />
      )}

      {!connected && (
        <p className="text-xs text-amber-200/90">Connecte le wallet pour les TX on-chain depuis le mur.</p>
      )}

      <LiaCommandTerminal
        phrase={lia.phrase}
        mood={lia.uniforms.mood}
        confidence={lia.confidence}
        source={lia.source}
        pending={lia.shadow.liaPending}
        fallback={lia.shadow.fallbackActive}
        onAsk={ctx => lia.requestComment(ctx)}
        contextHint={room === 'hub' ? 'command-center' : `room:${room}`}
      />

      <p className="text-[11px] text-zinc-600">
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
      <CommandWall sentiment={sentiment} volatility={Math.min(1, Math.abs(sentiment) + 0.25)} interactive={false} />
    </div>
  )
}
