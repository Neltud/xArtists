/**
 * Slot xArtists — paper ledger + bet sizes + buy-bonus + SFX/effects.
 * SC on-chain gated (CODEHASH) — UI reste jouable en paper.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import {
  SLOT_ASSETS,
  SLOT_ASSET_CONFIG,
  SLOT_BET_MULTS,
  SLOT_BONUS,
  SLOT_USER_WIN_BPS,
  SLOT_PROGRESSIVE_CONTRIB_BPS,
  loadProgressive,
  saveProgressive,
  settleSpin,
  spinCostFor,
  bonusCostFor,
  formatBps,
  formatSlotAmount,
  type SlotAsset,
  type SlotSplit,
  type SlotBetMult,
} from '../config/slotEconomy'
import { dispatch8008 } from '../config/agent8008'
import { playUiSound, unlockAudio } from '../hooks/useFuturisticSounds'
import { canSpinSlot, SLOT_CASINO_ADDRESS } from '../config/scStatus'

type CellImg = { id: string; title: string; image: string; collection?: string }

const FALLBACK: CellImg[] = [
  {
    id: 't1',
    title: 'Meteorite',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-02792a97&w=256&output=jpg',
    collection: 'A',
  },
  {
    id: 't2',
    title: 'Artpocalypse',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-232735fa&w=256&output=jpg',
    collection: 'B',
  },
  {
    id: 't3',
    title: 'Serenity',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-aa98c0da&w=256&output=jpg',
    collection: 'C',
  },
  {
    id: 't4',
    title: 'Traveller',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-a9d35042&w=256&output=jpg',
    collection: 'D',
  },
  {
    id: 't5',
    title: 'Strange Cat',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-1f7cda62&w=256&output=jpg',
    collection: 'E',
  },
  {
    id: 't6',
    title: 'Father',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-c4e81865&w=256&output=jpg',
    collection: 'F',
  },
  {
    id: 't7',
    title: 'Void',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-02792a97&w=256&output=jpg&hue=40',
    collection: 'G',
  },
  {
    id: 't8',
    title: 'Echo',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-232735fa&w=256&output=jpg&hue=120',
    collection: 'H',
  },
  {
    id: 't9',
    title: 'Bloom',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-aa98c0da&w=256&output=jpg&hue=200',
    collection: 'I',
  },
]

function corsImg(url: string): string {
  if (!url) return ''
  if (url.includes('weserv.nl') || url.includes('wsrv.nl')) return url
  try {
    const bare = url.replace(/^https?:\/\//i, '')
    return `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=256&output=jpg&q=80`
  } catch {
    return url
  }
}

function pick(pool: CellImg[]): CellImg {
  return pool[Math.floor(Math.random() * pool.length)] || FALLBACK[0]
}

function evaluateGrid(
  grid: CellImg[],
  asset: SlotAsset,
): { tableGross: number; isGrand: boolean; kind: string } {
  const cfg = SLOT_ASSET_CONFIG[asset]
  const ids = grid.map(c => c.id)
  const allSame = ids.every(id => id === ids[0])
  if (allSame) {
    return { tableGross: cfg.payouts.grandBonus, isGrand: true, kind: 'GRAND 9/9' }
  }
  const line = [grid[3], grid[4], grid[5]]
  if (line[0].id === line[1].id && line[1].id === line[2].id) {
    return { tableGross: cfg.payouts.line3, isGrand: false, kind: 'Ligne 3' }
  }
  const d1 = [grid[0], grid[4], grid[8]]
  const d2 = [grid[2], grid[4], grid[6]]
  if (d1[0].id === d1[1].id && d1[1].id === d1[2].id) {
    return { tableGross: cfg.payouts.diagonal, isGrand: false, kind: 'Diagonale' }
  }
  if (d2[0].id === d2[1].id && d2[1].id === d2[2].id) {
    return { tableGross: cfg.payouts.diagonal, isGrand: false, kind: 'Diagonale' }
  }
  const cols = line.map(c => c.collection).filter(Boolean)
  if (cols.length === 3 && cols[0] === cols[1] && cols[1] === cols[2]) {
    return { tableGross: cfg.payouts.collection, isGrand: false, kind: 'Collection' }
  }
  if (line[0].id === line[1].id || line[1].id === line[2].id) {
    return { tableGross: cfg.payouts.pair, isGrand: false, kind: 'Paire' }
  }
  return { tableGross: 0, isGrand: false, kind: '—' }
}

export default function SlotPage() {
  const { connected } = useWallet()
  const scLive = canSpinSlot()
  const [asset, setAsset] = useState<SlotAsset>('EGLD')
  const cfg = SLOT_ASSET_CONFIG[asset]
  const [betMult, setBetMult] = useState<SlotBetMult>(1)
  const [bank, setBank] = useState(cfg.startBank)
  const [progressive, setProgressive] = useState(() => loadProgressive('EGLD'))
  const [grid, setGrid] = useState<CellImg[]>(() => Array.from({ length: 9 }, () => FALLBACK[0]))
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [liaPaper, setLiaPaper] = useState(0)
  const [last, setLast] = useState<{ kind: string; split: SlotSplit } | null>(null)
  const [pool, setPool] = useState<CellImg[]>(FALLBACK)
  const [bonusLeft, setBonusLeft] = useState(0)
  const [flash, setFlash] = useState<'win' | 'jackpot' | 'bonus' | null>(null)
  const [shake, setShake] = useState(false)

  const cost = spinCostFor(asset, betMult)
  const bonusCost = bonusCostFor(asset, betMult)
  const inBonus = bonusLeft > 0

  useEffect(() => {
    setBank(SLOT_ASSET_CONFIG[asset].startBank)
    setProgressive(loadProgressive(asset))
    setBonusLeft(0)
    setBetMult(1)
  }, [asset])

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}data/catalog_sample.json`, {
          cache: 'no-store',
        })
        if (!r.ok) return
        const j = await r.json()
        const items = (j?.items || j || []) as Array<{
          identifier?: string
          name?: string
          url?: string
          collection?: string
        }>
        const mapped: CellImg[] = items
          .slice(0, 36)
          .map((it, i) => ({
            id: it.identifier || `c${i}`,
            title: it.name || `NFT ${i}`,
            image: corsImg(it.url || ''),
            collection: it.identifier || it.collection || `X${i}`,
          }))
          .filter(x => x.image)
        if (!c && mapped.length >= 4) setPool([...FALLBACK, ...mapped])
      } catch {
        /* fallback */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const canSpin = !spinning && (inBonus || bank >= cost)
  const canBuyBonus = !spinning && !inBonus && bank >= bonusCost

  const runSpin = (free: boolean) => {
    if (spinning) return
    if (!free && bank < cost) return
    unlockAudio()
    playUiSound('slot_spin')
    setSpinning(true)
    setFlash(null)
    if (!free) setBank(b => b - cost)

    let ticks = 0
    const id = window.setInterval(() => {
      setGrid(Array.from({ length: 9 }, () => pick(pool)))
      if (ticks % 2 === 0) playUiSound('slot_reel')
      ticks += 1
      if (ticks >= 16) {
        window.clearInterval(id)
        const final = Array.from({ length: 9 }, () => pick(pool))
        const ev = evaluateGrid(final, asset)
        const { split, progressiveAfter } = settleSpin({
          asset,
          tableGross: ev.tableGross,
          isGrand: ev.isGrand,
          progressiveBefore: progressive,
          betMult,
          inBonus: free,
        })
        setGrid(final)
        setLast({ kind: ev.kind, split })
        setSpins(n => n + 1)
        setProgressive(progressiveAfter)
        saveProgressive(asset, progressiveAfter)
        setLiaPaper(l => l + split.spinToLia + split.liaRake)
        if (split.userCredit > 0) setBank(b => b + split.userCredit)

        if (split.isGrand) {
          playUiSound('slot_jackpot')
          setFlash('jackpot')
          setShake(true)
          setTimeout(() => setShake(false), 600)
        } else if (split.userCredit > 0) {
          playUiSound('slot_win')
          setFlash('win')
        }

        if (free) setBonusLeft(n => Math.max(0, n - 1))

        try {
          dispatch8008({
            type: 'SLOT_SPIN',
            asset,
            kind: ev.kind,
            userCredit: split.userCredit,
            isGrand: split.isGrand,
            betMult,
            inBonus: free,
          })
        } catch {
          /* optional */
        }
        setSpinning(false)
        setTimeout(() => setFlash(null), 1200)
      }
    }, 65)
  }

  const spin = () => {
    if (!canSpin) return
    runSpin(inBonus)
  }

  const buyBonus = () => {
    if (!canBuyBonus) return
    unlockAudio()
    playUiSound('slot_bonus')
    setBank(b => b - bonusCost)
    setBonusLeft(SLOT_BONUS.freeSpins)
    setFlash('bonus')
    setTimeout(() => setFlash(null), 1000)
  }

  const table = useMemo(() => {
    const p = cfg.payouts
    const m = betMult
    return [
      ['GRAND 9/9', `cagnotte + ${p.grandBonus * m} ${asset}`],
      ['Ligne 3', `${p.line3 * m} ${asset}`],
      ['Diagonale', `${p.diagonal * m} ${asset}`],
      ['Collection', `${p.collection * m} ${asset}`],
      ['Paire', `${p.pair * m} ${asset}`],
      ['Bonus', `${SLOT_BONUS.freeSpins} free · ×${SLOT_BONUS.winMult} wins`],
    ] as const
  }, [asset, cfg.payouts, betMult])

  return (
    <div
      className={`animate-fade-in max-w-lg mx-auto space-y-4 pb-16 relative ${
        shake ? 'animate-pulse' : ''
      }`}
    >
      {flash && (
        <div
          className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center ${
            flash === 'jackpot'
              ? 'bg-amber-500/20'
              : flash === 'bonus'
                ? 'bg-violet-500/15'
                : 'bg-emerald-500/10'
          }`}
        >
          <p className="text-2xl font-black tracking-widest text-white drop-shadow-lg">
            {flash === 'jackpot' ? 'JACKPOT' : flash === 'bonus' ? 'BONUS' : 'WIN'}
          </p>
        </div>
      )}

      <header className="space-y-1">
        <p className="section-label">Fun · paper{scLive ? ' · SC gated' : ''}</p>
        <h1 className="section-title display text-2xl">Slot xArtists</h1>
        <p className="text-[12px] text-zinc-500">
          Mise · buy-bonus · SFX. Paper ledger — pas un investissement. House edge volontaire.
        </p>
        <p className="text-[10px] mono text-zinc-600 truncate">
          SC {SLOT_CASINO_ADDRESS.slice(0, 22)}… {scLive ? 'CODEHASH ok' : 'spin on-chain OFF'}
        </p>
      </header>

      {!connected && (
        <button type="button" className="btn-secondary w-full text-sm" onClick={() => requestOpenConnect()}>
          Connecter wallet (optionnel paper)
        </button>
      )}

      <div className="flex gap-2">
        {SLOT_ASSETS.map(a => (
          <button
            key={a}
            type="button"
            disabled={spinning || inBonus}
            onClick={() => {
              playUiSound('click')
              setAsset(a)
            }}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
              asset === a
                ? 'border-violet-400/50 bg-violet-500/15 text-white'
                : 'border-white/10 text-zinc-400'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Bet size */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Taille de mise</p>
        <div className="flex gap-2">
          {SLOT_BET_MULTS.map(m => (
            <button
              key={m}
              type="button"
              disabled={spinning || inBonus}
              onClick={() => {
                playUiSound('click')
                setBetMult(m)
              }}
              className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${
                betMult === m
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
                  : 'border-white/10 text-zinc-400'
              }`}
            >
              ×{m}
              <span className="block text-[9px] font-normal opacity-70">
                {formatSlotAmount(spinCostFor(asset, m), asset)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">
          Banque <strong className="text-white">{formatSlotAmount(bank, asset)}</strong>
        </span>
        <span className="text-amber-300/90">
          Cagnotte {formatSlotAmount(progressive, asset)}
        </span>
      </div>

      {inBonus && (
        <div className="rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-center text-sm text-violet-100">
          BONUS · {bonusLeft} free spin{bonusLeft > 1 ? 's' : ''} · wins ×{SLOT_BONUS.winMult}
        </div>
      )}

      <div
        className={`grid grid-cols-3 gap-2 rounded-2xl p-1 transition ${
          spinning ? 'ring-2 ring-cyan-400/40' : flash === 'win' ? 'ring-2 ring-emerald-400/50' : ''
        }`}
      >
        {grid.map((cell, i) => (
          <div
            key={i}
            className={`aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50 ${
              spinning ? 'opacity-80 blur-[1px] scale-[0.98]' : ''
            } transition-all duration-75`}
          >
            <img src={cell.image} alt={cell.title} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <button type="button" className="btn-primary w-full" disabled={!canSpin} onClick={spin}>
        {spinning
          ? '…'
          : inBonus
            ? `Free spin · ${bonusLeft} left`
            : `Spin · ${formatSlotAmount(cost, asset)}`}
      </button>

      <button
        type="button"
        className="w-full rounded-xl border border-violet-400/40 bg-violet-500/10 py-2.5 text-sm font-semibold text-violet-100 disabled:opacity-40"
        disabled={!canBuyBonus}
        onClick={buyBonus}
      >
        Buy Bonus · {formatSlotAmount(bonusCost, asset)} · {SLOT_BONUS.freeSpins} spins ×
        {SLOT_BONUS.winMult}
      </button>

      {last && (
        <p className="text-[12px] text-center text-zinc-300">
          Dernier: <strong>{last.kind}</strong>{' '}
          {last.split.userCredit > 0
            ? `+${formatSlotAmount(last.split.userCredit, asset)}`
            : '—'}
          {last.split.inBonus ? ' · bonus' : ''} · ×{last.split.betMult}
        </p>
      )}

      <p className="text-[11px] text-zinc-600 text-center">
        Spins {spins} · LIA paper {formatSlotAmount(liaPaper, asset)} · user{' '}
        {formatBps(SLOT_USER_WIN_BPS)} wins · progressive{' '}
        {formatBps(SLOT_PROGRESSIVE_CONTRIB_BPS)} mises
      </p>

      <div className="card text-[11px] text-zinc-500 space-y-1">
        <p className="text-zinc-400 font-medium">Table (× mise)</p>
        {table.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span>{k}</span>
            <span className="text-zinc-300 text-right">{v}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/marketplace" className="text-cyan-400 hover:underline">
          Marketplace
        </Link>{' '}
        · Active SFX via dock 🔊 · SC spin après fund + secret CODEHASH
      </p>
    </div>
  )
}
