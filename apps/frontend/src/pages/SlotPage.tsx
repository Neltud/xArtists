/** Slot premium Fun — symboles style NFT, musique on/off, FX. */
import { useEffect, useRef, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import {
  SLOT_ASSETS,
  SLOT_ASSET_CONFIG,
  SLOT_BET_MULTS,
  loadProgressive,
  saveProgressive,
  settleSpin,
  spinCostFor,
  formatSlotAmount,
  type SlotAsset,
  type SlotBetMult,
} from '../config/slotEconomy'
import { playUiSound, unlockAudio } from '../hooks/useFuturisticSounds'
import { canSpinSlot, SLOT_CASINO_ADDRESS } from '../config/scStatus'
import { useSlotTx } from '../hooks/useSlotTx'
import { canSpinRealAgainstHouse, refreshHouseFromApi } from '../lib/slotHouseGuard'
import SlotModeSwitch, { type SlotPlayMode } from '../components/slot/SlotModeSwitch'
import PotsStrip from '../components/slot/PotsStrip'
import FeeTransparency from '../components/ui/FeeTransparency'
import { useToast } from '../components/ui/Toast'
import { LINKS } from '../config/links'
import { useI18n } from '../i18n/I18nContext'

type Cell = { id: string; label: string; tone: string; emoji: string }

/** Visuels « carte NFT » (emoji + gradient) — montée en gamme sans assets externes */
const SYMBOLS: Cell[] = [
  { id: 'pulse', label: 'Pulse', emoji: '⚡', tone: 'from-violet-700 via-fuchsia-600 to-pink-500' },
  { id: 'yield', label: 'Yield', emoji: '🌾', tone: 'from-teal-700 via-emerald-500 to-lime-400' },
  { id: 'sentinel', label: 'Guard', emoji: '🛡', tone: 'from-sky-800 via-blue-500 to-cyan-400' },
  { id: 'tro', label: 'TRO', emoji: '◎', tone: 'from-amber-600 via-yellow-500 to-orange-400' },
  { id: 'art', label: 'Art', emoji: '🖼', tone: 'from-indigo-700 via-violet-500 to-purple-400' },
  { id: 'star', label: 'Star', emoji: '✦', tone: 'from-rose-600 via-pink-500 to-fuchsia-400' },
]

function pick(): Cell {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] || SYMBOLS[0]
}

function evaluate(grid: Cell[], asset: SlotAsset) {
  const cfg = SLOT_ASSET_CONFIG[asset]
  if (!cfg) return { tableGross: 0, isGrand: false, kind: '—' }
  const ids = grid.map(c => c.id)
  if (ids.every(id => id === ids[0])) return { tableGross: cfg.payouts.grandBonus, isGrand: true, kind: 'Jackpot' }
  const line = [grid[3], grid[4], grid[5]]
  if (line[0]?.id === line[1]?.id && line[1]?.id === line[2]?.id)
    return { tableGross: cfg.payouts.line3, isGrand: false, kind: 'Ligne' }
  if (grid[0]?.id === grid[4]?.id && grid[4]?.id === grid[8]?.id)
    return { tableGross: cfg.payouts.diagonal, isGrand: false, kind: 'Diagonale' }
  if (line[0]?.id === line[1]?.id || line[1]?.id === line[2]?.id)
    return { tableGross: cfg.payouts.pair, isGrand: false, kind: 'Paire' }
  return { tableGross: 0, isGrand: false, kind: '—' }
}

