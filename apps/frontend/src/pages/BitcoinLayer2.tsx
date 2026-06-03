import React, { useState } from 'react';
import { Card, Button, Form, Tabs, Tab } from 'react-bootstrap';
import { btcBridgeService } from '../services/btcBridgeService';

const BitcoinLayer2: React.FC = () => {
  const [amount, setAmount] = useState(0.01);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAction = async (action: string) => {
    setLoading(true);
    setMessage('');

    try {
      let result;
      switch (action) {
        case 'bridge-btc-to-sbtc':
          result = await btcBridgeService.bridgeBtcToSbtc(amount, 'user-address');
          break;
        case 'bridge-sbtc-to-btc':
          result = await btcBridgeService.bridgeSbtcToBtc(amount, 'bc1q...');
          break;
        case 'fund-lia':
          result = { success: true, message: '⚡ [MOCK] LIA Wallet funded with 50,000 sats' };
          break;
        case 'pay-l402':
          result = { success: true, message: '🔐 [MOCK] L402 Payment successful' };
          break;
        case 'pay-x402':
          result = { success: true, message: '🔐 [MOCK] X402 Payment successful' };
          break;
        default:
          result = { success: false, message: 'Unknown action' };
      }
      setMessage(result.message);
    } catch (e) {
      setMessage('Error performing action');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <h2>₿ Bitcoin Layer 2 - xArtists</h2>
      <p className="text-muted">Complete module with Mock Bridge + Lightning + X402 + L402</p>

      <Tabs defaultActiveKey="bridge" className="mb-3">
        <Tab eventKey="bridge" title="Bridge BTC ↔ sBTC">
          <Card className="mt-3">
            <Card.Body>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} step="0.001" />
              </Form.Group>
              <div className="d-flex gap-2 mt-3">
                <Button variant="primary" onClick={() => handleAction('bridge-btc-to-sbtc')} disabled={loading}>
                  Bridge BTC → sBTC
                </Button>
                <Button variant="success" onClick={() => handleAction('bridge-sbtc-to-btc')} disabled={loading}>
                  Bridge sBTC → BTC
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="lightning" title="Lightning & L402">
          <Card className="mt-3">
            <Card.Body>
              <Button variant="warning" onClick={() => handleAction('fund-lia')} disabled={loading} className="me-2">
                Fund LIA Lightning Wallet
              </Button>
              <Button variant="info" onClick={() => handleAction('pay-l402')} disabled={loading}>
                Pay with L402
              </Button>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="x402" title="X402 Payments">
          <Card className="mt-3">
            <Card.Body>
              <Button variant="dark" onClick={() => handleAction('pay-x402')} disabled={loading}>
                Pay with X402 (Stablecoins)
              </Button>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {message && <div className="alert alert-info mt-3">{message}</div>}

      <div className="mt-4">
        <h5>Quick Links</h5>
        <a href="/payment-history" className="btn btn-outline-primary me-2">Payment History</a>
        <a href="/bridge-fees" className="btn btn-outline-secondary">Bridge Fees Dashboard</a>
      </div>
    </div>
  );
};

export default BitcoinLayer2;