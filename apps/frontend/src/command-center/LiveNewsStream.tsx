/**
 * Live news — live_news.json + EGLD economics + Reddit r/MultiversX (client).
 * Paper / éducatif — pas un conseil financier.
 */
import { useEffect, useState } from 'react'

export type NewsItem = {
  id: string
  timestamp: string
  source: string
  title: string
  link?: string
}

const FALLBACK: NewsItem[] = [
  {
    id: 'fb-1',
    timestamp: '10:45',
    source: 'xExchange',
    title: "Mise à jour des pools de liquidité et frais d'agrégation",
    link: 'https://xexchange.com',
  },
  {
    id: 'fb-2',
    timestamp: '09:12',
    source: 'DEX',
    title: 'Volume en hausse sur les DEX MultiversX',
  },
  {
    id: 'fb-3',
    timestamp: '08:30',
    source: 'MultiversX',
    title: 'Universal Agentic Commerce Stack — agents on-chain',
    link: 'https://multiversx.com/blog',
  },
  {
    id: 'fb-4',
    timestamp: '07:55',
    source: 'Network',
    title: 'Finalité intra-shard ~600ms — rail agent-ready',
  },
]

function hhmm(d = new Date()) {
  return d.toISOString().slice(11, 16)
}

function normalizeList(raw: unknown): NewsItem[] {
  if (!raw) return []
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : []
  return arr
    .map((x, i) => {
      const o = x as Record<string, unknown>
      const title = String(o.title || o.text || '').trim()
      if (!title) return null
      return {
        id: String(o.id || `n-${i}`),
        timestamp: String(o.timestamp || o.t || o.time || hhmm()),
        source: String(o.source || o.src || 'News').slice(0, 16),
        title: title.slice(0, 160),
        link: o.link ? String(o.link) : o.url ? String(o.url) : undefined,
      } as NewsItem
    })
    .filter(Boolean) as NewsItem[]
}

async function loadStatic(base: string): Promise<NewsItem[]> {
  for (const path of ['data/live_news.json', 'data/mvx_news.json']) {
    try {
      const r = await fetch(`${base}${path}`, { cache: 'no-store' })
      if (!r.ok) continue
      const list = normalizeList(await r.json())
      if (list.length) return list
    } catch {
      /* */
    }
  }
  return []
}

async function fetchLiveClient(): Promise<NewsItem[]> {
  const out: NewsItem[] = []

  try {
    const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      const price = Number(j.price)
      if (Number.isFinite(price)) {
        out.push({
          id: `egld-${Date.now()}`,
          timestamp: hhmm(),
          source: 'EGLD',
          title: `Cotation publique · $${price.toFixed(2)} (economics API)`,
          link: 'https://explorer.multiversx.com',
        })
      }
    }
  } catch {
    /* */
  }

  // Reddit JSON — souvent accessible sans clé (peut échouer CORS selon navigateur)
  try {
    const r = await fetch('https://www.reddit.com/r/MultiversX/new.json?limit=8', {
      cache: 'no-store',
    })
    if (r.ok) {
      const j = await r.json()
      for (const c of j?.data?.children || []) {
        const d = c.data || {}
        const ts = d.created_utc ? new Date(d.created_utc * 1000) : new Date()
        out.push({
          id: `rd-${d.id}`,
          timestamp: hhmm(ts),
          source: 'r/MVX',
          title: String(d.title || '').slice(0, 140),
          link: d.url?.startsWith('http')
            ? d.url
            : `https://reddit.com${d.permalink || ''}`,
        })
      }
    }
  } catch {
    /* CORS */
  }

  return out
}

function mergeNews(...lists: NewsItem[][]): NewsItem[] {
  const seen = new Set<string>()
  const out: NewsItem[] = []
  for (const list of lists) {
    for (const it of list) {
      const k = it.title.toLowerCase().slice(0, 40)
      if (seen.has(k)) continue
      seen.add(k)
      out.push(it)
    }
  }
  return out
}

export default function LiveNewsStream({ compact }: { compact?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>(FALLBACK)
  const [offset, setOffset] = useState(0)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let c = false
    const base = import.meta.env.BASE_URL || '/'

    const run = async () => {
      const staticItems = await loadStatic(base)
      const clientItems = await fetchLiveClient()
      if (c) return
      const merged = mergeNews(clientItems, staticItems, FALLBACK)
      if (merged.length) {
        setItems(merged)
        setLive(clientItems.length > 0)
      }
    }

    void run()
    const id = window.setInterval(() => void run(), 5 * 60_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!items.length) return
    const id = window.setInterval(() => setOffset(o => o + 1), 3200)
    return () => window.clearInterval(id)
  }, [items.length])

  const loop = items.length ? [...items, ...items] : FALLBACK
  const len = items.length || FALLBACK.length
  const start = offset % len
  const rowH = compact ? 36 : 40

  return (
    <div className={`glass-hud overflow-hidden ${compact ? 'h-36' : 'h-52'}`}>
      <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-cyan-500/15">
        <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-cyan-300/90">
          Live news · MVX / Crypto
        </p>
        <span className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500">{live ? 'live' : 'cache'}</span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}
          />
        </span>
      </div>
      <div className="relative h-[calc(100%-28px)] overflow-hidden">
        <ul
          className="absolute inset-x-0 transition-transform duration-700 ease-linear"
          style={{ transform: `translateY(-${start * rowH}px)` }}
        >
          {loop.map((n, i) => {
            const row = (
              <>
                <span className="mono text-[10px] text-zinc-500 shrink-0 w-10">{n.timestamp}</span>
                <span className="text-[10px] font-semibold text-violet-300/90 shrink-0 w-16 truncate">
                  {n.source}
                </span>
                <span className="text-[11px] text-zinc-300 truncate flex-1">{n.title}</span>
              </>
            )
            const cls = `flex gap-2 px-3 items-center border-b border-white/[0.04] ${compact ? 'h-9' : 'h-10'}`
            return n.link ? (
              <li key={`${n.id}-${i}`} className={cls}>
                <a
                  href={n.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex gap-2 items-center min-w-0 w-full hover:text-white"
                  title={n.title}
                >
                  {row}
                </a>
              </li>
            ) : (
              <li key={`${n.id}-${i}`} className={cls} title={n.title}>
                {row}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
