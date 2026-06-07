// src/services/price.ts
// Real prices: CoinGecko + MultiversX API integration

type PriceData = {
  usd?: number;
  eur?: number;
  usd_24h_change?: number;
  market_cap_usd?: number;
  multiversx_price?: number; // From MVX API if available
};

const DEFAULT_POLL_INTERVAL = 60000;
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

// Live MultiversX API for token info and price hints (example using economics or token endpoint)
export async function fetchFromMultiversXApi(tokenIdentifier: string = 'TRO-94c925'): Promise<any> {
  try {
    // MultiversX public API for token details
    const url = `https://api.multiversx.com/tokens/${tokenIdentifier}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      price: data.price || null,
      marketCap: data.marketCap || null,
      circulatingSupply: data.circulatingSupply,
      // Add more fields as needed
    };
  } catch (e) {
    console.warn('MultiversX API fetch failed, falling back');
    return null;
  }
}

export async function getPrice(coingeckoId: string = 'tro-94c925', vs: string = 'usd', cacheTtlMs: number = DEFAULT_POLL_INTERVAL): Promise<PriceData> {
  const key = `${coingeckoId}:${vs}`;
  const now = Date.now();
  const cached = CACHE[key];
  if (cached && now - cached.ts < cacheTtlMs) return cached.data;

  const [cgData, mvxData] = await Promise.all([
    fetchPriceFromCoingecko(coingeckoId, vs).catch(() => ({})),
    fetchFromMultiversXApi('TRO-94c925').catch(() => null),
  ]);

  const merged: PriceData = {
    ...cgData,
    multiversx_price: mvxData?.price || undefined,
  };

  CACHE[key] = { ts: now, data: merged };
  return merged;
}

export function usePrice(coingeckoId: string = 'tro-94c925', vs: 'usd' | 'eur' = 'usd', intervalMs: number = DEFAULT_POLL_INTERVAL) {
  const [price, setPrice] = (globalThis as any).React?.useState<PriceData | null>(null);
  const React = (globalThis as any).React;
  if (!React) throw new Error('React must be available');

  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;

    const load = async () => {
      try {
        const p = await getPrice(coingeckoId, vs, intervalMs);
        if (mounted) setPrice(p as PriceData);
      } catch (e) {
        // silent fail
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
