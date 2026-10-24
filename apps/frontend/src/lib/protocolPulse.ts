/**
 * Public MultiversX pulse for the GO_LIVE page.
 * Read-only. Never signs, never flips LIA_LIVE_TRADING.
 */
import { LIA_OPS, MAINNET_ADDRESSES, TRO_TOKEN_ID } from '../config/contracts'

const API = 'https://api.multiversx.com'

/**
 * Original Upbit + Bithumb decision window (19–23 Oct 2026).
 * Closed by an extension, not by a delist and not by a clearance.
 */
export const UPBIT_WINDOW_START = Date.parse('2026-10-19T00:00:00Z')
/** Upbit notice 207379109, posted 2026-10-23 06:02 UTC. */
export const KR_EXTENSION_START = Date.parse('2026-10-23T06:02:00Z')
/** Through 20 Nov 2026 inclusive (third week of November, 16–20). */
export const KR_EXTENSION_END = Date.parse('2026-11-21T00:00:00Z')
const WINDOW_DAYS = 5
const EXTENSION_DAYS = 29

export type UpbitPhase = 'before' | 'window' | 'extended' | 'after'

export function upbitPosture(now = Date.now()): { phase: UpbitPhase; label: string; day: number | null } {
  if (now < UPBIT_WINDOW_START) {
    return {
      phase: 'before',
      label:
        'Upbit et Bithumb : EGLD en surveillance. Décision annoncée pour le 19–23 oct. Client LIA = paper.',
      day: null,
    }
  }
  if (now < KR_EXTENSION_START) {
    const day = Math.min(
      WINDOW_DAYS,
      Math.max(1, Math.floor((now - UPBIT_WINDOW_START) / 86_400_000) + 1),
    )
    return {
      phase: 'window',
      day,
      label:
        `Fenêtre de revue 19–23 oct, jour ${day}/${WINDOW_DAYS} (Upbit, même calendrier annoncé chez Bithumb). ` +
        'Aucun maintien ni delist EGLD publié — SOPH et ZIL sont les delist décidés, pas EGLD. ' +
        'Client LIA = paper. Pas de nouveau trade live.',
    }
  }
  if (now < KR_EXTENSION_END) {
    const day = Math.min(
      EXTENSION_DAYS,
      Math.max(1, Math.floor((now - KR_EXTENSION_START) / 86_400_000) + 1),
    )
    return {
      phase: 'extended',
      day,
      label:
        `Prolongation officielle, jour ${day}/${EXTENSION_DAYS}. ` +
        'Upbit (notice 207379109, 23 oct 06:02 UTC) étend la surveillance EGLD/KRW, EGLD/BTC et EGLD/USDT jusqu’au 16–20 nov 2026. ' +
        'Bithumb prolonge le même jour le warning EGLD (et FET). Ce n’est pas un delist, ce n’est pas un maintien. ' +
        'VITE_LIA_LIVE_TRADING reste 0. Pas de swap, pas de claimFees, Paybox 501.',
    }
  }
  return {
    phase: 'after',
    day: null,
    label:
      'Fenêtre prolongée 16–20 nov échue. Ne pas allumer le live sans annonce explicite de maintien (trading + retraits). Client LIA = paper.',
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
  agentsEgld: number | null
  marketEgld: number | null
  slotEgld: number | null
  troPrice: number | null
  troCirc: number | null
  troAccounts: number | null
  troMcap: number | null
  fetchedAt: string
}

export function egldFromAtomic(atomic: string | number | undefined): number {
  const n = typeof atomic === 'number' ? atomic : Number(atomic || 0)
  if (!Number.isFinite(n)) return 0
  return n / 1e18
}

export function formatEgld(n: number | null, digits = 4): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

export function formatCompact(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`http_${r.status}`)
  return (await r.json()) as Record<string, unknown>
}

async function accountEgld(address: string): Promise<number | null> {
  try {
    const acc = await getJson(`${API}/accounts/${address}`)
    return egldFromAtomic(String(acc.balance ?? '0'))
  } catch {
    return null
  }
}

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function fetchProtocolPulse(): Promise<ProtocolPulse> {
  const [stats, eco, lia, agentsEgld, marketEgld, slotEgld, tro] = await Promise.all([
    getJson(`${API}/stats`),
    getJson(`${API}/economics`),
    getJson(`${API}/accounts/${LIA_OPS}`),
    accountEgld(MAINNET_ADDRESSES.agents_marketplace),
    accountEgld(MAINNET_ADDRESSES.nft_marketplace),
    accountEgld(MAINNET_ADDRESSES.slot_casino),
    getJson(`${API}/tokens/${TRO_TOKEN_ID}`).catch(() => null),
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
    agentsEgld,
    marketEgld,
    slotEgld,
    troPrice: tro ? num(tro.price) : null,
    troCirc: tro ? num(tro.circulatingSupply) : null,
    troAccounts: tro ? num(tro.accounts) : null,
    troMcap: tro ? num(tro.marketCap) : null,
    fetchedAt: new Date().toISOString(),
  }
}
