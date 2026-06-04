import React, { useState, useEffect } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { useAccount } from '../hooks/useAccount';
import WalletConnectButton from '../components/WalletConnectButton';
import { btcBridgeService } from '../services/btcBridgeService';
import { getEgldPrice, getTroInfo, getBtcPrice } from '../services/priceService';

const BitcoinLayer2: React.FC = () => {
  const [amount, setAmount] = useState(0.01);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { address, isLoggedIn } = useAccount();

  const [prices, setPrices] = useState({ egld: 3.5, tro: 0, btc: 65000 });

  useEffect(() => {
    const fetchPrices = async () => {
      const [egld, troInfo, btc] = await Promise.all([
        getEgldPrice(),
        getTroInfo(),
        getBtcPrice(),
      ]);
      setPrices({ egld, tro: troInfo.price, btc });
    };
    fetchPrices();
  }, []);

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

      <div className="mb-3 text-muted">
        Prix actuels : EGLD = ${prices.egld.toFixed(2)} | TRO = ${prices.tro.toFixed(6)} | BTC = ${prices.btc.toFixed(0)}
      </div>

      {!isLoggedIn && <div className="alert alert-warning">Veuillez connecter votre wallet.</div>}

      <Card>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Montant</Form.Label>
            <Form.Control type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} step="0.001" disabled={!isLoggedIn} />
          </Form.Group>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => handleBridge('to-sbtc')} disabled={loading || !isLoggedIn}>
              Bridge BTC → sBTC
            </Button>
            <Button variant="success" onClick={() => handleBridge('to-btc')} disabled={loading || !isLoggedIn}>
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