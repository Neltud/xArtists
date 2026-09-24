/**
 * Primordial Slot — grille 3×3 style casino, images NFT (paper bank).
 * Claim / on-chain spin fail-closed jusqu’à slot SC live.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type CellImg = { id: string; title: string; image: string; collection?: string }

const SPIN_COST = 5
const ROWS = 3
const COLS = 3

const FALLBACK: CellImg[] = [
  { id: 't1', title: 'Meteorite', image: 'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-02792a97&w=256&output=jpg', collection: 'NFTUDURI' },
  { id: 't2', title: 'Artpocalypse', image: 'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-232735fa&w=256&output=jpg', collection: 'NFTUDURI' },
  { id: 't3', title: 'Serenity', image: 'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-aa98c0da&w=256&output=jpg', collection: 'NFTUDURI' },
  { id: 't4', title: 'Traveller', image: 'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-a9d35042&w=256&output=jpg', collection: 'NFTUDURI' },
  { id: 't5', title: 'Strange Cat', image: 'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-1f7cda62&w=256&output=jpg', collection: 'NFTUDURI' },
  { id: 't6', title: 'Father', image: 'https://images.weserv.nl/?url=media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-c4e81865&w=256&output=jpg', collection: 'NFTUDURI' },
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
  if (mid[0].collection && mid[0].collection === mid[1].collection && mid[1].collection === mid[2].collection) {
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
  const [bank, setBank] = useState(500)
  const [grid, setGrid] = useState<CellImg[]>(() => Array.from({ length: 9 }, () => pick(FALLBACK)))
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [last, setLast] = useState<{ tro: number; kind: string } | null>(null)
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

  const canSpin = !spinning && bank >= SPIN_COST

  const spin = () => {
    if (!canSpin) return
    setSpinning(true)
    setBank(b => b - SPIN_COST)
    let ticks = 0
    const id = window.setInterval(() => {
      setGrid(Array.from({ length: 9 }, () => pick(pool)))
      ticks += 1
      if (ticks >= 14) {
        window.clearInterval(id)
        const final = Array.from({ length: 9 }, () => pick(pool))
        const result = payout(final)
        setGrid(final)
        setLast(result)
        setSpins(n => n + 1)
        if (result.tro > 0) setBank(b => b + result.tro)
        setLog(l => [`${result.kind} · ${result.tro > 0 ? `+${result.tro}` : '0'}`, ...l].slice(0, 8))
        setSpinning(false)
      }
    }, 60)
  }

  const paytable = useMemo(
    () => [
      ['3 identiques (ligne centrale)', '+80 TRO'],
      ['3× même collection (ligne)', '+24 TRO'],
      ['Diagonale 3 identiques', '+40 TRO'],
      ['Paire ligne centrale', '+6 TRO'],
    ],
    [],
  )

  return (
    <div className="animate-fade-in space-y-6 pb-12 max-w-lg mx-auto">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Paper casino</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Slot 3×3 NFT</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Neuf cases, images du catalogue MultiversX. Banque TRO paper — aucun claim on-chain.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-zinc-950 to-black p-4 space-y-4 shadow-2xl shadow-amber-900/10">
        <div className="flex items-baseline justify-between text-[12px] text-zinc-500">
          <span>
            Bank <span className="text-amber-200 tabular-nums font-semibold">{bank}</span> TRO
          </span>
          <span>
            Spins <span className="tabular-nums text-zinc-300">{spins}</span> · coût {SPIN_COST}
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
          {spinning ? '🎰 Roule…' : bank < SPIN_COST ? 'Bank vide' : 'SPIN'}
        </button>

        {last && (
          <p className="text-[12px] text-zinc-400 text-center">
            Dernier : <span className="text-amber-100 font-medium">{last.kind}</span>
            {last.tro > 0 ? ` · +${last.tro} TRO` : ''}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Paytable paper</h2>
        <ul className="space-y-1 text-[12px] text-zinc-400">
          {paytable.map(([k, v]) => (
            <li key={k} className="flex justify-between border-t border-white/5 py-2">
              <span className="text-zinc-300">{k}</span>
              <span className="font-mono text-amber-200/90">{v}</span>
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
        Images : catalogue xArtists (NFTUDURI & co.) via proxy CORS. Paper only.
        {' · '}
        <Link to="/museum" className="text-zinc-400 hover:text-white">
          Musée
        </Link>
        {' · '}
        <Link to="/trading" className="text-zinc-400 hover:text-white">
          Trading
        </Link>
      </p>
    </div>
  )
}
