// src/services/price.ts

type PriceData = {
  usd?: number;
  eur?: number;
  usd_24h_change?: number;
  market_cap_usd?: number;
};

const DEFAULT_POLL_INTERVAL = 60000; // 60s
const CACHE: Record<string, { ts: number; data: PriceData }> = {};

export async function fetchPriceFromCoingecko(coingeckoId: string, vs: string = 'usd'): Promise<PriceData> {
  if (!coingeckoId) throw new Error('Coingecko id required');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coingeckoId)}&vs_currencies=usd,eur&include_24hr_change=true&include_market_cap=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coingecko fetch failed: ${res.status}`);
  const json = await res.json();
  const item = json[coingeckoId];
  if (!item) throw new Error('Token not found on CoinGecko');
  return {
    usd: item.usd,
    eur: item.eur,
    usd_24h_change: item.usd_24h_change,
    market_cap_usd: item.usd_market_cap,
  };
}

export async function getPrice(coingeckoId: string, vs: string = 'usd', cacheTtlMs: number = DEFAULT_POLL_INTERVAL): Promise<PriceData> {
  const key = `${coingeckoId}:${vs}`;
  const now = Date.now();
  const cached = CACHE[key];
  if (cached && now - cached.ts < cacheTtlMs) return cached.data;

  const data = await fetchPriceFromCoingecko(coingeckoId, vs);
  CACHE[key] = { ts: now, data };
  return data;
}

export function usePrice(coingeckoId: string, vs: 'usd' | 'eur' = 'usd', intervalMs: number = DEFAULT_POLL_INTERVAL) {
  // lightweight hook using setInterval
  const [price, setPrice] = (globalThis as any).React?.useState<PriceData | null>(null);
  const React = (globalThis as any).React;
  if (!React) {
    // fallback for environments without React attached to global (tests/tooling)
    throw new Error('React must be available in global scope for usePrice to work');
  }
  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;

    const load = async () => {
      try {
        const p = await getPrice(coingeckoId, vs, intervalMs);
        if (mounted) setPrice(p as PriceData);
      } catch (e) {
        // ignore errors, do not break UI
        // console.warn(e);
      }
    };

    load();
    timer = setInterval(load, intervalMs);
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [coingeckoId, vs, intervalMs]);

  return price;
}
