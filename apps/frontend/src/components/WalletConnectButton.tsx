import React from 'react';
import { Button } from 'react-bootstrap';
import { useWeb3 } from '../hooks/useWeb3';
import { logout } from '@multiversx/sdk-dapp/utils';

const WalletConnectButton: React.FC = () => {
  const { address, isLoggedIn } = useWeb3();

  const handleLogin = () => {
    window.location.href = '/unlock';
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoggedIn && address) {
    return (
      <Button variant="outline-danger" size="sm" onClick={handleLogout}>
        Déconnecter ({address.slice(0, 6)}...{address.slice(-4)})
      </Button>
    );
  }

  return (
    <Button variant="primary" size="sm" onClick={handleLogin}>
      Connecter Wallet
    </Button>
  );
};

export default WalletConnectButton;