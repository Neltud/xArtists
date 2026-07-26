const LIA_ADDRESS = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6';
const MULTIVERSX_API = 'https://api.multiversx.com';

export interface LiaToken {
  identifier: string;
  name: string;
  ticker: string;
  balance: number;
  decimals: number;
  price: number;
  valueUsd: number;
}

/**
 * Récupère tous les tokens ESDT du wallet LIA
 */
export async function getAllLiaTokens(): Promise<LiaToken[]> {
  try {
    const res = await fetch(`${MULTIVERSX_API}/accounts/${LIA_ADDRESS}/tokens?size=100`);
    if (!res.ok) throw new Error('Failed to fetch tokens');
    
    const tokens = await res.json();
    
    return tokens.map((t: any) => {
      const decimals = t.decimals || 18;
      const balance = Number(t.balance) / Math.pow(10, decimals);
      const price = t.price || 0;
      
      return {
        identifier: t.identifier || t.ticker,
        name: t.name || t.ticker,
        ticker: t.ticker || t.identifier,
        balance,
        decimals,
        price,
        valueUsd: balance * price
      };
    }).filter((t: LiaToken) => t.balance > 0);
  } catch (error) {
    console.error('Error fetching LIA tokens:', error);
    return [];
  }
}

/**
 * Récupère aussi le solde EGLD natif
 */
export async function getLiaEgldBalance(): Promise<number> {
  try {
    const res = await fetch(`${MULTIVERSX_API}/accounts/${LIA_ADDRESS}`);
    const data = await res.json();
    return Number(data.balance) / 1e18;
  } catch {
    return 0;
  }
}
