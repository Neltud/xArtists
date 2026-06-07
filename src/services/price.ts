// src/services/price.ts
// TRO-94c925 - Live prices from MultiversX API + CoinGecko fallback

const TRO_TOKEN_ID = 'TRO-94c925';

type PriceData = {
  usd?: number;
  eur?: number;
  usd_24h_change?: number;
  market_cap_usd?: number;
  source?: string;
};

const CACHE: Record<string, { ts: number; data: PriceData }> = {};

const DEFAULT_POLL_INTERVAL = 30000; // 30s for faster updates

export async function fetchFromMultiversX(tokenId: string = TRO_TOKEN_ID) {
  try {
    const res = await fetch(`https://api.multiversx.com/tokens/${tokenId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      usd: data.price ? parseFloat(data.price) : undefined,
      market_cap_usd: data.marketCap ? parseFloat(data.marketCap) : undefined,
      source: 'multiversx',
    };
  } catch {
    return null;
  }
}

export async function fetchFromCoingecko() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=tro-94c925&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);
    if (!res.ok) return null;
    const json = await res.json();
    const item = json['tro-94c925'];
    if (!item) return null;
    return {
      usd: item.usd,
      usd_24h_change: item.usd_24h_change,
      market_cap_usd: item.usd_market_cap,
      source: 'coingecko',
    };
  } catch {
    return null;
  }
}

export async function getTROPrice() {
  const key = TRO_TOKEN_ID;
  const now = Date.now();
  const cached = CACHE[key];
  if (cached && (now - cached.ts) < DEFAULT_POLL_INTERVAL) return cached.data;

  // Try MultiversX first, then CoinGecko
  let data = await fetchFromMultiversX();
  if (!data || !data.usd) {
    data = await fetchFromCoingecko();
  }

  if (!data) {
    data = { usd: undefined, source: 'fallback' };
  }

  CACHE[key] = { ts: now, data };
  return data;
}

export function useTROPrice() {
  const [price, setPrice] = (globalThis as any).React?.useState<PriceData | null>(null);
  const React = (globalThis as any).React;
  if (!React) return null;

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      const p = await getTROPrice();
      if (mounted) setPrice(p);
    };
    load();
    const interval = setInterval(load, DEFAULT_POLL_INTERVAL);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return price;
}
