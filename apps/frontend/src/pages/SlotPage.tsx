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
): { tableGross: number; kind: string; isGrand: boolean } {
  const p = SLOT_ASSET_CONFIG[asset].payouts
  const allSame = grid.every(c => c.id === grid[0].id)
  if (allSame) {
    return {
      tableGross: 0,
      kind: `GRAND JACKPOT 9/9 · ${grid[0].title}`,
      isGrand: true,
    }
  }
  const mid = [grid[3], grid[4], grid[5]]
  if (mid[0].id === mid[1].id && mid[1].id === mid[2].id) {
    return { tableGross: p.line3, kind: `Ligne · ${mid[0].title}`, isGrand: false }
  }
  if (
    mid[0].collection &&
    mid[0].collection === mid[1].collection &&
    mid[1].collection === mid[2].collection
  ) {
    return {
      tableGross: p.collection,
      kind: `3× collection ${mid[0].collection}`,
      isGrand: false,
    }
  }
  if (mid[0].id === mid[1].id || mid[1].id === mid[2].id || mid[0].id === mid[2].id) {
    return { tableGross: p.pair, kind: 'Paire ligne centrale', isGrand: false }
  }
  if (grid[0].id === grid[4].id && grid[4].id === grid[8].id) {
    return { tableGross: p.diagonal, kind: 'Diagonale ↘', isGrand: false }
  }
  if (grid[2].id === grid[4].id && grid[4].id === grid[6].id) {
    return { tableGross: p.diagonal, kind: 'Diagonale ↙', isGrand: false }
  }
  return { tableGross: 0, kind: '—', isGrand: false }
}

