import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";
import StakingDemo from "./features/StakingDemo";
import NFTStakingDemo from "./features/NFTStakingDemo";
import MinterDemo from "./features/MinterDemo";
import FaucetDemo from "./features/FaucetDemo";
import EscrowDemo from "./features/EscrowDemo";
import EcosystemOverview from "./features/EcosystemOverview";
import AuthenticationMintingDemo from "./features/AuthenticationMintingDemo";
import MarketplaceEscrowDemo from "./features/MarketplaceEscrowDemo";
import TagrityDemo from "./features/TagrityDemo";
import BurnifyDemo from "./features/BurnifyDemo";
import DAOGovernanceDemo from "./features/DAOGovernanceDemo";
import DiscoveryParcoursDemo from "./features/DiscoveryParcoursDemo";
import TRODashboard from "./features/TRODashboard";
import DemoDropdownMenu from "./features/DemoDropdownMenu";

// All modules for dropdown menu
const modules = [
  { title: "Ecosystem Overview", description: "Mission, tokenomics, and all modules at a glance.", icon: "🌐", link: "/ecosystem" },
  { title: "Authentication & Minting", description: "Securely tokenize artworks with AI and robust tools.", icon: "🛡️", link: "/auth-minting" },
  { title: "Marketplace & Escrow", description: "Buy/sell art with secure escrow and universal payments.", icon: "🛒", link: "/marketplace-escrow" },
  { title: "Tagrity (Physical Art Auth)", description: "NFC-based authenticity for physical artworks.", icon: "🔖", link: "/tagrity" },
  { title: "Burnify (TRO Burn & Rewards)", description: "Burn TRO/NFTs for $BFY and EGLD rewards.", icon: "🔥", link: "/burnify" },
  { title: "NFT Staking & Rewards", description: "Stake NFTs to earn TRO rewards.", icon: "🎨", link: "/nft-staking" },
  { title: "DAO Governance", description: "Stake TRO, vote on proposals, shape the platform.", icon: "🏛️", link: "/dao" },
  { title: "Discovery Parcours (Education)", description: "Gamified art & blockchain learning with rewards.", icon: "🎲", link: "/discovery" },
  { title: "NFT Minter Demo", description: "Try our demo NFT minter. Mint unique NFTs.", icon: "🖼️", link: "/minter" },
  { title: "Faucet Demo", description: "Get test tokens and NFTs for development.", icon: "🚰", link: "/faucet" },
  { title: "Escrow Demo", description: "Demo escrow contract for secure NFT updates.", icon: "🔒", link: "/escrow" },
  { title: "TRO Dashboard", description: "Live $TRO token info and stats.", icon: "💎", link: "/tro-dashboard" },
];

// Only Home link is visible, all others are in dropdown
function Nav() {
  const location = useLocation();
  return (
    <nav className="xa-nav" aria-label="Main navigation">
      <Link to="/" className={location.pathname === "/" ? "active" : ""}>Home</Link>
      <DemoDropdownMenu />
    </nav>
  );
}

const Home: React.FC = () => (
  <main className="xa-main">
    <section className="xa-hero">
      <h1>
        Welcome to <span className="xa-highlight">xArtists</span> Platform
      </h1>
      <p>
        A decentralized platform for staking, NFT rewards, minting, and more.
        Use the <b>Menu</b> to explore all modules and demos.
      </p>
    </section>
    <section className="xa-modules">
      {modules.map((mod) => (
        <Link className="xa-module-card" to={mod.link} key={mod.title} tabIndex={0}>
          <div className="xa-module-icon">{mod.icon}</div>
          <div className="xa-module-content">
            <h2>{mod.title}</h2>
            <p>{mod.description}</p>
          </div>
        </Link>
      ))}
    </section>
  </main>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="xa-root">
        <header className="xa-header pro-header">
          <div className="pro-title">
            <span className="pro-title-main">xArtists</span>
            <span className="pro-title-sub">Decentralized Art Platform</span>
          </div>
          <Nav />
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ecosystem" element={<EcosystemOverview />} />
          <Route path="/auth-minting" element={<AuthenticationMintingDemo />} />
          <Route path="/marketplace-escrow" element={<MarketplaceEscrowDemo />} />
          <Route path="/tagrity" element={<TagrityDemo />} />
          <Route path="/burnify" element={<BurnifyDemo />} />
          <Route path="/nft-staking" element={<NFTStakingDemo />} />
          <Route path="/dao" element={<DAOGovernanceDemo />} />
          <Route path="/discovery" element={<DiscoveryParcoursDemo />} />
          <Route path="/minter" element={<MinterDemo />} />
          <Route path="/faucet" element={<FaucetDemo />} />
          <Route path="/escrow" element={<EscrowDemo />} />
          <Route path="/tro-dashboard" element={<TRODashboard />} />
        </Routes>
        <footer className="xa-footer pro-footer">
          <span>
            &copy; {new Date().getFullYear()} xArtists. All rights reserved.
          </span>
        </footer>
      </div>
    </Router>
  );
};

export default App;
