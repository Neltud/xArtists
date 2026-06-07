import { initMultiversx } from './multiversx';
import { useState, useEffect } from 'react';

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

function base64ToBigInt(b64: string): bigint {
  // Browser-friendly base64 -> BigInt
  try {
    // atob is available in browser; in Node it may not be, but build target is browser
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    let hex = '';
    for (let i = 0; i < bin.length; i++) {
      const h = bin.charCodeAt(i).toString(16).padStart(2, '0');
      hex += h;
    }
    if (!hex) return BigInt(0);
    // ensure hex has even length
    if (hex.length % 2 !== 0) hex = '0' + hex;
    return BigInt('0x' + hex);
  } catch (e) {
    // fallback
    return BigInt(0);
  }
}

function parseReturnValueToBigInt(value: string): bigint | null {
  if (!value) return null;
  const v = value.toString();
  if (v.startsWith('0x') || v.startsWith('0X')) {
    try {
      return BigInt(v);
    } catch (e) {
      return null;
    }
  }
  // sometimes SDK returns base64
  try {
    // detect base64 by presence of padding or non-hex chars
    return base64ToBigInt(v);
  } catch (e) {
    return null;
  }
}

async function tryQueryReserves(proxyProvider: any, poolAddress: string): Promise<PoolReserves | null> {
  // Try common view names for AMM/Pair contracts
  const candidates = ['getReserves', 'get_reserves', 'getPoolState', 'getPoolInfo', 'get_reserve', 'getLiquidity'];
  for (const fn of candidates) {
    try {
      const res = await proxyProvider.queryContract({ address: poolAddress, func: fn, args: [] });
      if (!res) continue;
      // SDK response shapes vary. Try a few common locations for data
      // 1) res.returnData -> array of base64/hex strings
      // 2) res.data or res.returnData[0]
      const returnData: string[] | undefined = (res as any).returnData || (res as any).data || undefined;
      if (Array.isArray(returnData) && returnData.length >= 2) {
        const a = parseReturnValueToBigInt(returnData[0]);
        const b = parseReturnValueToBigInt(returnData[1]);
        if (a !== null && b !== null) return { reserveToken: a, reserveQuote: b };
      }
      // 3) some SDKs decode to value arrays
      if ((res as any).decoded && Array.isArray((res as any).decoded) && (res as any).decoded.length >= 2) {
        try {
          const d0 = BigInt((res as any).decoded[0]);
          const d1 = BigInt((res as any).decoded[1]);
          return { reserveToken: d0, reserveQuote: d1 };
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // try next
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
  // Best-effort: try public endpoints (may not exist for all chains/pools)
  const endpoints = [
    `https://api.multiversx.com/address/${poolAddress}/metrics`,
    `https://api.multiversx.com/pairs/${poolAddress}/volume?period=24h`,
    `https://api.multiversx.com/pairs/${poolAddress}/volume`,
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const json = await r.json();
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
  try {
    const reserves = await getPoolReserves(poolAddress);
    const vol24h = await tryGet24hVolume(poolAddress);
    if (!reserves.reserveQuote || !reserves.reserveToken) throw new Error('Invalid reserves');
    // convert BigInt to Number safely (may lose precision for extremely large values)
    const reserveToken = Number(reserves.reserveToken.toString());
    const reserveQuote = Number(reserves.reserveQuote.toString());
    if (reserveToken === 0) throw new Error('Zero reserve token');
    const price = reserveQuote / reserveToken; // quote per token
    const tvl = reserveQuote * 2; // value in quote units
    let aprFees: number | null = null;
    if (vol24h !== null && tvl > 0) {
      aprFees = ((vol24h * 365 * feePercent) / tvl) * 100; // percent
    }
    return { price, tvl, apr_fees: aprFees, source: poolAddress, lastUpdated: Date.now() };
  } catch (e) {
    return { price: null, tvl: null, apr_fees: null, source: poolAddress, lastUpdated: Date.now() };
  }
}

export function useOnchainStats(poolAddress: string | null, pollInterval = 60000) {
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
