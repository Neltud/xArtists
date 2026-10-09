#!/usr/bin/env node
/**
 * News worker — sources gratuites sans clé CryptoCompare.
 * → apps/frontend/public/data/live_news.json
 *
 *   node services/news-worker/fetch_news.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../../apps/frontend/public/data/live_news.json')

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
]

function hhmm(d = new Date()) {
  return d.toISOString().slice(11, 16)
}

async function fetchEgld() {
  try {
    const r = await fetch('https://api.multiversx.com/economics')
    if (!r.ok) return null
    const j = await r.json()
    const price = Number(j.price)
    if (!Number.isFinite(price)) return null
    return {
      id: `egld-${Date.now()}`,
      timestamp: hhmm(),
      source: 'EGLD',
      title: `Cotation publique · $${price.toFixed(2)} (API MultiversX economics)`,
      link: 'https://explorer.multiversx.com',
    }
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
  const children = j?.data?.children || []
  return children.map((c, i) => {
    const d = c.data || {}
    const ts = d.created_utc ? new Date(d.created_utc * 1000) : new Date()
    return {
      id: `rd-${d.id || i}`,
      timestamp: hhmm(ts),
      source: `r/${sub}`.slice(0, 14),
      title: String(d.title || '').slice(0, 140),
      link: d.url?.startsWith('http') ? d.url : `https://reddit.com${d.permalink || ''}`,
    }
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
    return {
      id: `rss-${sourceLabel}-${i}-${ts.getTime()}`,
      timestamp: hhmm(ts),
      source: sourceLabel.slice(0, 14),
      title: String(n.title || '').slice(0, 140),
      link: String(n.link || n.guid || '').slice(0, 300),
    }
  })
}

async function main() {
  const items = []
  const egld = await fetchEgld()
  if (egld) items.push(egld)

  try {
    items.push(...(await fetchReddit('MultiversX', 12)))
  } catch (e) {
    console.warn('[news] reddit', e.message)
  }

  try {
    items.push(
      ...(await fetchRss2Json(
        'https://cointelegraph.com/rss',
        'CoinTelegraph',
        6,
      )),
    )
  } catch (e) {
    console.warn('[news] cointelegraph rss', e.message)
  }

  try {
    items.push(
      ...(await fetchRss2Json(
        'https://www.coindesk.com/arc/outboundfeeds/rss/',
        'CoinDesk',
        4,
      )),
    )
  } catch (e) {
    console.warn('[news] coindesk rss', e.message)
  }

  if (items.length < 6) items.push(...MVX_SEED)
  else items.splice(1, 0, ...MVX_SEED.slice(0, 2))

  const seen = new Set()
  const unique = []
  for (const it of items) {
    if (!it.title) continue
    const k = it.title.toLowerCase().slice(0, 48)
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(it)
  }

  const payload = {
    version: 2,
    updatedAt: new Date().toISOString(),
    note: 'services/news-worker — paper/éducatif, pas un conseil financier.',
    items: unique.slice(0, 28),
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`[news-worker] ${payload.items.length} items → ${OUT}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
