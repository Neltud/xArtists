import React, { useState } from "react";
import "./DemoFeature.css";

const mockProposals = [
  {
    id: 1,
    title: "Increase rewards for NFT staking",
    status: "Active",
    votes: { approve: 12, reject: 3 },
  },
  {
    id: 2,
    title: "Add new LP token to whitelist",
    status: "Active",
    votes: { approve: 7, reject: 5 },
  },
];

const StakingDemo: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [staked, setStaked] = useState(0);
  const [voteState, setVoteState] = useState<{ [id: number]: "approve" | "reject" | null }>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleStake() {
    setFeedback(null);
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    setStaked((prev) => prev + Number(amount));
    setFeedback(`Successfully staked ${amount} TRO (Demo).`);
    setAmount("");
  }

  function handleVote(id: number, type: "approve" | "reject") {
    setFeedback(null);
    setError(null);
    if (voteState[id]) {
      setError("You have already voted on this proposal.");
      return;
    }
    setVoteState((prev) => ({ ...prev, [id]: type }));
    setFeedback(`You voted "${type}" on Proposal #${id} (Demo).`);
  }

  function handleReset() {
    setAmount("");
    setStaked(0);
    setVoteState({});
    setFeedback(null);
    setError(null);
  }

  return (
    <div className="demo-feature">
      <h2>🗳️ TRO Staking &amp; Governance (Demo)</h2>
      <p>
        <b>Stake your TRO or LP tokens</b> to participate in protocol governance.
        <br />
        <b>Demo Mode:</b>
      </p>
      <div className="demo-stake-box">
        <label>
          Amount to stake:
          <input
            type="number"
            min="0"
            placeholder="100"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </label>
        <button onClick={handleStake} disabled={!amount || Number(amount) <= 0}>Stake (Demo)</button>
        <div style={{ marginTop: 8, color: "#5a3be7" }}>
          <b>Staked (Demo):</b> {staked}
        </div>
      </div>
      <div className="demo-proposals">
        <h3>Active Proposals (Demo)</h3>
        <ul>
          {mockProposals.map((p) => (
            <li key={p.id}>
              <b>Proposal #{p.id}:</b> {p.title}
              <br />
              <span className="demo-votes">
                Approve: {p.votes.approve + (voteState[p.id] === "approve" ? 1 : 0)} | Reject: {p.votes.reject + (voteState[p.id] === "reject" ? 1 : 0)}
              </span>
              <br />
              <button
                onClick={() => handleVote(p.id, "approve")}
                disabled={voteState[p.id] != null}
              >
                Vote Approve
              </button>
              <button
                onClick={() => handleVote(p.id, "reject")}
                disabled={voteState[p.id] != null}
              >
                Vote Reject
              </button>
              {voteState[p.id] && (
                <span style={{ color: "#5a3be7", marginLeft: 8 }}>
                  You voted: {voteState[p.id]}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {feedback && <div style={{ color: "#2e8b57", marginTop: 10 }}>{feedback}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>}
      <button style={{ marginTop: 18, background: "#eee", color: "#5a3be7" }} onClick={handleReset}>
        Reset Demo
      </button>
      <p className="demo-note">
        <i>This is a demo mode. No real staking or voting is performed.</i>
      </p>
    </div>
  );
};

export default StakingDemo;
