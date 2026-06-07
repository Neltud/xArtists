import React from 'react';
import { Card } from '../components/Card';
import './Features.css';
import { usePrice } from '../services/price';
import { useMvxAccount } from '../services/mvx';

const TRO_TOKEN = 'TRO-94c925';

const TRODashboard: React.FC = () => {
  const price = usePrice(TRO_TOKEN);
  const { address, account, isLoggedIn } = useMvxAccount();

  const egldBalance = account?.balance ? (parseFloat(account.balance) / 1e18).toFixed(4) : '0';

  return (
    <div className="feature-container">
      <h1>💎 $TRO Token Dashboard (TRO-94c925)</h1>
      <div className="wallet-status">
        {isLoggedIn ? `Connected: ${address?.slice(0,8)}... | EGLD: ${egldBalance}` : 'Connect wallet for on-chain data'}
      </div>
      <div className="feature-grid">
        <Card title="Price & Market" icon="📈">
          <div>Current Price: {price?.usd ? `$${price.usd}` : 'Loading...'} (via CoinGecko + MultiversX API)</div>
          <div>24h Change: {price?.usd_24h_change ? `${price.usd_24h_change}%` : '--'}</div>
          <div>Market Cap: {price?.market_cap_usd ? `$${price.market_cap_usd}` : '--'}</div>
          {price?.multiversx_price && <div>MultiversX Price: ${price.multiversx_price}</div>}
        </Card>
        {/* Other cards */}
      </div>
    </div>
  );
};
export default TRODashboard;
