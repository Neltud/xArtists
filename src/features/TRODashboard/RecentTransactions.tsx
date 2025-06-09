import React from "react";

/**
 * RecentTransactions: Table of recent $TRO transactions.
 * Props:
 *   - txs: array of transactions
 *   - loading: boolean
 */
const RecentTransactions: React.FC<{
  txs: {
    txHash: string;
    timestamp: number;
    sender: string;
    receiver: string;
    value: string;
  }[];
  loading: boolean;
}> = ({ txs, loading }) => {
  if (loading) return <div>Loading transactions...</div>;
  if (!txs.length) return <div style={{ color: "#888" }}>No recent transactions found.</div>;
  return (
    <div style={{ overflowX: "auto", maxWidth: "100vw" }}>
      <table style={{ width: "100%", fontSize: "0.98rem", background: "#f8f7fc", borderRadius: 8 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>Hash</th>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>From</th>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>To</th>
            <th style={{ textAlign: "right", padding: "4px 8px" }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx) => (
            <tr key={tx.txHash}>
              <td style={{ padding: "4px 8px" }}>
                <a
                  href={`https://explorer.multiversx.com/transactions/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#5a3be7" }}
                  aria-label={`Transaction ${tx.txHash}`}
                >
                  {tx.txHash.slice(0, 8)}...
                </a>
              </td>
              <td style={{ padding: "4px 8px" }}>
                {tx.sender.slice(0, 6)}...
              </td>
              <td style={{ padding: "4px 8px" }}>
                {tx.receiver.slice(0, 6)}...
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                {Number(tx.value) / 1e18}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentTransactions;
