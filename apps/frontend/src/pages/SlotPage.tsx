/**
 * Slot public — EGLD | USDC, cagnotte progressive, grand jackpot 9/9.
 * Paper ledger (localStorage). Grand public. SC claim OFF.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import {
  SLOT_ASSETS,
  SLOT_ASSET_CONFIG,
  SLOT_USER_WIN_BPS,
  SLOT_LIA_WIN_RAKE_BPS,
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

const FALLBACK: CellImg[] = [
  {
    id: 't1',
    title: 'Meteorite',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-02792a97&w=256&output=jpg',
    collection: 'NFTUDURI',
  },
  {
    id: 't2',
    title: 'Artpocalypse',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-232735fa&w=256&output=jpg',
    collection: 'NFTUDURI',
  },
  {
    id: 't3',
    title: 'Serenity',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-aa98c0da&w=256&output=jpg',
    collection: 'NFTUDURI',
  },
  {
    id: 't4',
    title: 'Traveller',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-a9d35042&w=256&output=jpg',
    collection: 'NFTUDURI',
  },
  {
    id: 't5',
    title: 'Strange Cat',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-1f7cda62&w=256&output=jpg',
    collection: 'NFTUDURI',
  },
  {
    id: 't6',
    title: 'Father',
    image:
      'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-c4e81865&w=256&output=jpg',
    collection: 'NFTUDURI',
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

/** Table gains (hors progressive). Grand = 9 mêmes symboles. */
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
  if (line[0].id === line[1].id || line[1].id === line[2].id || line[0].id === line[2].id) {
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
  const [log, setLog] = useState<string[]>([])
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
          .slice(0, 24)
          .map((it, i) => ({
            id: it.identifier || `c${i}`,
            title: it.name || `NFT ${i}`,
            image: corsImg(it.url || ''),
            collection: it.collection,
          }))
          .filter(x => x.image)
        if (!c && mapped.length >= 4) setPool([...FALLBACK, ...mapped])
      } catch {
        /* fallback pool */
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
        const line = ev.isGrand
          ? `🏆 ${ev.kind} · cagnotte ${formatSlotAmount(split.progressivePaid, asset)} → user +${split.userCredit}`
          : split.grossWin > 0
            ? `${ev.kind} · +${split.userCredit} ${asset} · pot +${split.toProgressive}`
            : `— · mise → pot +${split.toProgressive} · LIA +${split.spinToLia}`
        setLog(l => [line, ...l].slice(0, 12))
        dispatch8008('SLOT_SPIN', {
          raw: `slot spin ${asset}`,
          asset,
          isGrand: ev.isGrand,
          userCredit: split.userCredit,
          toProgressive: split.toProgressive,
          liaRake: split.liaRake + split.spinToLia,
        })
        setSpinning(false)
      }
    }, 60)
  }

  const paytable = useMemo(() => {
    const p = cfg.payouts
    return [
      ['GRAND 9/9 mêmes symboles', `toute la cagnotte + ${p.grandBonus} ${asset}`],
      ['3 identiques ligne centrale', `+${p.line3} ${asset} brut`],
      ['Diagonale 3 identiques', `+${p.diagonal} ${asset} brut`],
      ['3× collection (ligne)', `+${p.collection} ${asset} brut`],
      ['Paire ligne', `+${p.pair} ${asset} brut`],
      ['Mise → progressive', formatBps(SLOT_PROGRESSIVE_CONTRIB_BPS)],
      ['Split gains table', `user ${formatBps(SLOT_USER_WIN_BPS)} · LIA ${formatBps(SLOT_LIA_WIN_RAKE_BPS)}`],
    ]
  }, [asset, cfg.payouts])

  return (
    <div className="animate-fade-in space-y-6 pb-12 max-w-lg mx-auto">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Slot · paper mainnet-ready
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Casino NFT 3×3</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Mise en <strong className="text-zinc-300">EGLD</strong> ou{" "}
          <strong className="text-zinc-300">USDC</strong> · cagnotte progressive · grand jackpot 9/9.
          Ledger paper local — SC claim OFF.
        </p>
      </header>

      <div className="flex gap-2">
        {SLOT_ASSETS.map(a => (
          <button
            key={a}
            type="button"
            disabled={spinning}
            onClick={() => setAsset(a)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              asset === a
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
                : 'border-white/10 bg-black/30 text-zinc-400'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 space-y-3">
        <div className="flex justify-between text-[12px] text-zinc-400">
          <span>
            Banque{" "}
            <strong className="text-white tabular-nums">{formatSlotAmount(bank, asset)}</strong>
          </span>
          <span>
            Cagnotte{" "}
            <strong className="text-amber-200 tabular-nums">
              {formatSlotAmount(progressive, asset)}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {grid.map((cell, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg border border-white/10 overflow-hidden bg-black/50 ${
                spinning ? 'animate-pulse' : ''
              }`}
            >
              <img
                src={cell.image}
                alt={cell.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-primary w-full"
          disabled={!canSpin}
          onClick={spin}
        >
          {spinning
            ? '…'
            : `Spin · ${formatSlotAmount(cfg.spinCost, asset)}`}
        </button>

        {last && (
          <p className="text-[12px] text-zinc-300">
            Dernier: {last.kind}
            {last.split.userCredit > 0 && (
              <span className="text-emerald-300">
                {' '}
                +{formatSlotAmount(last.split.userCredit, asset)}
              </span>
            )}
          </p>
        )}

        <p className="text-[11px] text-zinc-600">
          Spins {spins} · LIA paper {formatSlotAmount(liaPaper, asset)}
          {!connected && (
            <>
              {' · '}
              <button type="button" className="text-zinc-400 underline" onClick={() => requestOpenConnect()}>
                Connect
              </button>
            </>
          )}
        </p>
      </div>

      <section className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Paytable</p>
        {paytable.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 text-[11px]">
            <span className="text-zinc-400">{k}</span>
            <span className="text-zinc-300 tabular-nums shrink-0">{v}</span>
          </div>
        ))}
      </section>

      {log.length > 0 && (
        <ul className="text-[11px] text-zinc-500 space-y-0.5">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-zinc-600">
        <Link to="/lia" className="text-zinc-400 hover:underline">
          LIA / 8008
        </Link>
        {' · '}
        paper only · pas un investissement
      </p>
    </div>
  )
}
