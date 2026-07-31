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

export const getTroInfo = async () => {
  try {
    const res = await fetch('https://api.multiversx.com/tokens/TRO-94c925');
    const data = await res.json();

    const decimals = data.decimals || 18;
    const rawSupply = data.supply ? Number(data.supply) : 0;
    const rawCirculating = data.circulatingSupply
      ? Number(data.circulatingSupply)
      : rawSupply;

    let circulatingSupply = rawCirculating / Math.pow(10, decimals);
    let totalSupply = rawSupply / Math.pow(10, decimals);

    // Si l'API renvoie un nombre déjà « humain » ou 0, forcer fallback doc
    if (!Number.isFinite(circulatingSupply) || circulatingSupply <= 0) {
      circulatingSupply = TRO_SUPPLY_FALLBACK;
    }
    if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
      totalSupply = TRO_SUPPLY_FALLBACK;
    }
    // Si division 10^18 a tout cassé (supply déjà non-raw)
    if (circulatingSupply < 1 && rawCirculating > 1000 && rawCirculating < 1e12) {
      circulatingSupply = rawCirculating;
      totalSupply = rawSupply || rawCirculating;
    }

    const price = Number(data.price) || 0;
    const marketCap =
      Number(data.marketCap) ||
      (price > 0 ? price * circulatingSupply : 0);

    return {
      price,
      marketCap,
      circulatingSupply,
      totalSupply,
      name: data.name || 'TUDURIORIGINAL',
      identifier: 'TRO-94c925',
      holders: data.accounts || data.holders || 0,
      transactions: data.transactions || 0,
      decimals,
    };
  } catch {
    return {
      price: 0,
      marketCap: 0,
      circulatingSupply: TRO_SUPPLY_FALLBACK,
      totalSupply: TRO_SUPPLY_FALLBACK,
      name: 'TUDURIORIGINAL',
      identifier: 'TRO-94c925',
      holders: 0,
      transactions: 0,
      decimals: 18,
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
