// Prix EGLD via CoinGecko
export const getEgldPrice = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=multiversx&vs_currencies=usd');
    const data = await res.json();
    return data.multiversx.usd || 3.5;
  } catch {
    return 3.5;
  }
};

// Infos du token TRO-94c925 via API MultiversX
export const getTroInfo = async () => {
  try {
    const res = await fetch('https://api.multiversx.com/tokens/TRO-94c925');
    const data = await res.json();
    return {
      price: data.price || 0,
      marketCap: data.marketCap || 0,
      circulatingSupply: data.circulatingSupply || 0,
      name: data.name || 'TRO',
      identifier: 'TRO-94c925'
    };
  } catch {
    return { price: 0, marketCap: 0, circulatingSupply: 0, name: 'TRO', identifier: 'TRO-94c925' };
  }
};

// Prix BTC via CoinGecko
export const getBtcPrice = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await res.json();
    return data.bitcoin.usd || 65000;
  } catch {
    return 65000;
  }
};