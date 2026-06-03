import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

const HatomPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const liaPosition = {
    supplied: 1250.75,
    borrowed: 320.5,
    healthFactor: 2.45,
    claimableRewards: 8.75,
    claimableValueUSD: 12.4
  };

  const handleSupply = async () => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      setMessage('✅ Collateral supplied successfully (mock)');
      setLoading(false);
    }, 1200);
  };

  const handleClaim = async () => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      setMessage('✅ Rewards claimed and swapped to stable (mock)');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container mt-4">
      <h2>🏦 Hatom Protocol - LIA Positions</h2>
      <p className="text-muted">Gestion des positions collateral et rewards de LIA v5</p>

      <div className="row">
        <div className="col-md-6">
          <Card className="mb-4">
            <Card.Header>Position Actuelle de LIA</Card.Header>
            <Card.Body>
              <p><strong>Collateral fournie :</strong> {liaPosition.supplied} EGLD</p>
              <p><strong>Borrowed :</strong> {liaPosition.borrowed} EGLD</p>
              <p><strong>Health Factor :</strong> <span className="text-success">{liaPosition.healthFactor}</span></p>
              <hr />
              <p><strong>Rewards claimables :</strong> {liaPosition.claimableRewards} HTM</p>
              <p><strong>Valeur :</strong> ~${liaPosition.claimableValueUSD}</p>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-6">
          <Card className="mb-4">
            <Card.Header>Actions</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Montant à supply (EGLD)</Form.Label>
                <Form.Control type="number" defaultValue={100} />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleSupply} 
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Supply Collateral'}
                </Button>

                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={handleClaim} 
                  disabled={loading || liaPosition.claimableRewards < 5}
                >
                  {loading ? 'Processing...' : 'Claim Rewards & Swap to Stable'}
                </Button>
              </div>

              {liaPosition.claimableRewards < 5 && (
                <p className="text-muted small mt-2">
                  Les rewards sont claimables automatiquement quand &gt; 5$ en HTM
                </p>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}
    </div>
  );
};

export default HatomPage;