import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';

const LPPoolsPage: React.FC = () => {
  const pools = [
    { dex: "xExchange", pair: "TRO / EGLD", tvl: "$245,800", apr: "18.4%", volume24h: "$32,450", change24h: "+4.2%", link: "https://xexchange.com/pools" },
    { dex: "xExchange", pair: "TRO / USDC", tvl: "$128,300", apr: "22.1%", volume24h: "$18,900", change24h: "-1.8%", link: "https://xexchange.com/pools" },
    { dex: "OneDex", pair: "TRO / EGLD", tvl: "$89,700", apr: "15.8%", volume24h: "$12,300", change24h: "+7.5%", link: "https://onedex.app" },
    { dex: "OneDex", pair: "TRO / MEX", tvl: "$67,200", apr: "31.4%", volume24h: "$9,800", change24h: "+12.3%", link: "https://onedex.app" },
  ];

  return (
    <div className="container mt-4">
      <h2>💧 LP Pools - $TRO</h2>
      <p className="text-muted">Liquidité et rendement sur les principaux DEX MultiversX</p>

      <Card>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>DEX</th>
                <th>Pair</th>
                <th>TVL</th>
                <th>APR</th>
                <th>Volume 24h</th>
                <th>24h Change</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool, index) => (
                <tr key={index}>
                  <td><strong>{pool.dex}</strong></td>
                  <td>{pool.pair}</td>
                  <td>{pool.tvl}</td>
                  <td><Badge bg="success">{pool.apr}</Badge></td>
                  <td>{pool.volume24h}</td>
                  <td>
                    <span className={pool.change24h.startsWith('+') ? 'text-success' : 'text-danger'}>
                      {pool.change24h}
                    </span>
                  </td>
                  <td>
                    <a href={pool.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                      Voir le pool
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="mt-3 text-muted small">
        * Données simulées. Connexion aux APIs xExchange et OneDex à venir.
      </div>
    </div>
  );
};

export default LPPoolsPage;