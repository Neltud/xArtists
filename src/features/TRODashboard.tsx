import React from 'react';
import { Card } from '../components/Card';
import './Features.css';
import { useTROPrice } from '../services/price';
import { useMvxAccount } from '../services/mvx';

const TRODashboard: React.FC = () => {
  const troPrice = useTROPrice();
  const { address, isLoggedIn } = useMvxAccount();

  return (
    <div className="feature-container">
      <h1>💎 TRO Dashboard (TRO-94c925)</h1>
      <div>
        {isLoggedIn ? `Wallet: ${address?.slice(0, 8)}...` : 'Connect wallet'}
      </div>
      <Card title="PRIX TRO" icon="💰">
        <div style={{fontSize: '2rem', fontWeight: 'bold'}}>
          {troPrice?.usd ? `$${troPrice.usd.toFixed(6)}` : '$—'}
        </div>
        <div style={{fontSize: '0.8rem', opacity: 0.7}}>
          TRO-94c925 • {troPrice?.source || 'loading...'}
        </div>
        {troPrice?.usd_24h_change && (
          <div style={{color: troPrice.usd_24h_change > 0 ? 'green' : 'red'}}>
            24h: {troPrice.usd_24h_change > 0 ? '+' : ''}{troPrice.usd_24h_change}%
          </div>
        )}
      </div>
    </div>
  );
};
export default TRODashboard;
