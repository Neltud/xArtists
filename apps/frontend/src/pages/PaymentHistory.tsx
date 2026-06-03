import React, { useEffect, useState } from 'react';

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const mockData = [
      { id: 1, date: "2026-06-03 20:15", type: "Bridge BTC → sBTC", amount: "0.05", protocol: "Bridge", status: "Success" },
      { id: 2, date: "2026-06-03 19:45", type: "L402 Payment", amount: "120", protocol: "L402", status: "Success" },
      { id: 3, date: "2026-06-03 18:30", type: "X402 Payment", amount: "0.75", protocol: "X402", status: "Success" },
    ];
    setPayments(mockData);
  }, []);

  return (
    <div className="container mt-4">
      <h3>📜 Historique des Paiements</h3>
      <table className="table table-striped mt-3">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Montant</th>
            <th>Protocole</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.date}</td>
              <td>{p.type}</td>
              <td>{p.amount}</td>
              <td>{p.protocol}</td>
              <td><span className="badge bg-success">{p.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistory;