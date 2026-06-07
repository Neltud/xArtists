import React from 'react';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks/account/useGetLoginInfo';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks/account/useGetAccountInfo';
import { logout } from '@multiversx/sdk-dapp/utils';

interface WalletConnectProps {
  className?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const { isLoggedIn, loginMethod } = useGetLoginInfo();
  const { address, account } = useGetAccountInfo();

  const handleLogin = () => {
    // The DappProvider handles the actual login modal
    // You can trigger specific providers if needed
    window.dispatchEvent(new CustomEvent('mvx:open-wallet-modal'));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      alert('Error during logout. Please try again.');
    }
  };

  if (isLoggedIn && address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const egldBalance = account?.balance 
      ? (parseFloat(account.balance) / 1e18).toFixed(4) 
      : '0';

    return (
      <div className={`wallet-connect connected ${className}`}>
        <div className="wallet-info">
          <span className="wallet-address" title={address}>
            {shortAddress}
          </span>
          <span className="wallet-balance">
            {egldBalance} EGLD
          </span>
          <span className="wallet-method">via {loginMethod}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="btn btn-secondary btn-sm"
          aria-label="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin} 
      className={`btn btn-primary wallet-connect-btn ${className}`}
      aria-label="Connect your MultiversX wallet"
    >
      Connect Wallet
    </button>
  );
};

export default WalletConnect;
