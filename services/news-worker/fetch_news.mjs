#!/usr/bin/env node
/**
 * News worker — merge avec historique, jamais d'écrasement vide.
 * Min 10 items dans live_news.json.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../../apps/frontend/public/data/live_news.json')
const MIN_ITEMS = 10

function sanitizeText(input, max = 160) {
  let s = String(input ?? '')
  s = s.replace(/<[^>]*>/g, '')
  s = s.replace(/[\u0000-\u001F\u007F]/g, ' ')
  s = s.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&')
  s = s.replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
  s = s.replace(/javascript\s*:/gi, '')
  s = s.replace(/on\w+\s*=/gi, '')
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > max) s = s.slice(0, max - 1) + '…'
  return s
}

function sanitizeUrl(input) {
  const s = String(input ?? '').trim()
  if (!s) return undefined
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined
    return u.toString().slice(0, 400)
  } catch {
    return undefined
  }
}

function sanitizeItem(raw) {
  return {
    id: sanitizeText(raw.id || 'item', 64).replace(/\s/g, '-'),
    timestamp: sanitizeText(raw.timestamp || '', 8),
    source: sanitizeText(raw.source || 'News', 16),
    title: sanitizeText(raw.title || '', 160),
    ...(sanitizeUrl(raw.link) ? { link: sanitizeUrl(raw.link) } : {}),
  }
}

const MVX_SEED = [
  {
    id: 'mvx-agent-stack',
    timestamp: '10:00',
    source: 'MultiversX',
    title: 'Universal Agentic Commerce Stack — paiements agents on-chain',
    link: 'https://multiversx.com/blog',
  },
  {
    id: 'mvx-openclaw',
    timestamp: '09:30',
    source: 'MultiversX',
    title: 'Max (OpenClaw) agent live sur MultiversX',
    link: 'https://multiversx.com/blog',
  },
  {
    id: 'mvx-ap2',
    timestamp: '09:00',
    source: 'MultiversX',
    title: 'Intégration Google AP2 & commerce agentique',
    link: 'https://multiversx.com/blog',
  },
  {
    id: 'mvx-warps',
    timestamp: '08:30',
    source: 'MultiversX',
    title: 'Warps v3 — standard dApp & UX',
    link: 'https://multiversx.com/blog',
  },
  {
    id: 'news-xex',
    timestamp: '10:45',
    source: 'xExchange',
    title: "Mise à jour des pools de liquidité et frais d'agrégation",
    link: 'https://xexchange.com',
  },
  {
    id: 'news-dex',
    timestamp: '09:12',
    source: 'DEX',
    title: 'Volume en hausse sur les DEX MultiversX',
  },
  {
    id: 'news-xportal',
    timestamp: '08:30',
    source: 'xPortal',
    title: 'Sessions wallet mobile stabilisées (multi-TX)',
  },
  {
    id: 'news-net',
    timestamp: '07:55',
    source: 'Network',
    title: 'Finalité intra-shard ~600ms — rail agent-ready',
  },
  {
    id: 'news-egld',
    timestamp: '06:40',
    source: 'EGLD',
    title: 'Cotation publique via API MultiversX economics',
    link: 'https://explorer.multiversx.com',
  },
  {
    id: 'news-build',
    timestamp: '05:18',
    source: 'Builders',
    title: 'Sovereign chains & dApp hub en expansion',
  },
].map(sanitizeItem)

function hhmm(d = new Date()) {
  return d.toISOString().slice(11, 16)
}

function loadExisting() {
  try {
    if (!existsSync(OUT)) return []
    const j = JSON.parse(readFileSync(OUT, 'utf8'))
    const arr = Array.isArray(j.items) ? j.items : []
    return arr.map(sanitizeItem).filter(x => x.title)
  } catch {
    return []
  }
}

function mergeItems(...lists) {
  const seen = new Set()
  const out = []
  for (const list of lists) {
    for (const it of list) {
      if (!it?.title) continue
      const k = it.title.toLowerCase().slice(0, 48)
      if (seen.has(k)) continue
      seen.add(k)
      out.push(it)
    }
  }
  return out
}

async function fetchEgld() {
  try {
    const r = await fetch('https://api.multiversx.com/economics')
    if (!r.ok) return null
    const j = await r.json()
    const price = Number(j.price)
    if (!Number.isFinite(price)) return null
    return sanitizeItem({
      id: `egld-${Date.now()}`,
      timestamp: hhmm(),
      source: 'EGLD',
      title: `Cotation publique · $${price.toFixed(2)} (API MultiversX economics)`,
      link: 'https://explorer.multiversx.com',
    })
  } catch {
    return null
  }
}

async function fetchReddit(sub = 'MultiversX', limit = 10) {
  const url = `https://www.reddit.com/r/${sub}/new.json?limit=${limit}`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'xArtists-news-worker/1.0' },
  })
  if (!r.ok) throw new Error(`reddit ${r.status}`)
  const j = await r.json()
  return (j?.data?.children || []).map((c, i) => {
    const d = c.data || {}
    const ts = d.created_utc ? new Date(d.created_utc * 1000) : new Date()
    const link = d.url?.startsWith('http')
      ? d.url
      : `https://reddit.com${d.permalink || ''}`
    return sanitizeItem({
      id: `rd-${d.id || i}`,
      timestamp: hhmm(ts),
      source: `r/${sub}`,
      title: d.title || '',
      link,
    })
  })
}

async function fetchRss2Json(rssUrl, sourceLabel, limit = 8) {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`rss2json ${r.status}`)
  const j = await r.json()
  if (j.status !== 'ok' || !Array.isArray(j.items)) return []
  return j.items.slice(0, limit).map((n, i) => {
    const ts = n.pubDate ? new Date(n.pubDate) : new Date()
    return sanitizeItem({
      id: `rss-${sourceLabel}-${i}-${ts.getTime()}`,
      timestamp: hhmm(ts),
      source: sourceLabel,
      title: n.title || '',
      link: n.link || n.guid || '',
    })
  })
}

async function main() {
  const previous = loadExisting()
  const fresh = []

  const egld = await fetchEgld()
  if (egld) fresh.push(egld)

  try {
    fresh.push(...(await fetchReddit('MultiversX', 12)))
  } catch (e) {
    console.warn('[news] reddit', e.message)
  }

  try {
    fresh.push(...(await fetchRss2Json('https://cointelegraph.com/rss', 'CoinTelegraph', 6)))
  } catch (e) {
    console.warn('[news] cointelegraph', e.message)
  }

  try {
    fresh.push(
      ...(await fetchRss2Json(
        'https://www.coindesk.com/arc/outboundfeeds/rss/',
        'CoinDesk',
        4,
      )),
    )
  } catch (e) {
    console.warn('[news] coindesk', e.message)
  }

  // Merge: fresh first, then previous, then seed — never write empty
  let unique = mergeItems(fresh, previous, MVX_SEED)

  if (unique.length < MIN_ITEMS) {
    unique = mergeItems(unique, MVX_SEED)
  }

  if (unique.length === 0) {
    console.error('[news-worker] abort — would write empty file; keeping previous')
    process.exit(0)
  }

  const payload = {
    version: 2,
    updatedAt: new Date().toISOString(),
    note: 'merge resilient — min 10 items; sanitize XSS; paper only.',
    items: unique.slice(0, 28),
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(
    `[news-worker] ${payload.items.length} items (fresh=${fresh.length} prev=${previous.length}) → ${OUT}`,
  )
}

main().catch(e => {
  console.error(e)
  // Ne pas écraser le fichier en cas d'exception fatale
  process.exit(1)
})
