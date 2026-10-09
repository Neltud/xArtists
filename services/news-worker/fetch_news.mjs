#!/usr/bin/env node
/**
 * News worker — sources publiques · textes assainis (pas de HTML/script).
 * → apps/frontend/public/data/live_news.json
 *
 *   node services/news-worker/fetch_news.mjs
 *
 * Aucun secret / token dans ce script ni dans le JSON de sortie.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../../apps/frontend/public/data/live_news.json')

/** Strip tags, control chars, truncate — anti XSS dans le JSON statique */
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
].map(sanitizeItem)

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
  const children = j?.data?.children || []
  return children.map((c, i) => {
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
      ...(await fetchRss2Json('https://cointelegraph.com/rss', 'CoinTelegraph', 6)),
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
    note: 'services/news-worker — paper/éducatif, pas un conseil. Textes sanitizés.',
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
