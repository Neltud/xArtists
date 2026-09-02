import { fetchMirroredJson } from '../config/dataSources'

// Prix EGLD — MultiversX economics first, CoinGecko fallback
export const getEgldPrice = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.multiversx.com/economics');
    if (res.ok) {
      const data = await res.json();
      if (data?.price) return Number(data.price);
    }
  } catch {
    /* fall through */
  }
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=multiversx&vs_currencies=usd',
    );
    const data = await res.json();
    return data.multiversx?.usd || 0;
  } catch {
    return 0;
  }
};

/** Supply documentée e-compass / on-chain approx quand API renvoie raw 0 */
const TRO_SUPPLY_FALLBACK = 476_223;

interface TroMirrorConfig {
  tro_supply?: number
  tro_circulating?: number
  tro_decimals?: number
  tro_name?: string
  tro_token?: string
}

interface TroMirrorPool {
  token?: string
  name?: string
  supply?: number
  circulating?: number
  decimals?: number
  price_usd?: number
}

async function getTroMirrorDefaults() {
  const [configRes, poolRes] = await Promise.allSettled([
    fetchMirroredJson<TroMirrorConfig>('config.json', { cache: 'no-store' }),
    fetchMirroredJson<TroMirrorPool>('tro_pool.json', { cache: 'no-store' }),
  ])

  const config = configRes.status === 'fulfilled' ? configRes.value : null
  const pool = poolRes.status === 'fulfilled' ? poolRes.value : null

  const supply =
    config?.tro_supply ||
    pool?.supply ||
    pool?.circulating ||
    TRO_SUPPLY_FALLBACK

  return {
    price: pool?.price_usd || 0,
    circulatingSupply: config?.tro_circulating || pool?.circulating || supply,
    totalSupply: supply,
    name: pool?.name || config?.tro_name || 'TUDURIORIGINAL',
    identifier: pool?.token || config?.tro_token || 'TRO-94c925',
    holders: 0,
    transactions: 0,
    decimals: config?.tro_decimals || pool?.decimals || 18,
  }
}

async function getTroSupplyFallback(): Promise<number> {
  try {
    const config = await fetchMirroredJson<{ tro_supply?: number }>('config.json', {
      cache: 'no-store',
    })
    return config.tro_supply && config.tro_supply > 0
      ? config.tro_supply
      : TRO_SUPPLY_FALLBACK
  } catch {
    return TRO_SUPPLY_FALLBACK
  }
}

export const getTroInfo = async () => {
  const supplyFallback = await getTroSupplyFallback()
  const mirrorDefaults = await getTroMirrorDefaults()
  try {
    const res = await fetch('https://api.multiversx.com/tokens/TRO-94c925');
    const data = await res.json();

    const decimals = data.decimals || mirrorDefaults.decimals || 18;
    const rawSupply = data.supply ? Number(data.supply) : 0;
    const rawCirculating = data.circulatingSupply
      ? Number(data.circulatingSupply)
      : rawSupply;

    let circulatingSupply = rawCirculating / Math.pow(10, decimals);
    let totalSupply = rawSupply / Math.pow(10, decimals);

    // Si l'API renvoie un nombre déjà « humain » ou 0, forcer fallback doc
    if (!Number.isFinite(circulatingSupply) || circulatingSupply <= 0) {
      circulatingSupply = mirrorDefaults.circulatingSupply || supplyFallback;
    }
    if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
      totalSupply = mirrorDefaults.totalSupply || supplyFallback;
    }
    // Si division 10^18 a tout cassé (supply déjà non-raw)
    if (circulatingSupply < 1 && rawCirculating > 1000 && rawCirculating < 1e12) {
      circulatingSupply = rawCirculating;
      totalSupply = rawSupply || rawCirculating;
    }

    const price = Number(data.price) || mirrorDefaults.price || 0;
    const marketCap =
      Number(data.marketCap) ||
      (price > 0 ? price * circulatingSupply : 0);

    return {
      price,
      marketCap,
      circulatingSupply,
      totalSupply,
      name: data.name || mirrorDefaults.name,
      identifier: data.identifier || mirrorDefaults.identifier,
      holders: data.accounts || data.holders || 0,
      transactions: data.transactions || 0,
      decimals,
    };
  } catch {
    return {
      price: mirrorDefaults.price || 0,
      marketCap: 0,
      circulatingSupply: mirrorDefaults.circulatingSupply || supplyFallback,
      totalSupply: mirrorDefaults.totalSupply || supplyFallback,
      name: mirrorDefaults.name,
      identifier: mirrorDefaults.identifier,
      holders: mirrorDefaults.holders,
      transactions: mirrorDefaults.transactions,
      decimals: mirrorDefaults.decimals,
    };
  }
};

export const getBtcPrice = async (): Promise<number> => {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    );
    const data = await res.json();
    return data.bitcoin?.usd || 0;
  } catch {
    return 0;
  }
};

export const getAllPrices = async () => {
  const [egld, tro, btc] = await Promise.all([
    getEgldPrice(),
    getTroInfo(),
    getBtcPrice(),
  ]);
  return { egld, tro, btc };
};
