import { initMultiversx } from './multiversx';

type PoolReserves = {
  reserveToken: bigint | null;
  reserveQuote: bigint | null;
  tokenDecimals?: number;
  quoteDecimals?: number;
};

type OnchainStats = {
  price?: number | null; // price of token in quote (e.g. EGLD or USDC)
  tvl?: number | null; // value locked in quote units
  apr_fees?: number | null; // APR from fees
  source?: string; // pool address used
  lastUpdated?: number;
};

const SECONDS_PER_YEAR = 31536000;

async function tryQueryReserves(proxyProvider: any, poolAddress: string): Promise<PoolReserves | null> {
  // Try common method names for AMM contracts; fallback to null
  const candidates = ['getReserves', 'get_reserves', 'getPoolState', 'getPoolInfo', 'get_reserve'];
  for (const fn of candidates) {
    try {
      // proxyProvider.queryContract takes different shapes across sdk versions; try a common signature
      // The SDK may accept {address, func, args}
      // We'll call proxyProvider.queryContract and inspect result
      // eslint-disable-next-line no-await-in-loop
      const res = await proxyProvider.queryContract({ address: poolAddress, func: fn, args: [] });
      // If we get a result with data we attempt to parse numeric values
      if (res && res.returnData) {
        // Attempt to decode base64 returnData to numbers
        // Many SDKs already decode; we handle common shapes
        // Here we attempt to pick first two numeric fields
        const rd = res.returnData;
        // rd often contains hex/base64 strings; best-effort parsing
        const parsed: any[] = rd.map((r: string) => {
          try {
            // if hex
            if (r.startsWith('0x')) return BigInt(r);
            // base64 -> buffer
            const buf = Buffer.from(r, 'base64');
            // try BigInt from buffer
            let asHex = '0x' + buf.toString('hex');
            return BigInt(asHex);
          } catch (e) {
            return null;
          }
        });
        if (parsed.length >= 2 && (parsed[0] !== null) && (parsed[1] !== null)) {
          return { reserveToken: parsed[0], reserveQuote: parsed[1] } as PoolReserves;
        }
      }
    } catch (e) {
      // ignore and try next
      // console.debug('query attempt failed', fn, e?.message || e);
    }
  }
  return null;
}

export async function getPoolReserves(poolAddress: string): Promise<PoolReserves> {
  const { proxyProvider } = await initMultiversx();
  if (!proxyProvider) throw new Error('ProxyProvider not initialized');
  const res = await tryQueryReserves(proxyProvider, poolAddress);
  if (res) return res;
  throw new Error('Unable to query pool reserves for ' + poolAddress);
}

async function tryGet24hVolume(poolAddress: string): Promise<number | null> {
  // Best-effort: use MultiversX explorer metrics API if available
  // Example endpoint: https://api.multiversx.com/collections/<address>/volume?period=24h
  // There's no guaranteed standardized endpoint; we try a few known endpoints
  const endpoints = [
    `https://api.multiversx.com/address/${poolAddress}/metrics`,
    `https://api.multiversx.com/pairs/${poolAddress}/volume?period=24h`,
    `https://api.multiversx.com/pairs/${poolAddress}/volume`,
  ];
  for (const url of endpoints) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const r = await fetch(url);
      if (!r.ok) continue;
      // eslint-disable-next-line no-await-in-loop
      const json = await r.json();
      // attempt to locate a 24h volume field
      const v = json.volume24h || json['24h_volume'] || json.volume || json['volume_24h'];
      if (typeof v === 'number') return v;
      if (v && typeof v === 'string') return parseFloat(v);
    } catch (e) {
      // ignore
    }
  }
  return null;
}

export async function calculateAPYFromPool(poolAddress: string, feePercent = 0.003): Promise<OnchainStats> {
  // feePercent default 0.3% = 0.003
  try {
    const reserves = await getPoolReserves(poolAddress);
    const vol24h = await tryGet24hVolume(poolAddress);
    // price = reserveQuote / reserveToken (best-effort using BigInt)
    if (!reserves.reserveQuote || !reserves.reserveToken) throw new Error('Invalid reserves');
    const reserveToken = Number(reserves.reserveToken.toString());
    const reserveQuote = Number(reserves.reserveQuote.toString());
    if (reserveToken === 0) throw new Error('Zero reserve token');
    const price = reserveQuote / reserveToken; // quote per token
    // TVL in quote units: reserveQuote * 2 (both sides) OR reserveToken*price*2
    const tvl = reserveQuote * 2;
    let aprFees: number | null = null;
    if (vol24h !== null && tvl > 0) {
      aprFees = ((vol24h * 365 * feePercent) / tvl) * 100; // percent
    }
    return { price, tvl, apr_fees: aprFees, source: poolAddress, lastUpdated: Date.now() };
  } catch (e) {
    return { price: null, tvl: null, apr_fees: null, source: poolAddress, lastUpdated: Date.now() };
  }
}

// React hook
export function useOnchainStats(poolAddress: string | null, pollInterval = 60000) {
  const React = (globalThis as any).React;
  if (!React) throw new Error('React required');
  const { useState, useEffect } = React;
  const [stats, setStats] = useState<OnchainStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!poolAddress) return;
    let mounted = true;
    let timer: any = null;
    const load = async () => {
      setLoading(true);
      try {
        const s = await calculateAPYFromPool(poolAddress);
        if (mounted) setStats(s);
      } catch (e) {
        if (mounted) setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    timer = setInterval(load, pollInterval);
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [poolAddress, pollInterval]);

  return { stats, loading };
}
