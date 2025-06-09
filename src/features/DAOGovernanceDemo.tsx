import React from "react";
import "./DemoFeature.css";

const DAOGovernanceDemo: React.FC = () => (
  <div className="demo-feature">
    <h2>🏛️ DAO Governance (Demo)</h2>
    <p>
      <b>Stake TRO to gain voting power and vote on proposals.</b> Quadratic voting for fair representation.
    </p>
    <div>
      <label>
        Amount to Stake:
        <input type="number" min="0" placeholder="100" disabled />
      </label>
      <button disabled>Stake TRO (Demo)</button>
      <div style={{ margin: "12px 0" }}>
        <b>Active Proposals:</b>
        <ul>
          <li>Proposal #1: Increase artist rewards <button disabled>Vote (Demo)</button></li>
        </ul>
      </div>
    </div>
    <p className="demo-note">
      <i>This is a static demo. No real staking or voting is performed.</i>
    </p>
  </div>
);

export default DAOGovernanceDemo;
