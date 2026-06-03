import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { useAccount } from '../hooks/useAccount';
import WalletConnectButton from '../components/WalletConnectButton';
import { btcBridgeService } from '../services/btcBridgeService';

const BitcoinLayer2: React.FC = () => {
  const [amount, setAmount] = useState(0.01);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { address, isLoggedIn } = useAccount();

  const handleBridge = async (direction: 'to-sbtc' | 'to-btc') => {
    if (!isLoggedIn) {
      setMessage('Veuillez connecter votre wallet');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = direction === 'to-sbtc'
        ? await btcBridgeService.bridgeBtcToSbtc(amount, address)
        : await btcBridgeService.bridgeSbtcToBtc(amount, address);

      setMessage(result.message);
    } catch (e) {
      setMessage('Erreur lors du bridge');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>₿ Bitcoin Layer 2</h2>
        <WalletConnectButton />
      </div>

      {!isLoggedIn && (
        <div className="alert alert-warning">
          Veuillez connecter votre wallet pour utiliser le bridge.
        </div>
      )}

      <Card>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Montant</Form.Label>
            <Form.Control 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(parseFloat(e.target.value))} 
              step="0.001"
              disabled={!isLoggedIn}
            />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              onClick={() => handleBridge('to-sbtc')} 
              disabled={loading || !isLoggedIn}
            >
              Bridge BTC → sBTC
            </Button>
            <Button 
              variant="success" 
              onClick={() => handleBridge('to-btc')} 
              disabled={loading || !isLoggedIn}
            >
              Bridge sBTC → BTC
            </Button>
          </div>

          {message && <div className="alert alert-info mt-3">{message}</div>}
        </Card.Body>
      </Card>
    </div>
  );
};

export default BitcoinLayer2;