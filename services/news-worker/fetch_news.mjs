#!/usr/bin/env node
/**
 * News worker — agrège flux publics → apps/frontend/public/data/live_news.json
 *
 * Sources (gratuites, sans clé obligatoire) :
 * - CryptoCompare News API
 * - MultiversX economics (ligne EGLD)
 * - Seed MultiversX blog headlines (fallback si CORS/RSS bloqué en CI)
 *
 * Usage:
 *   node services/news-worker/fetch_news.mjs
 *   npm run news:fetch  (si script package.json)
 *
 * CI: peut tourner en cron GitHub Actions pour republier le JSON.
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

function srcFromDomain(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    if (h.includes('multiversx')) return 'MultiversX'
    if (h.includes('cointelegraph')) return 'CoinTelegraph'
    if (h.includes('coindesk')) return 'CoinDesk'
    if (h.includes('decrypt')) return 'Decrypt'
    return h.split('.')[0].slice(0, 14)
  } catch {
    return 'Crypto'
  }
}

async function fetchCryptoCompare(limit = 12) {
  const url =
    'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=Blockchain,Technology,Trading'
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`CryptoCompare ${r.status}`)
  const j = await r.json()
  const data = Array.isArray(j.Data) ? j.Data : []
  return data.slice(0, limit).map((n, i) => {
    const ts = n.published_on ? new Date(n.published_on * 1000) : new Date()
    return {
      id: `cc-${n.id || i}`,
      timestamp: hhmm(ts),
      source: srcFromDomain(n.source_info?.name ? `https://${n.source_info.name}` : n.url || '') || n.source || 'Crypto',
      title: String(n.title || '').slice(0, 140),
      link: String(n.url || n.guid || '').slice(0, 300),
    }
  })
}

async function fetchEgldLine() {
  try {
    const r = await fetch('https://api.multiversx.com/economics', {
      headers: { Accept: 'application/json' },
    })
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

async function main() {
  const items = []
  const egld = await fetchEgldLine()
  if (egld) items.push(egld)

  try {
    const cc = await fetchCryptoCompare(14)
    items.push(...cc)
  } catch (e) {
    console.warn('[news-worker] CryptoCompare fail:', e.message)
  }

  // Toujours enrichir avec seed MVX si peu de résultats
  if (items.length < 6) {
    items.push(...MVX_SEED)
  } else {
    items.splice(1, 0, ...MVX_SEED.slice(0, 3))
  }

  // Dédup titres
  const seen = new Set()
  const unique = []
  for (const it of items) {
    const k = it.title.toLowerCase().slice(0, 48)
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(it)
  }

  const payload = {
    version: 2,
    updatedAt: new Date().toISOString(),
    note: 'Généré par services/news-worker/fetch_news.mjs — paper / éducatif, pas un conseil.',
    items: unique.slice(0, 24),
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`[news-worker] wrote ${payload.items.length} items → ${OUT}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
