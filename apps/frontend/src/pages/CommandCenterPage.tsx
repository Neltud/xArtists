/**
 * Command Center — salles pack (Pulse · Yield · Sentinel) — UI protocol.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AgentIA_Guard from '../components/AgentIA_Guard'
import CommandWall from '../command-center/CommandWall'
import DashboardSource from '../command-center/DashboardSource'
import AgentRoster from '../command-center/AgentRoster'
import DataTunnelTransition from '../command-center/DataTunnelTransition'
import ClickGuide from '../command-center/ClickGuide'
import AgentNftOrb from '../command-center/AgentNftOrb'
import MarketTape from '../command-center/MarketTape'
import LiaShadowPanel from '../command-center/LiaShadowPanel'
import IntentXPortalPanel from '../command-center/IntentXPortalPanel'
import LiaSignalPanel from '../components/lia/LiaSignalPanel'
import AgentStrategyConfigPanel from '../components/lia/AgentStrategyConfig'
import EconomicDisclosure from '../components/lia/EconomicDisclosure'
import LiveNewsStream from '../command-center/LiveNewsStream'
import LiveAssetTape from '../components/LiveAssetTape'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { holderStatus } from '../lib/holderAccess'
import { usePulse } from '../hooks/usePulse'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import { toAmbientSnapshot } from '../lib/ambientAura'
import { setEmpireZone } from '../store/empireStore'
import { useI18n } from '../i18n/I18nContext'
import { useToast } from '../components/ui/Toast'
import { requestOpenConnect } from '../lib/walletEvents'
import { LIA_BADGE } from '../config/liaConfig'
import { AGENT_PACKS, getPack, type PackId } from '../config/agentPacks'

type Room = 'hub' | 'pulse' | 'yield' | 'sentinel'
type EcoTab = 'defi' | 'liquidity' | 'holders'

const ROOM_IDS: Room[] = ['hub', 'pulse', 'yield', 'sentinel']

const ROOM_WALL: Record<
  Exclude<Room, 'hub'>,
  { color: [number, number, number]; sentiment: number; volatility: number; pulseSpeed: number }
> = {
  pulse: { color: [0.98, 0.75, 0.14], sentiment: 0.35, volatility: 0.55, pulseSpeed: 1.4 },
  yield: { color: [0.58, 0.64, 0.72], sentiment: 0.1, volatility: 0.28, pulseSpeed: 0.85 },
  sentinel: { color: [0.65, 0.55, 0.98], sentiment: -0.15, volatility: 0.4, pulseSpeed: 0.7 },
}

function parseRoom(v: string | null): Room | null {
  if (!v) return null
  const x = v.toLowerCase().trim()
  return ROOM_IDS.includes(x as Room) ? (x as Room) : null
}

function roomLabel(id: Room, t: (k: string) => string): string {
  if (id === 'pulse') return t('cc.pulse')
  if (id === 'yield') return t('cc.yield')
  if (id === 'sentinel') return t('cc.sentinel')
  return t('cc.hub')
}

export default function CommandCenterPage() {
  return (
    <AgentIA_Guard>
      <CommandCenterInner />
    </AgentIA_Guard>
  )
}

function CommandCenterInner() {
  const { t, lang } = useI18n()
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const status = useMemo(() => holderStatus(account.nfts || [], address), [account.nfts, address])
  const [params, setParams] = useSearchParams()
  const roomParam = parseRoom(params.get('room'))
  const [room, setRoom] = useState<Room>(roomParam || 'hub')
  const [eco, setEco] = useState<EcoTab>('defi')
  const { env } = usePulse()
  const lia = useLIAInterpreter(env)
  const ambientSnap = useMemo(
    () => toAmbientSnapshot(lia?.uniforms, lia?.confidence ?? 0.5, false),
    [lia?.uniforms, lia?.confidence],
  )
  const { push } = useToast()
  const tunnelRef = useRef(false)

  useEffect(() => {
    setEmpireZone('command')
    return () => setEmpireZone('museum')
  }, [])

  useEffect(() => {
    if (roomParam && roomParam !== room) setRoom(roomParam)
  }, [roomParam, room])

  const locked = useCallback(
    (r: Room) => {
      if (r === 'hub') return false
      if (!connected) return true
      if (r === 'pulse') return !status.pulse && !status.isFull
      if (r === 'yield') return !status.yield && !status.isFull
      if (r === 'sentinel') return !status.sentinel && !status.isFull
      return false
    },
    [connected, status],
  )

  const goRoom = useCallback(
    (r: Room) => {
      setRoom(r)
      setParams(p => {
        const n = new URLSearchParams(p)
        if (r === 'hub') n.delete('room')
        else n.set('room', r)
        return n
      })
    },
    [setParams],
  )

  const onRoomClick = (r: Room) => {
    if (locked(r)) {
      const label = roomLabel(r, t)
      push(
        connected
          ? lang === 'fr'
            ? `Pack ${label} requis. Voir Packs.`
            : `${label} pack required. See Packs.`
          : lang === 'fr'
            ? `Guest — salle ${label} verrouillée. Connecte le wallet.`
            : `Guest — ${label} locked. Connect wallet.`,
      )
      return
    }
    goRoom(r)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const unlocked = ROOM_IDS.filter(r => !locked(r))
      if (unlocked.length < 2) return
      const idx = unlocked.indexOf(room)
      const next =
        e.key === 'ArrowRight'
          ? unlocked[(idx + 1) % unlocked.length]
          : unlocked[(idx - 1 + unlocked.length) % unlocked.length]
      goRoom(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [room, locked, goRoom])

  const activePackId: PackId | null =
    room === 'pulse' || room === 'yield' || room === 'sentinel' ? room : null
  const pack = activePackId ? getPack(activePackId) : null
  const wallCfg = activePackId ? ROOM_WALL[activePackId] : null

  return (
    <div className="xa-page animate-fade-in space-y-6 pb-24 max-w-5xl mx-auto">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('cc.title')}</p>
        <h1 className="xa-hero__title" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          {pack ? `${pack.name} · ${pack.tierLabel}` : t('cc.subtitle')}
        </h1>
        <p className="text-xs text-[var(--xa-text-muted)] mb-2">{LIA_BADGE}</p>
        <p className="xa-hero__lead" style={{ marginBottom: '0.75rem' }}>
          {pack
            ? pack.tagline
            : lang === 'fr'
              ? 'Hub ops · salles pack (← →) · paper-first · signature utilisateur uniquement.'
              : 'Ops hub · pack rooms (← →) · paper-first · user signature only.'}
        </p>
        <EconomicDisclosure compact />
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1 p-1 rounded-xl w-fit"
          style={{ background: 'var(--xa-surface)', border: '1px solid var(--xa-border)' }}
        >
          {ROOM_IDS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => onRoomClick(r)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold min-h-[40px] transition ${
                room === r
                  ? 'bg-white/10 text-[var(--xa-text)]'
                  : locked(r)
                    ? 'text-[var(--xa-text-muted)] opacity-50'
                    : 'text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]'
              }`}
            >
              {roomLabel(r, t)}
              {locked(r) ? ` · ${t('cc.locked')}` : ''}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[var(--xa-text-muted)] hidden sm:block">← →</p>
      </div>

      {!connected && (
        <button type="button" className="xa-btn-primary text-sm" onClick={requestOpenConnect}>
          {t('common.connect')}
        </button>
      )}

      {room === 'hub' && (
        <>
          <MarketTape snap={ambientSnap} />
          <LiveAssetTape />
          <CommandWall
            sentiment={ambientSnap.mode === 'bear' ? -0.4 : 0.2}
            volatility={0.35}
            color={[0.6, 0.6, 0.65]}
          />
          <DashboardSource />
          <AgentRoster />
          <div className="grid gap-3 sm:grid-cols-3">
            {AGENT_PACKS.map(p => (
              <AgentNftOrb
                key={p.id}
                packId={p.id}
                aura={ambientSnap.mode}
                onSelect={() => onRoomClick(p.id)}
              />
            ))}
          </div>
          <ClickGuide />
          <p className="xa-disclaimer">
            {lang === 'fr'
              ? 'Hub : vue d’ensemble. Pulse (signaux), Yield (DeFi), Sentinel (risk / RWA).'
              : 'Hub overview. Pulse (signals), Yield (DeFi), Sentinel (risk / RWA).'}
          </p>
        </>
      )}

      {room === 'pulse' && (
        <>
          <div className="xa-card text-sm text-[var(--xa-text-secondary)]">
            Pulse · HF signals · TCA · LIA · live tape
          </div>
          <MarketTape snap={ambientSnap} />
          <LiveAssetTape />
          <CommandWall
            sentiment={wallCfg!.sentiment}
            volatility={wallCfg!.volatility}
            pulseSpeed={wallCfg!.pulseSpeed}
            color={wallCfg!.color}
          />
          <AgentNftOrb packId="pulse" aura={ambientSnap.mode} />
          <LiaShadowPanel />
          <AgentStrategyConfigPanel />
          <LiaSignalPanel />
          <IntentXPortalPanel />
          <LiveNewsStream />
          <ClickGuide />
        </>
      )}

      {room === 'yield' && (
        <>
          <div className="xa-card text-sm text-[var(--xa-text-secondary)]">
            Yield · DeFi sleeve · LP · staking · compound
          </div>
          <CommandWall
            sentiment={wallCfg!.sentiment}
            volatility={wallCfg!.volatility}
            pulseSpeed={wallCfg!.pulseSpeed}
            color={wallCfg!.color}
          />
          <AgentNftOrb packId="yield" aura="stable" />
          <section className="space-y-2">
            <div
              className="flex gap-1 p-1 rounded-xl w-fit flex-wrap"
              style={{ background: 'var(--xa-surface)', border: '1px solid var(--xa-border)' }}
            >
              {(['defi', 'liquidity', 'holders'] as EcoTab[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setEco(tab)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold min-h-[40px] ${
                    eco === tab ? 'bg-white/10 text-[var(--xa-text)]' : 'text-[var(--xa-text-muted)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {eco === 'defi' && (
              <p className="text-sm text-[var(--xa-text-secondary)]">
                DeFi — <Link className="underline" to="/staking">/staking</Link>
              </p>
            )}
            {eco === 'liquidity' && (
              <p className="text-sm text-[var(--xa-text-secondary)]">
                $TRO — <Link className="underline" to="/lp">/lp</Link> ·{' '}
                <Link className="underline" to="/hatom">/hatom</Link>
              </p>
            )}
            {eco === 'holders' && (
              <p className="text-sm text-[var(--xa-text-secondary)]">Holders Yield — pool analytics</p>
            )}
          </section>
          <IntentXPortalPanel />
          <DashboardSource />
        </>
      )}

      {room === 'sentinel' && (
        <>
          <div className="xa-card text-sm text-[var(--xa-text-secondary)]">
            Sentinel · watch · RWA · zero-trust · drawdown alerts
          </div>
          <CommandWall
            sentiment={wallCfg!.sentiment}
            volatility={wallCfg!.volatility}
            pulseSpeed={wallCfg!.pulseSpeed}
            color={wallCfg!.color}
          />
          <AgentNftOrb packId="sentinel" aura="bear" />
          <section className="xa-card space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-[var(--xa-text-muted)]">Risk sleeve</p>
            <ul className="text-sm text-[var(--xa-text-secondary)] space-y-1">
              <li>· Board drawdown alerts</li>
              <li>· RWA / zero-trust gates</li>
              <li>· GUARD · ALERT · DRAWDOWN_WATCH</li>
            </ul>
            <Link to="/tca" className="text-sm text-[var(--xa-accent)] hover:underline">
              TCA Academy →
            </Link>
          </section>
          <IntentXPortalPanel />
          <LiveNewsStream />
        </>
      )}

      <DataTunnelTransition active={tunnelRef.current} />

      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/lia" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('lia.title')}
        </Link>
        <Link to="/agents" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.packs')}
        </Link>
        <Link to="/" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.home')}
        </Link>
      </div>
    </div>
  )
}
