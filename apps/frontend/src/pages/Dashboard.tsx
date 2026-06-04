import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { getEgldPrice, getTroInfo, getBtcPrice } from '../services/priceService';

const Dashboard: React.FC = () => {
  const [prices, setPrices] = useState({
    egld: 3.5,
    tro: 0,
    btc: 65000,
  });

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

  return (
    <div className="container mt-4">
      <h2 className="mb-4">📊 xArtists — LIA v5 Dashboard</h2>

      <div className="row">
        {/* Portfolio */}
        <div className="col-md-6 mb-4">
          <Card>
            <Card.Header>PORTFOLIO TOTAL</Card.Header>
            <Card.Body>
              <h3>${(1250 * prices.egld + 45000).toFixed(2)}</h3>
              <p className="text-muted">LIA v5 • Mainnet</p>
            </Card.Body>
          </Card>
        </div>

        {/* Prix EGLD */}
        <div className="col-md-3 mb-4">
          <Card>
            <Card.Header>PRIX EGLD</Card.Header>
            <Card.Body>
              <h3>${prices.egld.toFixed(2)}</h3>
              <p className="text-muted">MultiversX</p>
            </Card.Body>
          </Card>
        </div>

        {/* Prix TRO */}
        <div className="col-md-3 mb-4">
          <Card>
            <Card.Header>PRIX TRO</Card.Header>
            <Card.Body>
              <h3>${prices.tro > 0 ? prices.tro.toFixed(6) : '—'}</h3>
              <p className="text-muted">TRO-94c925</p>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="row">
        {/* Fear & Greed */}
        <div className="col-md-4 mb-4">
          <Card>
            <Card.Header>FEAR & GREED</Card.Header>
            <Card.Body>
              <h2>42</h2>
              <p className="text-warning">Fear</p>
            </Card.Body>
          </Card>
        </div>

        {/* Progression */}
        <div className="col-md-8 mb-4">
          <Card>
            <Card.Header>PROGRESSION $1M</Card.Header>
            <Card.Body>
              <h3>12.4%</h3>
              <div className="progress">
                <div className="progress-bar" style={{ width: '12.4%' }}></div>
              </div>
              <p className="text-muted mt-2">Objectif : $1,000,000</p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;