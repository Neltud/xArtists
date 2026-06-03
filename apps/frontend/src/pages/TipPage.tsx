import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

const TipPage: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<'btc' | 'egld' | 'gofundme'>('btc');
  const [amount, setAmount] = useState(10);

  const btcAddress = "bc1qrsmtgwlqvd66vkpng26yf8c8s07df332ac052z";
  const egldAddress = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6";
  const gofundmeUrl = "https://gofundme.com/u/27661c1c-0a76-4fcd-85a8-cafc8191622d";

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const getAddress = () => {
    if (selectedMethod === 'btc') return btcAddress;
    if (selectedMethod === 'egld') return egldAddress;
    return gofundmeUrl;
  };

  return (
    <div className="container mt-4">
      <h2>💝 Faire un Pourboire / Tip</h2>
      <p className="text-muted">Soutenez le projet xArtists et LIA v5</p>

      <div className="row">
        <div className="col-md-5">
          <Card className="mb-4">
            <Card.Header>Choisir la méthode</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant={selectedMethod === 'btc' ? 'primary' : 'outline-primary'} 
                  onClick={() => setSelectedMethod('btc')}
                >
                  ₿ Bitcoin (Lightning)
                </Button>
                <Button 
                  variant={selectedMethod === 'egld' ? 'primary' : 'outline-primary'} 
                  onClick={() => setSelectedMethod('egld')}
                >
                  EGLD (MultiversX)
                </Button>
                <Button 
                  variant={selectedMethod === 'gofundme' ? 'primary' : 'outline-primary'} 
                  onClick={() => setSelectedMethod('gofundme')}
                >
                  GoFundMe (Fiat)
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-7">
          <Card>
            <Card.Header>
              {selectedMethod === 'btc' && 'Bitcoin Address'}
              {selectedMethod === 'egld' && 'EGLD Address'}
              {selectedMethod === 'gofundme' && 'GoFundMe'}
            </Card.Header>
            <Card.Body className="text-center">
              {selectedMethod !== 'gofundme' ? (
                <>
                  <div className="bg-light p-3 mb-3" style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                    {getAddress()}
                  </div>
                  <p className="text-muted small">Scannez le QR code avec votre wallet</p>
                </>
              ) : (
                <a href={gofundmeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-lg">
                  Aller sur GoFundMe
                </a>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {selectedMethod !== 'gofundme' && (
        <Card className="mt-4">
          <Card.Header>Montants suggérés</Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap gap-2">
              {predefinedAmounts.map((amt) => (
                <Button 
                  key={amt} 
                  variant={amount === amt ? 'primary' : 'outline-primary'}
                  onClick={() => setAmount(amt)}
                >
                  {amt} {selectedMethod === 'btc' ? 'sats' : 'EGLD'}
                </Button>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="mt-4">
        <Card.Header>Historique des dons récents</Card.Header>
        <Card.Body>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
              <span>0xMOCK... donation</span> 
              <span className="text-success">+50 EGLD</span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>bc1q... donation</span> 
              <span className="text-success">+100,000 sats</span>
            </li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TipPage;