/**
 * L'INTELLECT · Command Center — cyber HUD + holo + news + DeFi Hub.
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
import LiveNewsStream from '../command-center/LiveNewsStream'
import AgentNftStakePanel, { isAgentNftStaked } from '../components/AgentNftStakePanel'
import LiveAssetTape from '../components/LiveAssetTape'
import HoloDataRoom from '../components/HoloDataRoom'
import DeFiCommandPanel from '../components/defi/DeFiCommandPanel'
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

  const bullPct = (50 + Math.max(-40, Math.min(40, (lia.uniforms.uSentiment || 0) * 50))).toFixed(1)
  const volPct = ((lia.uniforms.uVolatility || 0.35) * 100).toFixed(1)
  const bullish = (lia.uniforms.uSentiment || 0) >= 0

  return (
    <div className="animate-fade-in space-y-5 pb-28 max-w-4xl mx-auto relative">
      <DataTunnelTransition active={tunnel} onDone={endTunnel} />

      <header className="glass-hud p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/90 font-tech">
            L&apos;INTELLECT · COMMAND CENTER
          </p>
          <span className="pill-hud">{mode}</span>
          <span className="pill-hud">
            {source}
            {pulseWs ? ' · live' : ''}
          </span>
          <span className={`pill-hud ${bullish ? 'pill-bull' : 'pill-bear'}`}>
            {bullish ? 'BULLISH' : 'BEARISH'} {bullPct}%
          </span>
          <span className="pill-hud pill-vol">VOL {volPct}%</span>
          {features.commandHub ? (
            <span className="pill-hud pill-bull">FULL</span>
          ) : (
            <span className="pill-hud">LIMITED</span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-tech title-glow tracking-wide">
          Analyse Cognitive On-Chain &amp; signaux Live
        </h1>
        <p className="text-sm text-zinc-400">{t('cc.subtitle')}</p>
      </header>

      {(features.liveTapeFull || !packs.length) && <LiveAssetTape />}

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <DailySignalWidget compact />
        </div>
        <LiveNewsStream compact />
      </div>

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
              className={`rounded-full px-3 py-1.5 text-[12px] border font-tech transition ${
                room === id
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : locked
                    ? 'border-white/5 text-zinc-600 opacity-50'
                    : 'border-white/10 text-zinc-400 hover:text-white glass-hud'
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
          <CommandWall
            sentiment={lia.uniforms.uSentiment}
            volatility={lia.uniforms.uVolatility}
            pulseSpeed={lia.uniforms.uPulseSpeed}
            colorRgb={lia.uniforms.uColor}
            interactive={features.commandHub || !packs.length}
          />
          <HoloDataRoom
            mode="hub"
            sentiment={lia.uniforms.uSentiment}
            volatility={lia.uniforms.uVolatility}
            height={420}
          />
          <DeFiCommandPanel />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="glass-hud p-3">
              <ClickGuide />
            </div>
            <div className="glass-hud p-3">
              <MarketTape snap={ambient} />
            </div>
          </div>
          <LiveNewsStream />
          {packs[0] && (
            <AgentNftOrb
              packId={packs[0]}
              staked={isAgentNftStaked(packs[0])}
              aura={ambient.mode}
              onSelect={() => setTick(x => x + 1)}
            />
          )}
          {features.agentStake && <AgentNftStakePanel key={tick} packIds={packs} />}
          {(features.liaFull || !packs.length) && (
            <div className="glass-hud p-3">
              <LiaShadowPanel />
            </div>
          )}
          {(features.commandHub || !packs.length) && (
            <>
              <DashboardSource />
              <AgentRoster />
            </>
          )}
          <div className="glass-hud p-3 flex flex-wrap gap-2">
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
            <Link to="/hatom" className="btn-secondary text-sm">
              Hatom
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
          <CommandWall
            sentiment={lia.uniforms.uSentiment}
            volatility={lia.uniforms.uVolatility}
            interactive={false}
          />
          <HoloDataRoom mode={room as PackId} height={400} />
          {room === 'yield' && <DeFiCommandPanel />}
          <AgentNftOrb
            packId={room as PackId}
            staked={isAgentNftStaked(room as PackId)}
            aura={ambient.mode}
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
