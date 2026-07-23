import { useState, useEffect } from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { getAccountBalance, getAccountTokens, getAccountNfts } from '../services/priceService';

interface PortfolioData {
  egldBalance: string;
  tokens: any[];
  nfts: any[];
  totalValue: number;
  loading: boolean;
  error: string | null;
}

export const usePortfolioData = () => {
  const { address, isLoggedIn } = useGetAccountInfo();
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    egldBalance: '0',
    tokens: [],
    nfts: [],
    totalValue: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isLoggedIn || !address) {
      setPortfolio((prev) => ({
        ...prev,
        loading: false,
        error: 'Wallet not connected',
      }));
      return;
    }

    const fetchPortfolio = async () => {
      try {
        const [balance, tokens, nfts] = await Promise.all([
          getAccountBalance(address),
          getAccountTokens(address),
          getAccountNfts(address),
        ]);

        setPortfolio({
          egldBalance: balance,
          tokens,
          nfts,
          totalValue: parseFloat(balance),
          loading: false,
          error: null,
        });
      } catch (error) {
        setPortfolio((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch portfolio data',
        }));
      }
    };

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [isLoggedIn, address]);

  return portfolio;
};
