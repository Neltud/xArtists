import React, { useEffect, useState } from 'react';
import DynamicShadowCard from '../components/DynamicShadowCard';
import Skeleton from '../components/Skeleton';
import { getEgldPrice, getTroInfo, getBtcPrice } from '../services/priceService';

const Dashboard: React.FC = () => {
  const [prices, setPrices] = useState({ egld: 3.5, tro: 0, btc: 65000 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const [egld, troInfo, btc] = await Promise.all([
          getEgldPrice(),
          getTroInfo(),
          getBtcPrice(),
        ]);
        setPrices({ egld, tro: troInfo.price, btc });
      } catch (error) {
        console.error('Error fetching prices');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="h-9 w-48 mb-8">
          <Skeleton height="2.25rem" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Portfolio Skeleton */}
          <DynamicShadowCard className="lg:col-span-2">
            <Skeleton height="1rem" width="120px" className="mb-3" />
            <Skeleton height="2.5rem" width="60%" className="mb-2" />
            <Skeleton height="1rem" width="80px" />
          </DynamicShadowCard>

          {/* EGLD Price Skeleton */}
          <DynamicShadowCard>
            <Skeleton height="1rem" width="80px" className="mb-3" />
            <Skeleton height="2.25rem" width="70%" />
          </DynamicShadowCard>

          {/* TRO Price Skeleton */}
          <DynamicShadowCard>
            <Skeleton height="1rem" width="80px" className="mb-3" />
            <Skeleton height="2.25rem" width="70%" />
          </DynamicShadowCard>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DynamicShadowCard variant="hover" className="lg:col-span-2">
          <div className="text-sm text-zinc-400 mb-1">PORTFOLIO TOTAL</div>
          <div className="text-4xl font-semibold tracking-tighter">
            ${(1250 * prices.egld + 45000).toFixed(0)}
          </div>
          <div className="text-emerald-400 text-sm mt-1">+2.4% today</div>
        </DynamicShadowCard>

        <DynamicShadowCard variant="hover">
          <div className="text-sm text-zinc-400 mb-1">PRIX EGLD</div>
          <div className="text-3xl font-semibold tracking-tight">
            ${prices.egld.toFixed(2)}
          </div>
        </DynamicShadowCard>

        <DynamicShadowCard variant="glow">
          <div className="text-sm text-zinc-400 mb-1">PRIX TRO</div>
          <div className="text-3xl font-semibold tracking-tight">
            {prices.tro > 0 ? `$${prices.tro.toFixed(6)}` : '—'}
          </div>
        </DynamicShadowCard>
      </div>
    </div>
  );
};

export default Dashboard;
