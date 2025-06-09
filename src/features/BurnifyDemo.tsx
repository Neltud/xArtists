import React from "react";
import "./DemoFeature.css";

const BurnifyDemo: React.FC = () => (
  <div className="demo-feature">
    <h2>🔥 Burnify (TRO Burn &amp; Rewards) Demo</h2>
    <p>
      <b>Burn TRO or NFTs to receive $BFY tokens and EGLD rewards.</b>
    </p>
    <div>
      <label>
        Amount to Burn:
        <input type="number" min="1" placeholder="100" disabled />
      </label>
      <button disabled>Burn TRO (Demo)</button>
      <div style={{ margin: "12px 0" }}>
        <b>Burnify Status:</b> <span>No burn performed (Demo)</span>
      </div>
    </div>
    <p className="demo-note">
      <i>This is a static demo. No real burning or rewards are performed.</i>
    </p>
  </div>
);

export default BurnifyDemo;