export default function SlotPage() {
  const { t } = useI18n()
  const { connected, canAttemptSign } = useWallet()
  const scLive = canSpinSlot()
  const { push } = useToast()
  useEffect(() => {
    if (scLive && SLOT_CASINO_ADDRESS) void refreshHouseFromApi(SLOT_CASINO_ADDRESS)
  }, [scLive])
  const { spinEgld, pending: txPending, lastTx, slotSpinBroken } = useSlotTx()
  const houseGuard = canSpinRealAgainstHouse('EGLD')

  const [mode, setMode] = useState<SlotPlayMode>('paper')
  const [confirmedReal, setConfirmedReal] = useState(false)
  const [asset, setAsset] = useState<SlotAsset>('EGLD')
  const cfg = SLOT_ASSET_CONFIG[asset] || SLOT_ASSET_CONFIG.EGLD
  const [betMult, setBetMult] = useState<SlotBetMult>(1)
  const [bank, setBank] = useState(() => cfg.startBank)
  const [progEgld, setProgEgld] = useState(() => loadProgressive('EGLD'))
  const [progUsdc, setProgUsdc] = useState(() => loadProgressive('USDC'))
  const progressiveOf = (a: SlotAsset) => (a === 'USDC' ? progUsdc : progEgld)
  const setProgressiveOf = (a: SlotAsset, v: number) => {
    if (a === 'USDC') setProgUsdc(v)
    else setProgEgld(v)
    saveProgressive(a, v)
  }

  const [grid, setGrid] = useState<Cell[]>(() => Array.from({ length: 9 }, pick))
  const [spinning, setSpinning] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [winPulse, setWinPulse] = useState(false)
  const [musicOn, setMusicOn] = useState(true)
  const chainMode = mode === 'chain' && !slotSpinBroken
  const spinRef = useRef(0)

  const cost = spinCostFor(asset, betMult)
  const canPaper = !spinning && bank >= cost
  const canReal =
    !slotSpinBroken &&
    scLive &&
    connected &&
    canAttemptSign &&
    asset === 'EGLD' &&
    houseGuard.ok &&
    !txPending &&
    confirmedReal

  const sfx = (name: 'slot_spin' | 'ui_tap' | 'slot_win') => {
    if (!musicOn) return
    unlockAudio()
    playUiSound(name)
  }

  const finishPaper = (final: Cell[]) => {
    const ev = evaluate(final, asset)
    const before = progressiveOf(asset)
    const { split, progressiveAfter } = settleSpin({
      asset,
      tableGross: ev.tableGross,
      isGrand: ev.isGrand,
      progressiveBefore: before,
      betMult,
    })
    setBank(b => Math.max(0, b - cost + split.userCredit))
    setProgressiveOf(asset, progressiveAfter)
    setFlash(ev.kind === '—' ? t('slot.miss') : ev.kind)
    if (ev.tableGross > 0) {
      setWinPulse(true)
      sfx('slot_win')
      window.setTimeout(() => setWinPulse(false), 900)
    }
    setSpinning(false)
  }

  const spinPaper = () => {
    if (!canPaper) return
    setSpinning(true)
    setFlash(null)
    sfx('slot_spin')
    spinRef.current += 1
    let n = 0
    const id = window.setInterval(() => {
      setGrid(Array.from({ length: 9 }, pick))
      n += 1
      if (n >= 12) {
        clearInterval(id)
        const final = Array.from({ length: 9 }, pick)
        setGrid(final)
        finishPaper(final)
      }
    }, 70)
  }

  const spinReal = async () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    if (!canReal) {
      push(slotSpinBroken ? t('slot.real.paused') : t('slot.real.blocked'), 'err')
      return
    }
    try {
      await spinEgld(cost)
    } catch (e) {
      push(e instanceof Error ? e.message : t('common.error'), 'err')
    }
  }

  return (
    <div className="animate-fade-in space-y-5 max-w-lg mx-auto pb-20">
      <header className="space-y-1">
        <p className="section-label">{t('nav.slot')}</p>
        <div className="flex items-center justify-between gap-2">
          <h1 className="section-title display text-2xl">{t('slot.title')}</h1>
          <button
            type="button"
            onClick={() => {
              setMusicOn(m => !m)
              sfx('ui_tap')
            }}
            className={`rounded-full px-3 py-1.5 text-[12px] border flex items-center gap-1.5 ${
              musicOn
                ? 'border-violet-400/40 bg-violet-500/20 text-violet-100'
                : 'border-white/10 text-zinc-500'
            }`}
            aria-pressed={musicOn}
          >
            <span aria-hidden>{musicOn ? '♪' : 'MUTE'}</span>
            {t('slot.music')}
          </button>
        </div>
        <p className="text-sm text-zinc-400">{t('slot.lead')}</p>
      </header>

      <PotsStrip
        virtualEgld={progEgld}
        onTapVirtual={() => push(t('slot.pot.hint'), 'info')}
      />

      <SlotModeSwitch
        mode={mode}
        onChange={m => setMode(slotSpinBroken && m === 'chain' ? 'paper' : m)}
        confirmedReal={confirmedReal}
        onConfirmReal={setConfirmedReal}
      />

      <div className="flex gap-2">
        {SLOT_ASSETS.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAsset(a)
              setBank(SLOT_ASSET_CONFIG[a].startBank)
            }}
            className={`px-3 py-1.5 rounded-lg text-sm ${asset === a ? 'bg-white/15 text-white' : 'text-zinc-500'}`}
          >
            {a}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-3 gap-2.5 rounded-3xl p-2 border border-white/10 bg-black/40 ${
          winPulse ? 'ring-2 ring-amber-400/60 shadow-[0_0_40px_rgba(251,191,36,0.25)]' : ''
        } ${spinning ? 'animate-pulse' : ''}`}
      >
        {grid.map((c, i) => (
          <div
            key={`${spinRef.current}-${i}`}
            className={`aspect-square rounded-2xl bg-gradient-to-br ${c.tone} flex flex-col items-center justify-center text-white shadow-lg border border-white/10 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
            <span className="relative text-3xl drop-shadow-md">{c.emoji}</span>
            <span className="relative text-[9px] font-semibold tracking-wide opacity-90 mt-0.5">{c.label}</span>
          </div>
        ))}
      </div>

      {flash && (
        <p className="text-center text-sm font-medium text-zinc-200 tracking-wide">{flash}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {SLOT_BET_MULTS.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setBetMult(m)}
            className={`px-2.5 py-1 rounded-lg text-xs ${betMult === m ? 'bg-violet-500/30 text-white' : 'text-zinc-500 border border-white/10'}`}
          >
            ×{m}
          </button>
        ))}
      </div>

      {chainMode ? (
        <button type="button" className="btn-primary w-full" disabled={!canReal} onClick={() => void spinReal()}>
          {txPending ? '…' : `${t('slot.spin')} · ${formatSlotAmount(cost, 'EGLD')}`}
        </button>
      ) : (
        <button type="button" className="btn-primary w-full" disabled={!canPaper} onClick={spinPaper}>
          {spinning ? '…' : `${t('slot.spin')} · ${formatSlotAmount(cost, asset)}`}
        </button>
      )}

      <p className="text-[12px] text-zinc-500">{t('slot.bank')} {formatSlotAmount(bank, asset)}</p>
      <FeeTransparency kind="slot-paper" />
      {lastTx && (
        <a className="text-xs text-cyan-400 underline" href={`${LINKS.explorer}/transactions/${lastTx}`} target="_blank" rel="noreferrer">
          TX →
        </a>
      )}
    </div>
  )
}
