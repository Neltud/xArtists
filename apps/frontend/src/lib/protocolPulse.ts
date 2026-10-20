/**
 * Public MultiversX pulse for the GO_LIVE page.
 * Read-only. Never signs, never flips LIA_LIVE_TRADING.
 */
import { LIA_OPS } from '../config/contracts'

const API = 'https://api.multiversx.com'

/** Upbit review window announced 21 Sep 2026. Decision expected 19–23 Oct. */
export const UPBIT_WINDOW_START = Date.parse('2026-10-19T00:00:00Z')
export const UPBIT_WINDOW_END = Date.parse('2026-10-24T00:00:00Z')

export type UpbitPhase = 'before' | 'window' | 'after'

export function upbitPosture(now = Date.now()): { phase: UpbitPhase; label: string } {
  if (now < UPBIT_WINDOW_START) {
    return {
      phase: 'before',
      label: 'Upbit : EGLD en surveillance depuis le 21 sept. Décision annoncée pour le 19–23 oct.',
    }
  }
  if (now < UPBIT_WINDOW_END) {
    return {
      phase: 'window',
      label:
        'Fenêtre Upbit ouverte (19–23 oct). Aucune décision de maintien publiée. Client LIA = paper. Pas de nouveau trade live.',
    }
  }
  return {
    phase: 'after',
    label:
      'Fenêtre Upbit échue. Ne pas allumer le live tant qu’une annonce claire (maintien, retraits) n’est pas vérifiée.',
  }
}

export type ProtocolPulse = {
  epoch: number
  refreshRate: number
  egldPrice: number
  marketCap: number
  staked: number
  apr: number
  liaEgld: number
  liaNonce: number
  fetchedAt: string
}

export function egldFromAtomic(atomic: string | number | undefined): number {
  const n = typeof atomic === 'number' ? atomic : Number(atomic || 0)
  if (!Number.isFinite(n)) return 0
  return n / 1e18
}

export function formatEgld(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`http_${r.status}`)
  return (await r.json()) as Record<string, unknown>
}

export async function fetchProtocolPulse(): Promise<ProtocolPulse> {
  const [stats, eco, lia] = await Promise.all([
    getJson(`${API}/stats`),
    getJson(`${API}/economics`),
    getJson(`${API}/accounts/${LIA_OPS}`),
  ])
  return {
    epoch: Number(stats.epoch),
    refreshRate: Number(stats.refreshRate),
    egldPrice: Number(eco.price),
    marketCap: Number(eco.marketCap),
    staked: Number(eco.staked),
    apr: Number(eco.apr),
    liaEgld: egldFromAtomic(String(lia.balance ?? '0')),
    liaNonce: Number(lia.nonce),
    fetchedAt: new Date().toISOString(),
  }
}
