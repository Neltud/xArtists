import React from "react";
import "./DemoFeature.css";

const MarketplaceEscrowDemo: React.FC = () => (
  <div className="demo-feature">
    <h2>🛒 Marketplace &amp; Escrow (Demo)</h2>
    <p>
      <b>Buy and sell digital/physical art securely.</b> Escrow holds funds until delivery, then releases 90-95% to the artist.
    </p>
    <div>
      <label>
        Select Artwork:
        <select disabled>
          <option>Artwork #1 (Demo)</option>
        </select>
      </label>
      <button disabled>Buy (Demo)</button>
      <div style={{ margin: "12px 0" }}>
        <b>Escrow Status:</b> <span>Funds held (Demo)</span>
      </div>
      <button disabled>Release Funds (Demo)</button>
    </div>
    <p className="demo-note">
      <i>This is a static demo. No real transactions or escrow actions are performed.</i>
    </p>
  </div>
);

export default MarketplaceEscrowDemo;
