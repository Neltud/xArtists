/**
 * Read-only daily signal publisher for access-api.
 * Never triggers trades. Serves static JSON with optional in-memory overlay.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function candidatePaths() {
  return [
    process.env.DAILY_SIGNAL_PATH,
    path.resolve(__dirname, '../../../apps/frontend/public/data/signals/daily_signal.json'),
    path.resolve(__dirname, '../../../public/data/signals/daily_signal.json'),
    path.resolve(process.cwd(), 'apps/frontend/public/data/signals/daily_signal.json'),
    path.resolve(process.cwd(), 'data/signals/daily_signal.json'),
  ].filter(Boolean)
}

export function loadDailySignal() {
  for (const p of candidatePaths()) {
    try {
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
        if (raw && typeof raw === 'object') {
          return {
            ok: true,
            signal: {
              ...raw,
              live_trading: 0,
              execution: 'disabled',
            },
            source: p,
          }
        }
      }
    } catch {
      /* try next */
    }
  }
  return {
    ok: true,
    signal: {
      schema: 'xartists_daily_signal/v1',
      date: new Date().toISOString().slice(0, 10),
      regime: 'observe',
      confidence: 0.4,
      headline: 'LIA signal-only — no live trading',
      summary: 'Fallback signal: paper mode. No automatic execution.',
      disclaimer: 'Pas un conseil financier.',
      live_trading: 0,
      execution: 'disabled',
      source: 'access-api-fallback',
    },
    source: 'fallback',
  }
}
