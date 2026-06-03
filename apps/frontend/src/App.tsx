import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import BitcoinLayer2 from './pages/BitcoinLayer2';
import HatomPage from './pages/HatomPage';
import LPPoolsPage from './pages/LPPoolsPage';
import TipPage from './pages/TipPage';
import PaymentHistory from './pages/PaymentHistory';
import BridgeFeesDashboard from './pages/BridgeFeesDashboard';

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">xArtists</Link>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item"><Link className="nav-link" to="/">Dashboard</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/bitcoin-layer2">Bitcoin Layer 2</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/hatom">🏦 Hatom</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/lp-pools">💧 LP Pools TRO</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/tip">💝 Tip</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bitcoin-layer2" element={<BitcoinLayer2 />} />
        <Route path="/hatom" element={<HatomPage />} />
        <Route path="/lp-pools" element={<LPPoolsPage />} />
        <Route path="/tip" element={<TipPage />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/bridge-fees" element={<BridgeFeesDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;