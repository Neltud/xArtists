import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MainDashboard from "./features/MainDashboard";
import NFTStakingDemo from "./features/NFTStakingDemo";
import MinterDemo from "./features/MinterDemo";
import AIAgent from "./features/AIAgent";
// ... other imports if needed

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/staking" element={<NFTStakingDemo />} />
        <Route path="/minter" element={<MinterDemo />} />
        <Route path="/ai-agent" element={<AIAgent />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
};

export default App;
