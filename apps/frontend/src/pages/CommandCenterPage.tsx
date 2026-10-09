/**
 * Command Center — holo 360 data room + pack-gated panels.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentIA_Guard from '../components/AgentIA_Guard'
import CommandWall from '../command-center/CommandWall'
import DashboardSource from '../command-center/DashboardSource'
import AgentRoster from '../command-center/AgentRoster'
import DataTunnelTransition from '../command-center/DataTunnelTransition'
import ClickGuide from '../command-center/ClickGuide'
import AgentNftOrb from '../command-center/AgentNftOrb'
import MarketTape from '../command-center/MarketTape'
import LiaShadowPanel from '../command-center/LiaShadowPanel'
import AgentNftStakePanel, { isAgentNftStaked } from '../components/AgentNftStakePanel'
import LiveAssetTape from '../components/LiveAssetTape'
import HoloDataRoom from '../components/HoloDataRoom'
import { useAgentAccess, setEmpireZone, empireTxStart } from '../store/empireStore'
import { usePulse } from '../hooks/usePulse'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import LiaCommandTerminal from '../components/LiaCommandTerminal'
import DailySignalWidget from '../components/DailySignalWidget'
import { useWallet } from '../context/WalletContext'
import { getAppMode } from '../lib/appMode'
import { type PackId, mergePackFeatures } from '../config/agentPacks'
import { useI18n } from '../i18n/I18nContext'
import { toAmbientSnapshot, shortTrendToast, type AuraMode } from '../lib/ambientAura'
import { useToast } from '../components/ui/Toast'

type Room = 'hub' | 'pulse' | 'yield' | 'sentinel'

export default function CommandCenterPage() {
  return (
    <AgentIA_Guard>
      <CommandCenterInner />
    </AgentIA_Guard>
  )
}

function CommandCenterInner() {
  const { t } = useI18n()
  const { push } = useToast()
  const access = useAgentAccess()
  const { env, source, connected: pulseWs } = usePulse()
  const { connected } = useWallet()
  const [room, setRoom] = useState<Room>('hub')
  const [tunnel, setTunnel] = useState(true)
  const [tick, setTick] = useState(0)
  const [rewardFlash, setRewardFlash] = useState(false)
  const lia = useLIAInterpreter(env)
  const mode = getAppMode()
  const packs = (access.packs || []).filter(Boolean) as PackId[]
  const features = useMemo(() => mergePackFeatures(packs), [packs])
  const lastMode = useRef<AuraMode | null>(null)

  const endTunnel = useCallback(() => setTunnel(false), [])

  const ambient = useMemo(
    () => toAmbientSnapshot(lia.uniforms, lia.confidence, rewardFlash),
    [lia.uniforms, lia.confidence, rewardFlash],
  )

  useEffect(() => {
    if (lastMode.current === null) {
      lastMode.current = ambient.mode
      return
    }
    if (lastMode.current !== ambient.mode) {
      lastMode.current = ambient.mode
      push(shortTrendToast(ambient.mode, packs[0] || 'Agent'), 'info')
    }
  }, [ambient.mode, packs, push])

  useEffect(() => {
    const onClaim = () => {
      setRewardFlash(true)
      window.setTimeout(() => setRewardFlash(false), 2200)
    }
    window.addEventListener('lia-intent', onClaim)
    return () => window.removeEventListener('lia-intent', onClaim)
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

  const tierNote = features.commandHub
    ? 'Pack Pulse (complet) — hub holo 360 + tape + LIA'
    : packs.length
      ? `Tier limité (${packs.join(', ')}) — salle dédiée · Pulse = full hub`
      : 'Aperçu SAMPLE — holo 360 ouvert'

  return (
    <div className="animate-fade-in space-y-6 pb-28 max-w-4xl mx-auto relative">
      <DataTunnelTransition active={tunnel} onDone={endTunnel} />
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-400/80 font-semibold font-tech">
            Zone 2 · {t('cc.title')}
          </p>
          <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-400">{mode}</span>
          <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-400">
            {source}
            {pulseWs ? ' · live' : ''}
          </span>
          <span className="text-[9px] rounded-full border border-cyan-500/30 px-2 py-0.5 text-cyan-200/90 font-tech">
            {ambient.mode} · {ambient.trend}
          </span>
          {features.commandHub ? (
            <span className="text-[9px] rounded-full border border-emerald-500/40 px-2 py-0.5 text-emerald-300">
              FULL
            </span>
          ) : (
            <span className="text-[9px] rounded-full border border-amber-500/35 px-2 py-0.5 text-amber-200">
              LIMITED
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-tech title-glow">{t('cc.title')}</h1>
        <p className="text-sm text-zinc-400">{t('cc.subtitle')}</p>
        <p className="text-[11px] text-zinc-500">{tierNote}</p>
      </header>

      {(features.liveTapeFull || !packs.length) && <LiveAssetTape />}

      <DailySignalWidget compact />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['hub', t('cc.hub')],
            ['pulse', t('cc.pulse')],
            ['yield', t('cc.yield')],
            ['sentinel', t('cc.sentinel')],
          ] as const
        ).map(([id, label]) => {
          const locked = id !== 'hub' && !packs.includes(id as PackId)
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
              {locked ? ` · ${t('cc.locked')}` : ''}
            </button>
          )
        })}
      </div>

      {room === 'hub' && (
        <div className="space-y-4">
          <HoloDataRoom
            mode="hub"
            sentiment={lia.uniforms.uSentiment}
            volatility={lia.uniforms.uVolatility}
            height={500}
          />
          <CommandWall
            sentiment={lia.uniforms.uSentiment}
            volatility={lia.uniforms.uVolatility}
            pulseSpeed={lia.uniforms.uPulseSpeed}
            colorRgb={lia.uniforms.uColor}
            interactive={features.commandHub || !packs.length}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <ClickGuide />
            <MarketTape snap={ambient} />
          </div>
          {packs[0] && (
            <AgentNftOrb
              packId={packs[0]}
              staked={isAgentNftStaked(packs[0])}
              aura={ambient.mode}
              onSelect={() => setTick(x => x + 1)}
            />
          )}
          {features.agentStake && <AgentNftStakePanel key={tick} packIds={packs} />}
          {(features.liaFull || !packs.length) && <LiaShadowPanel />}
          {(features.commandHub || !packs.length) && (
            <>
              <DashboardSource />
              <AgentRoster />
            </>
          )}
          <div className="card flex flex-wrap gap-2">
            {features.defiSleeve && (
              <button type="button" className="btn-secondary text-sm" onClick={onYieldAction}>
                {t('nav.staking')} $TRO
              </button>
            )}
            <Link to="/marketplace" className="btn-secondary text-sm">
              {t('nav.market')}
            </Link>
            <Link to="/lia" className="btn-secondary text-sm">
              LIA Hub
            </Link>
            {features.tca && (
              <Link to="/tca" className="btn-secondary text-sm">
                TCA
              </Link>
            )}
            {!features.commandHub && packs.length > 0 && (
              <Link to="/agents" className="btn-primary text-sm">
                Upgrade Pulse →
              </Link>
            )}
          </div>
        </div>
      )}

      {room !== 'hub' && packs.includes(room as PackId) && (
        <div className="space-y-4">
          {room === 'pulse' && features.liveTapeFull && <LiveAssetTape compact />}
          <HoloDataRoom
            mode={room as PackId}
            sentiment={lia.uniforms.uSentiment}
            volatility={lia.uniforms.uVolatility}
            height={460}
          />
          <AgentNftOrb
            packId={room as PackId}
            staked={isAgentNftStaked(room as PackId)}
            aura={ambient.mode}
          />
          <RoomCard
            title={`${t(`cc.${room}` as 'cc.pulse')} room`}
            body={
              room === 'pulse'
                ? 'FULL · HF signals · micro-arb · board'
                : room === 'yield'
                  ? 'LIMITÉ · LP sleeve · claims'
                  : 'LIMITÉ · risk alerts'
            }
            sentiment={
              room === 'yield'
                ? Math.max(0, lia.uniforms.uSentiment * 0.6)
                : room === 'sentinel'
                  ? Math.min(0, lia.uniforms.uSentiment)
                  : lia.uniforms.uSentiment
            }
            volatility={lia.uniforms.uVolatility}
          />
          <MarketTape snap={ambient} />
          <AgentNftStakePanel packIds={[room as PackId]} />
        </div>
      )}

      {!connected && (
        <p className="text-xs text-amber-200/90">{t('common.connect')} — TX on-chain.</p>
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
        defaultOpen={false}
      />

      <p className="text-[11px] text-zinc-600">
        <Link to="/my-packs" className="hover:text-zinc-400">
          My Packs
        </Link>
        {' · '}
        <Link to="/agents" className="hover:text-zinc-400">
          {t('nav.packs')}
        </Link>
      </p>
    </div>
  )
}

function RoomCard({
  title,
  body,
  sentiment,
  volatility,
}: {
  title: string
  body: string
  sentiment: number
  volatility: number
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
      <CommandWall sentiment={sentiment} volatility={volatility} interactive={false} />
    </div>
  )
}
