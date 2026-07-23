import { useState, useEffect } from 'react';
import { getRealTimePrices } from '../services/priceService';

interface RealTimePrices {
  egld: number;
  btc: number;
  tro: number;
  troChange24h: number;
  loading: boolean;
  error: string | null;
}

export const useRealTimePrices = (refreshInterval: number = 30000) => {
  const [prices, setPrices] = useState<RealTimePrices>({
    egld: 0,
    btc: 0,
    tro: 0,
    troChange24h: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const data = await getRealTimePrices();
        setPrices({
          ...data,
          loading: false,
          error: null,
        });
      } catch (error) {
        setPrices((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch prices',
        }));
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return prices;
};
