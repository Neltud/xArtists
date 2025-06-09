import React, { useEffect, useState } from "react";
import "./DemoFeature.css";
import PriceChart from "./TRODashboard/PriceChart";
import TokenInfo from "./TRODashboard/TokenInfo";
import RecentTransactions from "./TRODashboard/RecentTransactions";

// --- Types ---
type TroTokenInfo = {
  name: string;
  identifier: string;
  price: { usd: string };
  marketCap: string;
  supply: string;
  circulatingSupply: string;
  holders: number;
  decimals: number;
  assets: { avatar: string };
  website: string;
  description: string;
};

type TroTransaction = {
  txHash: string;
  timestamp: number;
  sender: string;
  receiver: string;
  value: string;
};

// --- Constants ---
const TRO_TOKEN_ID = "TRO-94c925";
const EXPLORER_API = `https://explorer-api.multiversx.com/tokens/${TRO_TOKEN_ID}`;
const TX_API = `https://explorer-api.multiversx.com/transactions?token=${TRO_TOKEN_ID}&size=5`;

// --- Helper: Simulate price history for demo ---
function getDemoPriceHistory(latest: number): number[] {
  let arr = [latest || 0.1];
  for (let i = 1; i < 14; ++i) {
    arr.unshift(Math.max(0.01, arr[0] + (Math.random() - 0.5) * 0.01));
  }
  return arr;
}

/**
 * TRODashboard: Main dashboard for $TRO token.
 * Fetches token info and recent transactions, and displays price chart.
 */
const TRODashboard: React.FC = () => {
  const [info, setInfo] = useState<TroTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [txs, setTxs] = useState<TroTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  // Fetch token info
  useEffect(() => {
    setLoading(true);
    fetch(EXPLORER_API)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch token info");
        return res.json();
      })
      .then((data) => {
        setInfo(data);
        setErr(null);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch recent transactions
  useEffect(() => {
    setTxLoading(true);
    fetch(TX_API)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch transactions");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTxs(
            data.map((tx: any) => ({
              txHash: tx.txHash || tx.hash,
              timestamp: tx.timestamp,
              sender: tx.sender,
              receiver: tx.receiver,
              value: tx.value,
            }))
          );
        }
      })
      .catch(() => setTxs([]))
      .finally(() => setTxLoading(false));
  }, []);

  const price = Number(info?.price?.usd) || 0.1;
  const priceHistory = getDemoPriceHistory(price);

  return (
    <div className="demo-feature" aria-labelledby="tro-dashboard-title">
      <h2 id="tro-dashboard-title">💎 $TRO Token Dashboard</h2>
      {loading && <p>Loading token info...</p>}
      {err && <p style={{ color: "red" }}>Error: {err}</p>}
      {info && (
        <>
          <TokenInfo info={info} />
          <div style={{ marginTop: 28 }}>
            <h3 style={{ marginBottom: 6, color: "#5a3be7" }}>Price History (Demo)</h3>
            <div style={{ overflowX: "auto", maxWidth: "100vw" }}>
              <PriceChart data={priceHistory} />
            </div>
            <div style={{ fontSize: "0.95rem", color: "#888", marginTop: 2 }}>
              Last 14 days (simulated)
            </div>
          </div>
          <div style={{ marginTop: 28 }}>
            <h3 style={{ marginBottom: 6, color: "#5a3be7" }}>Recent Transactions</h3>
            <RecentTransactions txs={txs} loading={txLoading} />
          </div>
        </>
      )}
    </div>
  );
};

export default TRODashboard;