export default function SlotPage() {
  const { connected, shortAddress } = useWallet()
  const [asset, setAsset] = useState<SlotAsset>('USDC')
  const cfg = SLOT_ASSET_CONFIG[asset]

  const [pool, setPool] = useState<CellImg[]>(FALLBACK)
  const [bank, setBank] = useState(cfg.startBank)
  const [liaPaper, setLiaPaper] = useState(0)
  const [progressive, setProgressive] = useState(() => loadProgressive('USDC'))
  const [grid, setGrid] = useState<CellImg[]>(() => Array.from({ length: 9 }, () => pick(FALLBACK)))
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [last, setLast] = useState<{ kind: string; split: SlotSplit } | null>(null)
  const [log, setLog] = useState<string[]>([])

  const selectAsset = (a: SlotAsset) => {
    if (spinning || a === asset) return
    setAsset(a)
    const c = SLOT_ASSET_CONFIG[a]
    setBank(c.startBank)
    setLiaPaper(0)
    setProgressive(loadProgressive(a))
    setSpins(0)
    setLast(null)
    setLog([])
  }

  useEffect(() => {
    let c = false
    ;(async () => {
      const urls = [
        `${import.meta.env.BASE_URL}data/xartists_collections.json`,
        '/xArtists/data/xartists_collections.json',
      ]
      for (const u of urls) {
        try {
          const r = await fetch(u, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const cols = j.collections || []
          const imgs: CellImg[] = []
          for (const col of cols) {
            for (const n of col.nfts || []) {
              const thumb = n.media?.[0]?.thumbnailUrl || n.url || n.media?.[0]?.url
              if (!thumb || !/^https?:/i.test(thumb)) continue
              imgs.push({
                id: n.identifier,
                title: n.name || n.identifier,
                image: corsImg(thumb),
                collection: n.collection || col.identifier,
              })
              if (imgs.length >= 48) break
            }
            if (imgs.length >= 48) break
          }
          if (!c && imgs.length >= 6) {
            setPool(imgs)
            setGrid(Array.from({ length: 9 }, () => pick(imgs)))
            return
          }
        } catch {
          /* next */
        }
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
          Casino public · mainnet paper
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Slot 3×3</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Jouer en <strong className="text-zinc-300">EGLD</strong> ou{' '}
          <strong className="text-zinc-300">USDC</strong>. Chaque mise alimente la cagnotte.
          Grand jackpot = <strong className="text-amber-200/90">9 symboles identiques</strong>.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {SLOT_ASSETS.map(a => (
          <button
            key={a}
            type="button"
            disabled={spinning}
            onClick={() => selectAsset(a)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              asset === a
                ? 'bg-white text-zinc-900'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            {a}
          </button>
        ))}
        {connected ? (
          <span className="ml-auto text-[11px] text-emerald-400/90 mono">{shortAddress}</span>
        ) : (
          <button
            type="button"
            onClick={() => requestOpenConnect()}
            className="ml-auto text-[12px] text-cyan-300 underline-offset-2 hover:underline"
          >
            Connecter wallet
          </button>
        )}
      </div>

      {/* Progressive pot */}
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-950/40 to-violet-950/30 px-4 py-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Cagnotte progressive</p>
        <p className="text-2xl sm:text-3xl font-bold text-amber-100 tabular-nums mt-1">
          {formatSlotAmount(progressive, asset)}
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">
          +{formatBps(SLOT_PROGRESSIVE_CONTRIB_BPS)} de chaque mise · payée sur 9/9
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-zinc-950 to-black p-4 space-y-4 shadow-2xl shadow-amber-900/10">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-zinc-500">
          <span>
            Bank{' '}
            <span className="text-amber-200 tabular-nums font-semibold">
              {formatSlotAmount(bank, asset)}
            </span>
          </span>
          <span>
            LIA{' '}
            <span className="text-violet-300 tabular-nums font-semibold">
              {formatSlotAmount(liaPaper, asset)}
            </span>
          </span>
          <span>
            Spins <span className="tabular-nums text-zinc-300">{spins}</span>
          </span>
        </div>

        <div className="rounded-xl border-2 border-amber-500/30 bg-black/80 p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {grid.map((cell, i) => (
              <div
                key={`${cell.id}-${i}-${spinning}`}
                className={`relative aspect-square overflow-hidden rounded-lg border ${
                  spinning ? 'border-amber-500/40 animate-pulse' : 'border-white/10'
                } bg-zinc-900`}
              >
                <img
                  src={cell.image}
                  alt={cell.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
                    spinning ? 'opacity-70' : 'opacity-100'
                  }`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={e => {
                    ;(e.target as HTMLImageElement).style.opacity = '0.3'
                  }}
                />
                {!spinning && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-zinc-300 truncate px-1 py-0.5">
                    {cell.title}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-amber-200/70 mt-2 tracking-wide">
            3×3 · grand jackpot = 9/9 identiques · {asset}
          </p>
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={!canSpin}
          className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-200 text-zinc-950 py-3.5 text-sm font-bold disabled:opacity-40 active:scale-[0.99] transition"
        >
          {spinning
            ? '🎰 Roule…'
            : bank < cfg.spinCost
              ? 'Bank vide'
              : `SPIN · ${formatSlotAmount(cfg.spinCost, asset)}`}
        </button>

        {last && (
          <div className="text-[12px] text-center space-y-1">
            <p className={last.split.isGrand ? 'text-amber-200 font-semibold' : 'text-zinc-400'}>
              {last.kind}
            </p>
            {last.split.isGrand && (
              <p className="text-emerald-300 text-sm font-medium">
                Cagnotte versée · user +{last.split.userCredit} {asset}
              </p>
            )}
            {!last.split.isGrand && last.split.grossWin > 0 && (
              <p className="text-[11px] text-zinc-500">
                User +{last.split.userCredit} · pot +{last.split.toProgressive} · LIA +
                {last.split.spinToLia + last.split.liaRake}
              </p>
            )}
          </div>
        )}
      </div>

      <section className="rounded-xl border border-violet-500/20 bg-violet-950/15 px-3 py-3 text-[11px] text-zinc-400 leading-relaxed">
        <p className="font-medium text-violet-200/90 mb-1">Règles publiques</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Ouvert à tous · choix EGLD ou USDC (paper)</li>
          <li>{formatBps(SLOT_PROGRESSIVE_CONTRIB_BPS)} de chaque mise → cagnotte</li>
          <li>9/9 symboles identiques → cagnotte entière (+ bonus) puis reset seed</li>
          <li>Ledger local · payout on-chain SC plus tard</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Paytable · {asset}</h2>
        <ul className="space-y-1 text-[12px] text-zinc-400">
          {paytable.map(([k, v]) => (
            <li key={k} className="flex justify-between border-t border-white/5 py-2 gap-3">
              <span className="text-zinc-300">{k}</span>
              <span className="font-mono text-amber-200/90 shrink-0 text-right">{v}</span>
            </li>
          ))}
        </ul>
      </section>

      {log.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Journal</h2>
          <ul className="space-y-1 text-[11px] font-mono text-zinc-500">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] text-zinc-600">
        <Link to="/wallet" className="text-zinc-400 hover:text-white">
          Wallet / xPortal
        </Link>
        {' · '}
        <Link to="/trading" className="text-zinc-400 hover:text-white">
          Trading live
        </Link>
      </p>
    </div>
  )
}
