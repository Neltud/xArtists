import React from "react";
import "./DemoFeature.css";

const EcosystemOverview: React.FC = () => (
  <div className="demo-feature">
    <h2>🌐 xArtists Ecosystem Overview</h2>
    <p>
      <b>Mission:</b> Empower artists, enable collectors, educate users, ensure sustainability, and leverage cutting-edge technology.
    </p>
    <ul>
      <li><b>Empower Artists:</b> 90-95% of sale proceeds go to creators.</li>
      <li><b>Enable Collectors:</b> Secure, flexible purchasing with universal payment options.</li>
      <li><b>Educate Users:</b> Gamified art &amp; blockchain education with rewards.</li>
      <li><b>Ensure Sustainability:</b> Growth via staking, royalties, and token burns.</li>
      <li><b>Leverage Technology:</b> AI, Tagrity, MultiversX for trust and scale.</li>
    </ul>
    <h3>Tokenomics</h3>
    <ul>
      <li><b>Total Supply:</b> 1,000,000 TRO (500,000 pre-minted, 500,000 dynamic)</li>
      <li><b>Distribution:</b>
        <ul>
          <li>Community: 50% (500,000)</li>
          <li>Artists: 20% (200,000)</li>
          <li>Treasury: 15% (150,000)</li>
          <li>Team: 10% (100,000)</li>
          <li>Partnerships: 5% (50,000)</li>
        </ul>
      </li>
      <li><b>Emission:</b> Community rewards, artist incentives, treasury ops, team vesting, partnerships.</li>
      <li><b>Burning:</b> Burnify, physical art burns, dynamic supply reduction.</li>
    </ul>
    <h3>Core Modules</h3>
    <ol>
      <li>Authentication &amp; Minting</li>
      <li>Marketplace &amp; Escrow</li>
      <li>Tagrity (Physical Art Auth)</li>
      <li>Burnify (TRO Burn &amp; Rewards)</li>
      <li>NFT Staking</li>
      <li>DAO Governance</li>
      <li>Discovery Parcours (Education)</li>
    </ol>
    <p>
      <i>This is a static overview. Explore each module for interactive demos.</i>
    </p>
  </div>
);

export default EcosystemOverview;
