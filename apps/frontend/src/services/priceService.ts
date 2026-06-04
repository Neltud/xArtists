// Récupère le prix EGLD depuis CoinGecko
export const getEgldPrice = async (): Promise<number> => {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=multiversx&vs_currencies=usd'
    );
    const data = await res.json();
    return data.multiversx.usd || 3.5;
  } catch {
    return 3.5;
  }
};

// Récupère les infos du token TRO (TRO-94c925) depuis l'API MultiversX
export const getTroInfo = async () => {
  try {
    const res = await fetch('https://api.multiversx.com/tokens/TRO-94c925');
    const data = await res.json();
    return {
      price: data.price || 0,
      marketCap: data.marketCap || 0,
      circulatingSupply: data.circulatingSupply || 0,
    };
  } catch {
    return { price: 0, marketCap: 0, circulatingSupply: 0 };
  }
};

// Prix BTC depuis CoinGecko
export const getBtcPrice = async (): Promise<number> => {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );
    const data = await res.json();
    return data.bitcoin.usd || 65000;
  } catch {
    return 65000;
  }
};