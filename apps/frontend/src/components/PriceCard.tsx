import React from 'react';
import { DynamicShadowCard } from './DynamicShadowCard';
import { Skeleton } from './Skeleton';

interface PriceCardProps {
  symbol: string;
  icon: string;
  price: number;
  change24h?: number;
  loading?: boolean;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  symbol,
  icon,
  price,
  change24h = 0,
  loading = false,
}) => {
  const isPositive = change24h >= 0;

  return (
    <DynamicShadowCard variant="hover">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-sm text-zinc-400">{symbol}</p>
            {loading ? (
              <Skeleton width={100} height={24} className="mt-1" />
            ) : (
              <p className="text-xl font-bold">${price.toFixed(2)}</p>
            )}
          </div>
        </div>
        {!loading && change24h !== undefined && (
          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${isPositive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </div>
        )}
      </div>
    </DynamicShadowCard>
  );
};

export default PriceCard;
