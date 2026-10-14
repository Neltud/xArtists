/**
 * Command Center — strategy programmer NFT + intents paper → xPortal.
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
import { setEmpireZone } from '../store/empireStore'
import { useI18n } from '../i18n/I18nContext'
import { useToast } from '../components/ui/Toast'
import { requestOpenConnect } from '../lib/walletEvents'
import { LIA_BADGE } from '../config/liaConfig'

type Room = 'hub' | 'pulse' | 'yield' | 'sentinel'
type EcoTab = 'defi' | 'liquidity' | 'holders'

const ROOM_IDS: Room[] = ['hub', 'pulse', 'yield', 'sentinel']

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
  useLIAInterpreter(env)
  const { push } = useToast()
  const tunnelRef = useRef(false)

  useEffect(() => {
    setEmpireZone('command')
    return () => setEmpireZone('museum')
  }, [])

  useEffect(() => {
    if (roomParam && roomParam !== room) setRoom(roomParam)
  }, [roomParam, room])

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

  const locked = (r: Room) => {
    if (r === 'hub') return false
    if (!connected) return true
    if (r === 'pulse') return !status.pulse && !status.isFull
    if (r === 'yield') return !status.yield && !status.isFull
    if (r === 'sentinel') return !status.sentinel && !status.isFull
    return false
  }

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

  return (
    <div className="animate-fade-in space-y-4 pb-24 max-w-5xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">{t('cc.title') || 'Command Center'}</p>
        <h1 className="section-title display text-2xl">L’Intellect · cockpit</h1>
        <p className="text-[11px] text-emerald-200/90 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 inline-block max-w-full">
          {LIA_BADGE}
        </p>
        <p className="text-[12px] text-zinc-500">
          Simulation & assistant de trade · paper-first · signature utilisateur uniquement.
        </p>
        <EconomicDisclosure compact />
      </header>

      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-black/40 border border-white/10 w-fit">
        {ROOM_IDS.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => onRoomClick(r)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold min-h-[36px] ${
              room === r
                ? 'bg-violet-600/40 text-violet-100'
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

      {!connected && (
        <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
          Connecter xPortal
        </button>
      )}

      <MarketTape />
      <LiveAssetTape />
      <CommandWall />
      <DashboardSource />
      <AgentRoster />
      <AgentNftOrb />
      <LiveNewsStream />

      <LiaShadowPanel />
      <AgentStrategyConfigPanel />
      <LiaSignalPanel />
      <IntentXPortalPanel />

      <section className="space-y-2">
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10 w-fit flex-wrap">
          {(['defi', 'liquidity', 'holders'] as EcoTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setEco(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold min-h-[36px] ${
                eco === tab ? 'bg-cyan-600/30 text-cyan-100' : 'text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {eco === 'defi' && (
          <p className="text-[12px] text-zinc-500">
            DeFi hub — <Link className="text-cyan-300" to="/staking">/staking</Link>
          </p>
        )}
        {eco === 'liquidity' && (
          <p className="text-[12px] text-zinc-500">
            Liquidité $TRO — <Link className="text-cyan-300" to="/marketplace">/marketplace</Link>
          </p>
        )}
        {eco === 'holders' && (
          <p className="text-[12px] text-zinc-500">Holders — analytics / market</p>
        )}
      </section>

      <ClickGuide />
      <DataTunnelTransition active={tunnelRef.current} />

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/lia" className="hover:text-zinc-300">
          LIA Hub
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
