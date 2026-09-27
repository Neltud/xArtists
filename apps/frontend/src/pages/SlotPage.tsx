/**
 * Slot public — EGLD | USDC, cagnotte progressive, grand jackpot 9/9.
 * Paper ledger. Économie dure (pool large, collections distinctes, pair rare).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import {
  SLOT_ASSETS,
  SLOT_ASSET_CONFIG,
  SLOT_USER_WIN_BPS,
  SLOT_PROGRESSIVE_CONTRIB_BPS,
  loadProgressive,
  saveProgressive,
  settleSpin,
  formatBps,
  formatSlotAmount,
  type SlotAsset,
  type SlotSplit,
} from '../config/slotEconomy'
import { dispatch8008 } from '../config/agent8008'

type CellImg = { id: string; title: string; image: string; collection?: string }

/** Chaque symbole = collection unique → plus de « Collection » quasi-auto */
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
  {
    id: 't10',
    title: 'Cipher',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-a9d35042&w=256&output=jpg&hue=280',
    collection: 'J',
  },
  {
    id: 't11',
    title: 'Drift',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-1f7cda62&w=256&output=jpg&hue=320',
    collection: 'K',
  },
  {
    id: 't12',
    title: 'Nexus',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-c4e81865&w=256&output=jpg&hue=60',
    collection: 'L',
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

/**
 * Wins stricts : pas de paire « n'importe où ».
 * Collection = 3 collections identiques sur ligne centrale uniquement.
 */
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
  // Paire adjacente uniquement (positions 3-4 ou 4-5)
  if (line[0].id === line[1].id || line[1].id === line[2].id) {
    return { tableGross: cfg.payouts.pair, isGrand: false, kind: 'Paire' }
  }
  return { tableGross: 0, isGrand: false, kind: '—' }
}

export default function SlotPage() {
  const { connected } = useWallet()
  const [asset, setAsset] = useState<SlotAsset>('EGLD')
  const cfg = SLOT_ASSET_CONFIG[asset]
  const [bank, setBank] = useState(cfg.startBank)
  const [progressive, setProgressive] = useState(() => loadProgressive('EGLD'))
  const [grid, setGrid] = useState<CellImg[]>(() => Array.from({ length: 9 }, () => FALLBACK[0]))
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [liaPaper, setLiaPaper] = useState(0)
  const [last, setLast] = useState<{ kind: string; split: SlotSplit } | null>(null)
  const [pool, setPool] = useState<CellImg[]>(FALLBACK)

  useEffect(() => {
    setBank(SLOT_ASSET_CONFIG[asset].startBank)
    setProgressive(loadProgressive(asset))
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
            // forcer collection unique par item pour éviter wins faciles
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

  const canSpin = !spinning && bank >= cfg.spinCost

  const spin = () => {
    if (!canSpin) return
    setSpinning(true)
    setBank(b => b - cfg.spinCost)
    let ticks = 0
    const id = window.setInterval(() => {
      setGrid(Array.from({ length: 9 }, () => pick(pool)))
      ticks += 1
      if (ticks >= 14) {
        window.clearInterval(id)
        const final = Array.from({ length: 9 }, () => pick(pool))
        const ev = evaluateGrid(final, asset)
        const { split, progressiveAfter } = settleSpin({
          asset,
          tableGross: ev.tableGross,
          isGrand: ev.isGrand,
          progressiveBefore: progressive,
        })
        setGrid(final)
        setLast({ kind: ev.kind, split })
        setSpins(n => n + 1)
        setProgressive(progressiveAfter)
        saveProgressive(asset, progressiveAfter)
        setLiaPaper(l => l + split.spinToLia + split.liaRake)
        if (split.userCredit > 0) setBank(b => b + split.userCredit)
        try {
          dispatch8008({
            type: 'SLOT_SPIN',
            asset,
            kind: ev.kind,
            userCredit: split.userCredit,
            isGrand: split.isGrand,
          })
        } catch {
          /* optional */
        }
        setSpinning(false)
      }
    }, 70)
  }

  const table = useMemo(() => {
    const p = cfg.payouts
    return [
      ['GRAND 9/9', `cagnotte + ${p.grandBonus} ${asset}`],
      ['Ligne 3', `${p.line3} ${asset}`],
      ['Diagonale', `${p.diagonal} ${asset}`],
      ['Collection (ligne)', `${p.collection} ${asset}`],
      ['Paire adjacente', `${p.pair} ${asset}`],
    ] as const
  }, [asset, cfg.payouts])

  return (
    <div className="animate-fade-in max-w-lg mx-auto space-y-4 pb-16">
      <header className="space-y-1">
        <p className="section-label">Fun · paper</p>
        <h1 className="section-title display text-2xl">Slot xArtists</h1>
        <p className="text-[12px] text-zinc-500">
          EGLD / USDC · cagnotte progressive · jackpot 9/9. Paper only — pas un investissement.
          House edge volontaire (RTP bas).
        </p>
      </header>

      {!connected && (
        <button type="button" className="btn-secondary w-full text-sm" onClick={() => requestOpenConnect()}>
          Connecter wallet (optionnel pour paper)
        </button>
      )}

      <div className="flex gap-2">
        {SLOT_ASSETS.map(a => (
          <button
            key={a}
            type="button"
            disabled={spinning}
            onClick={() => setAsset(a)}
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

      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">
          Banque <strong className="text-white">{formatSlotAmount(bank, asset)}</strong>
        </span>
        <span className="text-amber-300/90">
          Cagnotte {formatSlotAmount(progressive, asset)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {grid.map((cell, i) => (
          <div
            key={i}
            className={`aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50 ${
              spinning ? 'animate-pulse' : ''
            }`}
          >
            <img src={cell.image} alt={cell.title} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn-primary w-full"
        disabled={!canSpin}
        onClick={spin}
      >
        {spinning ? '…' : `Spin · ${formatSlotAmount(cfg.spinCost, asset)}`}
      </button>

      {last && (
        <p className="text-[12px] text-center text-zinc-300">
          Dernier: <strong>{last.kind}</strong>{' '}
          {last.split.userCredit > 0
            ? `+${formatSlotAmount(last.split.userCredit, asset)}`
            : '—'}
        </p>
      )}

      <p className="text-[11px] text-zinc-600 text-center">
        Spins {spins} · LIA paper {formatSlotAmount(liaPaper, asset)} · user{' '}
        {formatBps(SLOT_USER_WIN_BPS)} des wins · progressive{' '}
        {formatBps(SLOT_PROGRESSIVE_CONTRIB_BPS)} des mises
      </p>

      <div className="card text-[11px] text-zinc-500 space-y-1">
        <p className="text-zinc-400 font-medium">Table (paper)</p>
        {table.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span>{k}</span>
            <span className="text-zinc-300">{v}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/market" className="text-cyan-400 hover:underline">
          Marketplace
        </Link>{' '}
        · SC slot après audit
      </p>
    </div>
  )
}
