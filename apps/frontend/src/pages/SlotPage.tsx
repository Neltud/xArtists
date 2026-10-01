/** Slot — FUN paper / REAL on-chain. Symboles locaux. */
import { useEffect, useState } from 'react'
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

type Cell = { id: string; label: string; tone: string }

const SYMBOLS: Cell[] = [
  { id: 'star', label: '✦', tone: 'from-violet-600 to-fuchsia-500' },
  { id: 'orb', label: '◉', tone: 'from-cyan-600 to-sky-400' },
  { id: 'gem', label: '◈', tone: 'from-emerald-600 to-teal-400' },
  { id: 'sun', label: '◇', tone: 'from-amber-500 to-orange-400' },
  { id: 'moon', label: '☽', tone: 'from-indigo-600 to-blue-400' },
  { id: 'bolt', label: '⚡', tone: 'from-yellow-400 to-amber-600' },
]

function pick(): Cell {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] || SYMBOLS[0]
}

function evaluate(grid: Cell[], asset: SlotAsset) {
  const cfg = SLOT_ASSET_CONFIG[asset]
  const ids = grid.map(c => c.id)
  if (ids.every(id => id === ids[0])) return { tableGross: cfg.payouts.grandBonus, isGrand: true, kind: 'Jackpot' }
  const line = [grid[3], grid[4], grid[5]]
  if (line[0].id === line[1].id && line[1].id === line[2].id)
    return { tableGross: cfg.payouts.line3, isGrand: false, kind: 'Ligne' }
  if (grid[0].id === grid[4].id && grid[4].id === grid[8].id)
    return { tableGross: cfg.payouts.diagonal, isGrand: false, kind: 'Diagonale' }
  if (line[0].id === line[1].id || line[1].id === line[2].id)
    return { tableGross: cfg.payouts.pair, isGrand: false, kind: 'Paire' }
  return { tableGross: 0, isGrand: false, kind: '—' }
}

export default function SlotPage() {
  const { connected, canAttemptSign } = useWallet()
  const scLive = canSpinSlot()
  const { push } = useToast()
  useEffect(() => {
    if (scLive && SLOT_CASINO_ADDRESS) void refreshHouseFromApi(SLOT_CASINO_ADDRESS)
  }, [scLive])
  const { spinEgld, pending: txPending, lastTx } = useSlotTx()
  const houseGuard = canSpinRealAgainstHouse('EGLD')

  const [mode, setMode] = useState<SlotPlayMode>('paper')
  const [confirmedReal, setConfirmedReal] = useState(false)
  const [asset, setAsset] = useState<SlotAsset>('EGLD')
  const cfg = SLOT_ASSET_CONFIG[asset]
  const [betMult, setBetMult] = useState<SlotBetMult>(1)
  const [bank, setBank] = useState(cfg.startBank)
  const [progressive, setProgressive] = useState(() => loadProgressive())
  const [grid, setGrid] = useState<Cell[]>(() => Array.from({ length: 9 }, pick))
  const [spinning, setSpinning] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const chainMode = mode === 'chain'

  const cost = spinCostFor(asset, betMult)
  const canPaper = !spinning && bank >= cost
  const canReal =
    scLive && connected && canAttemptSign && asset === 'EGLD' && houseGuard.ok && !txPending && confirmedReal

  const finishPaper = (final: Cell[]) => {
    const ev = evaluate(final, asset)
    const { split, progressiveAfter } = settleSpin({
      asset,
      tableGross: ev.tableGross,
      isGrand: ev.isGrand,
      progressiveBefore: progressive[asset] || 0,
      betMult,
    })
    setBank(b => Math.max(0, b - cost + split.userCredit))
    const next = { ...progressive, [asset]: progressiveAfter }
    saveProgressive(next)
    setProgressive(next)
    setFlash(ev.kind === '—' ? 'Rien' : ev.kind)
    setSpinning(false)
  }

  const spinPaper = () => {
    if (!canPaper) return
    setSpinning(true)
    setFlash(null)
    unlockAudio()
    playUiSound('slot_spin')
    let n = 0
    const id = window.setInterval(() => {
      setGrid(Array.from({ length: 9 }, pick))
      n += 1
      if (n >= 10) {
        clearInterval(id)
        const final = Array.from({ length: 9 }, pick)
        setGrid(final)
        finishPaper(final)
      }
    }, 80)
  }

  const spinReal = async () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    if (!canReal) return
    try {
      await spinEgld(cost)
    } catch {
      /* hook */
    }
  }

  return (
    <div className="animate-fade-in space-y-5 max-w-lg mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Casino</p>
        <h1 className="section-title display text-2xl">Slot</h1>
        <p className="text-sm text-zinc-400">Fun = crédits virtuels. Réel = EGLD on-chain.</p>
      </header>

      <PotsStrip
        virtualEgld={progressive.EGLD || 0}
        onTapVirtual={() =>
          push(
            'Ces crédits sont virtuels et destinés au jeu. Les gains réels passent par la caisse on-chain.',
            'info',
          )
        }
      />

      <SlotModeSwitch
        mode={mode}
        onChange={setMode}
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

      <div className="grid grid-cols-3 gap-2">
        {grid.map((c, i) => (
          <div
            key={i}
            className={`aspect-square rounded-2xl bg-gradient-to-br ${c.tone} flex items-center justify-center text-3xl text-white`}
          >
            {c.label}
          </div>
        ))}
      </div>

      {flash && <p className="text-center text-sm text-zinc-300">{flash}</p>}

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
          {txPending ? 'Signature…' : `Tourner · ${formatSlotAmount(cost, 'EGLD')}`}
        </button>
      ) : (
        <button type="button" className="btn-primary w-full" disabled={!canPaper} onClick={spinPaper}>
          {spinning ? '…' : `Tourner · ${formatSlotAmount(cost, asset)}`}
        </button>
      )}

      <p className="text-[12px] text-zinc-500">Banque paper {formatSlotAmount(bank, asset)}</p>
      <FeeTransparency kind="slot-paper" />
      {lastTx && (
        <a className="text-xs text-cyan-400 underline" href={`${LINKS.explorer}/transactions/${lastTx}`} target="_blank" rel="noreferrer">
          Dernière TX →
        </a>
      )}
    </div>
  )
}
