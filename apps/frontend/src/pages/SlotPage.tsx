/**
 * Primordial Slot — grille 3×3 style casino, images NFT (paper bank).
 * Gains : 85 % user · 15 % LIA · coût spin → LIA. Claim SC fail-closed.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SLOT_SPIN_COST,
  SLOT_START_BANK,
  SLOT_USER_WIN_BPS,
  SLOT_LIA_WIN_RAKE_BPS,
  splitSlotWin,
  formatBps,
  type SlotSplit,
} from '../config/slotEconomy'

type CellImg = { id: string; title: string; image: string; collection?: string }

const ROWS = 3
const COLS = 3

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

function payout(grid: CellImg[]): { tro: number; kind: string } {
  const mid = [grid[3], grid[4], grid[5]]
  if (mid[0].id === mid[1].id && mid[1].id === mid[2].id) {
    return { tro: 80, kind: `Jackpot ligne · ${mid[0].title}` }
  }
  if (
    mid[0].collection &&
    mid[0].collection === mid[1].collection &&
    mid[1].collection === mid[2].collection
  ) {
    return { tro: 24, kind: `3× collection ${mid[0].collection}` }
  }
  if (mid[0].id === mid[1].id || mid[1].id === mid[2].id || mid[0].id === mid[2].id) {
    return { tro: 6, kind: 'Paire ligne centrale' }
  }
  if (grid[0].id === grid[4].id && grid[4].id === grid[8].id) {
    return { tro: 40, kind: 'Diagonale ↘' }
  }
  if (grid[2].id === grid[4].id && grid[4].id === grid[6].id) {
    return { tro: 40, kind: 'Diagonale ↙' }
  }
  return { tro: 0, kind: '—' }
}

export default function SlotPage() {
  const [pool, setPool] = useState<CellImg[]>(FALLBACK)
  const [bank, setBank] = useState(SLOT_START_BANK)
  const [liaPaper, setLiaPaper] = useState(0)
  const [grid, setGrid] = useState<CellImg[]>(() => Array.from({ length: 9 }, () => pick(FALLBACK)))
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [last, setLast] = useState<{ kind: string; split: SlotSplit } | null>(null)
  const [log, setLog] = useState<string[]>([])

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

  const canSpin = !spinning && bank >= SLOT_SPIN_COST

  const spin = () => {
    if (!canSpin) return
    setSpinning(true)
    // Coût spin → LIA (paper)
    setBank(b => b - SLOT_SPIN_COST)
    setLiaPaper(l => l + SLOT_SPIN_COST)
    let ticks = 0
    const id = window.setInterval(() => {
      setGrid(Array.from({ length: 9 }, () => pick(pool)))
      ticks += 1
      if (ticks >= 14) {
        window.clearInterval(id)
        const final = Array.from({ length: 9 }, () => pick(pool))
        const result = payout(final)
        const split = splitSlotWin(result.tro)
        setGrid(final)
        setLast({ kind: result.kind, split })
        setSpins(n => n + 1)
        if (split.userCredit > 0) setBank(b => b + split.userCredit)
        if (split.liaRake > 0) setLiaPaper(l => l + split.liaRake)
        const line =
          result.tro > 0
            ? `${result.kind} · brut ${split.grossWin} → user +${split.userCredit} · LIA +${split.liaRake}`
            : `${result.kind} · 0 · spin → LIA +${SLOT_SPIN_COST}`
        setLog(l => [line, ...l].slice(0, 10))
        setSpinning(false)
      }
    }, 60)
  }

  const paytable = useMemo(
    () => [
      ['3 identiques (ligne centrale)', '+80 TRO brut'],
      ['3× même collection (ligne)', '+24 TRO brut'],
      ['Diagonale 3 identiques', '+40 TRO brut'],
      ['Paire ligne centrale', '+6 TRO brut'],
      [
        'Split gains',
        `user ${formatBps(SLOT_USER_WIN_BPS)} · LIA ${formatBps(SLOT_LIA_WIN_RAKE_BPS)}`,
      ],
    ],
    [],
  )

  return (
    <div className="animate-fade-in space-y-6 pb-12 max-w-lg mx-auto">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Paper casino
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Slot 3×3 NFT</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Gains bruts : <strong className="text-zinc-300">{formatBps(SLOT_USER_WIN_BPS)} user</strong>{' '}
          · <strong className="text-zinc-300">{formatBps(SLOT_LIA_WIN_RAKE_BPS)} LIA</strong>. Coût spin →
          LIA. Banque paper — pas de claim on-chain.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-zinc-950 to-black p-4 space-y-4 shadow-2xl shadow-amber-900/10">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-zinc-500">
          <span>
            Bank user{' '}
            <span className="text-amber-200 tabular-nums font-semibold">{bank}</span> TRO
          </span>
          <span>
            LIA paper{' '}
            <span className="text-violet-300 tabular-nums font-semibold">{liaPaper}</span> TRO
          </span>
          <span>
            Spins <span className="tabular-nums text-zinc-300">{spins}</span> · coût {SLOT_SPIN_COST}
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
            Ligne payante · milieu · {ROWS}×{COLS}
          </p>
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={!canSpin}
          className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-200 text-zinc-950 py-3.5 text-sm font-bold disabled:opacity-40 active:scale-[0.99] transition"
        >
          {spinning ? '🎰 Roule…' : bank < SLOT_SPIN_COST ? 'Bank vide' : 'SPIN'}
        </button>

        {last && (
          <div className="text-[12px] text-zinc-400 text-center space-y-1">
            <p>
              Dernier : <span className="text-amber-100 font-medium">{last.kind}</span>
            </p>
            {last.split.grossWin > 0 ? (
              <p className="text-[11px] text-zinc-500">
                Brut {last.split.grossWin} → user{' '}
                <span className="text-emerald-300">+{last.split.userCredit}</span> · LIA rake{' '}
                <span className="text-violet-300">+{last.split.liaRake}</span> · spin LIA{' '}
                <span className="text-violet-300">+{last.split.spinToLia}</span>
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500">
                Pas de gain · spin → LIA +{SLOT_SPIN_COST}
              </p>
            )}
          </div>
        )}
      </div>

      <section className="rounded-xl border border-violet-500/20 bg-violet-950/15 px-3 py-3 text-[11px] text-zinc-400 leading-relaxed">
        <p className="font-medium text-violet-200/90 mb-1">Répartition (paper)</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Chaque spin : {SLOT_SPIN_COST} TRO user → ledger LIA</li>
          <li>Gain brut : {formatBps(SLOT_USER_WIN_BPS)} crédité user · {formatBps(SLOT_LIA_WIN_RAKE_BPS)} LIA</li>
          <li>Pas un investissement · pas de payout on-chain (SC OFF)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Paytable paper</h2>
        <ul className="space-y-1 text-[12px] text-zinc-400">
          {paytable.map(([k, v]) => (
            <li key={k} className="flex justify-between border-t border-white/5 py-2 gap-3">
              <span className="text-zinc-300">{k}</span>
              <span className="font-mono text-amber-200/90 shrink-0">{v}</span>
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

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Images : catalogue xArtists via proxy CORS. Paper only.
        {' · '}
        <Link to="/tip" className="text-zinc-400 hover:text-white">
          Treasury LIA
        </Link>
        {' · '}
        <Link to="/museum" className="text-zinc-400 hover:text-white">
          Musée
        </Link>
      </p>
    </div>
  )
}
