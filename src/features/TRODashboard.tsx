import React from 'react';
import { Card } from '../components/Card';
import './Features.css';
import { usePrice } from '../services/price';

const TRO_COINGECKO_ID = import.meta.env.VITE_TRO_COINGECKO_ID || 'tro-94c925';
const VS_CURRENCY = (import.meta.env.VITE_PRICE_VS || 'usd') as 'usd' | 'eur';

const formatNumber = (n: number | undefined) => {
  if (n === undefined || n === null) return '--';
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

const formatChange = (n: number | undefined) => {
  if (n === undefined || n === null) return '--';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};

const TRODashboard: React.FC = () => {
  const price = usePrice(TRO_COINGECKO_ID, VS_CURRENCY, Number(import.meta.env.VITE_PRICE_POLL_INTERVAL || 60000));

  return (
    <div className="feature-container">
      <h1>💎 $TRO Token Dashboard</h1>
      <div className="feature-grid">
        <Card title="Price & Market" icon="📈">
          <div className="info-item">
            <span>Symbol:</span>
            <strong>TRO</strong>
          </div>
          <div className="info-item">
            <span>Current Price ({VS_CURRENCY.toUpperCase()}):</span>
            <strong className="success">{price ? (VS_CURRENCY === 'usd' ? `$${formatNumber(price.usd)}` : `€${formatNumber(price.eur)}`) : 'Loading...'}</strong>
          </div>
          <div className="info-item">
            <span>24h Change:</span>
            <strong className={price && price.usd_24h_change && price.usd_24h_change >= 0 ? 'success' : ''}>{price ? formatChange(price.usd_24h_change) : 'Loading...'}</strong>
          </div>
          <div className="info-item">
            <span>Market Cap:</span>
            <strong>{price && price.market_cap_usd ? `$${Number(price.market_cap_usd).toLocaleString()}` : '—'}</strong>
          </div>
        </Card>
        <Card title="Volume & Liquidity" icon="💧">
          <div className="info-item">
            <span>24h Volume:</span>
            <strong>$2.5M</strong>
          </div>
          <div className="info-item">
            <span>Liquidity:</span>
            <strong className="success">$10M</strong>
          </div>
          <div className="info-item">
            <span>Holders:</span>
            <strong>5,200</strong>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TRODashboard;
