import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';
import Staking from './pages/Staking';
import Governance from './pages/Governance';
import Portfolio from './pages/Portfolio';
import RWAClaim from './pages/RWAClaim';

export default function App() {
  return (
    <Router basename="/xArtists">
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/staking" element={<Staking />} />
        <Route path="/governance" element={<Governance />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/rwa-claim" element={<RWAClaim />} />
      </Routes>
    </Router>
  );
}