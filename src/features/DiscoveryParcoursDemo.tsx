import React from "react";
import "./DemoFeature.css";

const DiscoveryParcoursDemo: React.FC = () => (
  <div className="demo-feature">
    <h2>🎲 Discovery Parcours (Education) Demo</h2>
    <p>
      <b>Complete interactive lessons and earn rewards.</b>
    </p>
    <div>
      <ol>
        <li>Lesson 1: What is Blockchain? <button disabled>Start (Demo)</button></li>
        <li>Lesson 2: NFT Basics <button disabled>Start (Demo)</button></li>
        <li>Lesson 3: Art &amp; Web3 <button disabled>Start (Demo)</button></li>
      </ol>
      <div style={{ margin: "12px 0" }}>
        <b>Lottery Entries:</b> <span>0 (Demo)</span>
      </div>
    </div>
    <p className="demo-note">
      <i>This is a static demo. No real lessons or rewards are performed.</i>
    </p>
  </div>
);

export default DiscoveryParcoursDemo;
