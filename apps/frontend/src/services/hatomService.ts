/**
 * Hatom / LIA wallet positions (supply-side only, no borrow display).
 * Uses MultiversX account tokens; HTM identified by ticker.
 */

import { fetchMirroredJson } from '../config/dataSources'

const LIA = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6';
const API = 'https://api.multiversx.com';

interface HatomMirrorData {
  wallet?: string
  positions?: {
    collateral_usd?: number | null
    borrowed_usd?: number
    health_factor?: number | null
    htm_rewards_claimable?: number | null
    note?: string
  }
  updated?: string
}

export interface HatomSnapshot {
  wallet: string;
  collateral_tokens: Array<{
    identifier: string;
    name: string;
    balance: number;
    value_usd: number;
  }>;
  collateral_usd: number;
  htm_balance: number;
  htm_value_usd: number;
  borrowed_usd: number;
  note: string;
  updated: string;
}

async function fetchMirroredSnapshot(updated: string): Promise<HatomSnapshot | null> {
  try {
    const mirror = await fetchMirroredJson<HatomMirrorData>('hatom_lia.json', {
      cache: 'no-store',
      bustCache: true,
    })
    const collateralUsd = Number(mirror.positions?.collateral_usd ?? 0)
    const borrowedUsd = Number(mirror.positions?.borrowed_usd ?? 0)
    const claimableHtm = Number(mirror.positions?.htm_rewards_claimable ?? 0)

    if (collateralUsd <= 0 && borrowedUsd <= 0 && claimableHtm <= 0 && !mirror.positions?.note) {
      return null
    }

    return {
      wallet: mirror.wallet || LIA,
      collateral_tokens: collateralUsd > 0
        ? [{
            identifier: 'hatom-mirror',
            name: 'Hatom mirror snapshot',
            balance: 0,
            value_usd: collateralUsd,
          }]
        : [],
      collateral_usd: collateralUsd,
      htm_balance: 0,
      htm_value_usd: 0,
      borrowed_usd: borrowedUsd,
      note: mirror.positions?.note || 'Mirrored Hatom snapshot from Vellum',
      updated: mirror.updated || updated,
    }
  } catch {
    return null
  }
}

export async function fetchLiaHatomSnapshot(): Promise<HatomSnapshot> {
  const updated = new Date().toISOString();
  try {
    const res = await fetch(`${API}/accounts/${LIA}/tokens?size=100`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tokens: any[] = await res.json();

    const collateral_tokens = [];
    let collateral_usd = 0;
    let htm_balance = 0;
    let htm_value_usd = 0;

    for (const t of tokens) {
      const dec = Number(t.decimals ?? 18);
      const raw = Number(t.balance ?? 0);
      const bal = raw / Math.pow(10, dec);
      const price = Number(t.price ?? t.valueUsd ?? 0) || 0;
      // value: some APIs give valueUsd as total
      let value_usd = Number(t.valueUsd ?? 0);
      if (!value_usd && price && bal) value_usd = price * bal;

      const id = String(t.identifier || '');
      const ticker = id.split('-')[0]?.toUpperCase() || '';

      if (ticker === 'HTM') {
        htm_balance += bal;
        htm_value_usd += value_usd;
      }

      // Afficher tokens avec valeur > 0 comme collateral proxy (wallet-level)
      if (value_usd > 0.01 || bal > 0) {
        collateral_tokens.push({
          identifier: id,
          name: t.name || ticker,
          balance: bal,
          value_usd,
        });
        collateral_usd += value_usd;
      }
    }

    return {
      wallet: LIA,
      collateral_tokens,
      collateral_usd,
      htm_balance,
      htm_value_usd,
      borrowed_usd: 0,
      note:
        'Wallet-level ESDT snapshot (proxy collateral). Hatom protocol positions may need dedicated SC queries for exact supply shares.',
      updated,
    };
  } catch (e) {
    const mirrored = await fetchMirroredSnapshot(updated)
    if (mirrored) {
      return mirrored
    }
    return {
      wallet: LIA,
      collateral_tokens: [],
      collateral_usd: 0,
      htm_balance: 0,
      htm_value_usd: 0,
      borrowed_usd: 0,
      note: `Fetch failed: ${e instanceof Error ? e.message : 'error'}`,
      updated,
    };
  }
}
