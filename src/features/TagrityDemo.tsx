import React from "react";
import "./DemoFeature.css";

const TagrityDemo: React.FC = () => (
  <div className="demo-feature">
    <h2>🔖 Tagrity (Physical Art Auth) Demo</h2>
    <p>
      <b>Verify physical artwork authenticity.</b> Register NFC tag and link to blockchain.
    </p>
    <div>
      <label>
        NFC Tag ID:
        <input type="text" placeholder="Scan tag..." disabled />
      </label>
      <button disabled>Register Tag (Demo)</button>
      <div style={{ margin: "12px 0" }}>
        <b>Tagrity Status:</b> <span>Not registered (Demo)</span>
      </div>
    </div>
    <p className="demo-note">
      <i>This is a static demo. No real NFC or blockchain registration is performed.</i>
    </p>
  </div>
);

export default TagrityDemo;
