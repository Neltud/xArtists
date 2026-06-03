import React from 'react';

const BridgeFeesDashboard: React.FC = () => {
  return (
    <div className="container mt-4">
      <h3>💰 Frais Collectés sur le Bridge</h3>
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5>Total des frais</h5>
              <h2 className="text-success">12.45 EGLD</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5>Nombre de bridges</h5>
              <h2>87</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5>Dernier frais</h5>
              <h2>0.15 EGLD</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeFeesDashboard;