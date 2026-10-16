/**
 * Command Center — 3 salles pack distinctes (Pulse GOLD · Yield SILVER · Sentinel PLATINUM).
 * Flèches ← → pour changer de salle (si déverrouillée).
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

function roomLabel(id: Room): string {
  if (id === 'pulse') return 'Pulse · GOLD'
  if (id === 'yield') return 'Yield · SILVER'
  if (id === 'sentinel') return 'Sentinel · PLATINUM'
  return 'Hub'
}

export default function CommandCenterPage() {
  return (
    <AgentIA_Guard>
      <CommandCenterInner />
    </AgentIA_Guard>
  )
}

function CommandCenterInner() {
  const { t } = useI18n()
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
      const label = roomLabel(r)
      push(
        connected
          ? `Pack ${label} requis (ou Pulse GOLD full). Voir Agents.`
          : `Mode Guest — salle ${label} verrouillée. Connecte xPortal ou obtiens le pack.`,
      )
      return
    }
    goRoom(r)
  }

  // ← → cycle unlocked rooms
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
    <div className="animate-fade-in space-y-4 pb-24 max-w-5xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">{t('cc.title') || 'Command Center'}</p>
        <h1 className="section-title display text-2xl">
          {pack ? `${pack.icon} ${pack.name} · ${pack.tierLabel}` : 'L’Intellect · cockpit'}
        </h1>
        <p className="text-[11px] text-emerald-200/90 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 inline-block max-w-full">
          {LIA_BADGE}
        </p>
        <p className="text-[12px] text-zinc-500">
          {pack
            ? pack.tagline
            : 'Hub commun · choisis une salle pack (← →) · paper-first · signature utilisateur uniquement.'}
        </p>
        <EconomicDisclosure compact />
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-black/40 border border-white/10 w-fit">
          {ROOM_IDS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => onRoomClick(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold min-h-[44px] ${
                room === r
                  ? r === 'pulse'
                    ? 'bg-amber-600/40 text-amber-100'
                    : r === 'yield'
                      ? 'bg-zinc-500/40 text-zinc-100'
                      : r === 'sentinel'
                        ? 'bg-violet-600/40 text-violet-100'
                        : 'bg-violet-600/40 text-violet-100'
                  : locked(r)
                    ? 'text-zinc-600'
                    : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {roomLabel(r)}
              {locked(r) ? ' 🔒' : ''}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 hidden sm:block">← → changer de salle</p>
      </div>

      {!connected && (
        <button type="button" className="btn-primary text-sm min-h-[44px]" onClick={requestOpenConnect}>
          Connecter xPortal
        </button>
      )}

      {/* ——— HUB ——— */}
      {room === 'hub' && (
        <>
          <MarketTape snap={ambientSnap} />
          <LiveAssetTape />
          <CommandWall
            sentiment={ambientSnap.mode === 'bear' ? -0.4 : 0.2}
            volatility={0.35}
            color={[0.15, 0.85, 0.95]}
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
          <p className="text-[12px] text-zinc-500">
            Hub : vue d’ensemble. Entre dans <strong className="text-zinc-300">Pulse</strong> (signaux
            HF), <strong className="text-zinc-300">Yield</strong> (DeFi) ou{' '}
            <strong className="text-zinc-300">Sentinel</strong> (risk / RWA).
          </p>
        </>
      )}

      {/* ——— PULSE GOLD ——— */}
      {room === 'pulse' && (
        <>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
            ⚡ GOLD — trading HF · TCA · LIA full · tape live · intensité max
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

      {/* ——— YIELD SILVER ——— */}
      {room === 'yield' && (
        <>
          <div className="rounded-xl border border-zinc-400/30 bg-zinc-500/10 px-3 py-2 text-[12px] text-zinc-200">
            📈 SILVER — DeFi sleeve · LP · staking · compound (pas TCA / LIA full)
          </div>
          <CommandWall
            sentiment={wallCfg!.sentiment}
            volatility={wallCfg!.volatility}
            pulseSpeed={wallCfg!.pulseSpeed}
            color={wallCfg!.color}
          />
          <AgentNftOrb packId="yield" aura="stable" />
          <section className="space-y-2">
            <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10 w-fit flex-wrap">
              {(['defi', 'liquidity', 'holders'] as EcoTab[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setEco(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold min-h-[44px] ${
                    eco === tab ? 'bg-zinc-500/40 text-zinc-100' : 'text-zinc-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {eco === 'defi' && (
              <p className="text-[12px] text-zinc-500">
                DeFi hub — <Link className="text-cyan-300" to="/staking">/staking</Link> · compound &
                claim
              </p>
            )}
            {eco === 'liquidity' && (
              <p className="text-[12px] text-zinc-500">
                Liquidité $TRO — <Link className="text-cyan-300" to="/lp">/lp</Link> ·{' '}
                <Link className="text-cyan-300" to="/hatom">/hatom</Link>
              </p>
            )}
            {eco === 'holders' && (
              <p className="text-[12px] text-zinc-500">Holders Yield — analytics pool & stake</p>
            )}
          </section>
          <IntentXPortalPanel />
          <DashboardSource />
        </>
      )}

      {/* ——— SENTINEL PLATINUM ——— */}
      {room === 'sentinel' && (
        <>
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-[12px] text-violet-100">
            🛡️ PLATINUM — veille · RWA · zero-trust · alertes drawdown
          </div>
          <CommandWall
            sentiment={wallCfg!.sentiment}
            volatility={wallCfg!.volatility}
            pulseSpeed={wallCfg!.pulseSpeed}
            color={wallCfg!.color}
          />
          <AgentNftOrb packId="sentinel" aura="bear" />
          <section className="rounded-2xl border border-violet-500/20 bg-black/40 p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-violet-300/80">Risk sleeve</p>
            <ul className="text-[12px] text-zinc-400 space-y-1">
              <li>· Alertes drawdown board</li>
              <li>· Certification RWA / gates zero-trust</li>
              <li>· Stratégies GUARD · ALERT · DRAWDOWN_WATCH</li>
            </ul>
            <Link to="/tca" className="text-violet-300 text-[12px] hover:underline">
              TCA Academy → Module Zero-Trust
            </Link>
          </section>
          <IntentXPortalPanel />
          <LiveNewsStream />
        </>
      )}

      <DataTunnelTransition active={tunnelRef.current} />

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/lia" className="hover:text-zinc-300">
          LIA Hub (3 écrans holo)
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          Packs
        </Link>
        <Link to="/" className="hover:text-zinc-300">
          Accueil
        </Link>
      </div>
    </div>
  )
}
