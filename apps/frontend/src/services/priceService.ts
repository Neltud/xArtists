// Prix EGLD via CoinGecko
export const getEgldPrice = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=multiversx&vs_currencies=usd');
    const data = await res.json();
    return data.multiversx?.usd || 0;
  } catch {
    return 0;
  }
};

// Infos du token TRO-94c925 via API MultiversX (corrigé)
export const getTroInfo = async () => {
  try {
    const res = await fetch('https://api.multiversx.com/tokens/TRO-94c925');
    const data = await res.json();

    const decimals = data.decimals || 18;
    const rawSupply = data.supply ? Number(data.supply) : 0;
    const rawCirculating = data.circulatingSupply ? Number(data.circulatingSupply) : rawSupply;

    return {
      price: data.price || 0,
      marketCap: data.marketCap || 0,
      circulatingSupply: rawCirculating / Math.pow(10, decimals),
      totalSupply: rawSupply / Math.pow(10, decimals),
      name: data.name || 'TRO',
      identifier: 'TRO-94c925',
      holders: data.accounts || 0,
      transactions: data.transactions || 0,
      decimals
    };
  } catch {
    return {
      price: 0,
      marketCap: 0,
      circulatingSupply: 0,
      totalSupply: 0,
      name: 'TRO',
      identifier: 'TRO-94c925',
      holders: 0,
      transactions: 0,
      decimals: 18
    };
  }
};

// Prix BTC via CoinGecko
export const getBtcPrice = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await res.json();
    return data.bitcoin?.usd || 0;
  } catch {
    return 0;
  }
};

// Tous les prix en une seule fois
export const getAllPrices = async () => {
  const [egld, tro, btc] = await Promise.all([
    getEgldPrice(),
    getTroInfo(),
    getBtcPrice()
  ]);
  return { egld, tro, btc };
};
