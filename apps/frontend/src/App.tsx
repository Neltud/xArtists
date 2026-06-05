import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';

import Dashboard from './pages/Dashboard';
import BitcoinLayer2 from './pages/BitcoinLayer2';
import HatomPage from './pages/HatomPage';
import LPPoolsPage from './pages/LPPoolsPage';
import TipPage from './pages/TipPage';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const closeMenu = () => setIsOpen(false);

  return (
    <Router>
      {/* Header */}
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
              <div className="w-9 h-9 bg-violet-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">x</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-2xl tracking-tighter">xArtists</span>
                <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-mono">LIA v5</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 text-sm">
              <Link to="/" className="px-4 py-2 rounded-2xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/bitcoin-layer2" className="px-4 py-2 rounded-2xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">Bitcoin Layer 2</Link>
              <Link to="/hatom" className="px-4 py-2 rounded-2xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">Hatom</Link>
              <Link to="/lp-pools" className="px-4 py-2 rounded-2xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">LP Pools</Link>
              <Link to="/tip" className="px-4 py-2 rounded-2xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">Tip</Link>
            </div>

            {/* Desktop Wallet Button */}
            <div className="hidden md:block">
              <Link 
                to="/bitcoin-layer2" 
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 transition-all rounded-2xl text-sm font-medium flex items-center gap-2"
              >
                Connect Wallet
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button 
              onClick={toggleMenu} 
              className="md:hidden w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-900">
            <div className="px-6 py-4 flex flex-col gap-1 text-sm">
              <Link to="/" onClick={closeMenu} className="px-4 py-3 rounded-2xl hover:bg-zinc-800 text-zinc-300">Dashboard</Link>
              <Link to="/bitcoin-layer2" onClick={closeMenu} className="px-4 py-3 rounded-2xl hover:bg-zinc-800 text-zinc-300">Bitcoin Layer 2</Link>
              <Link to="/hatom" onClick={closeMenu} className="px-4 py-3 rounded-2xl hover:bg-zinc-800 text-zinc-300">Hatom</Link>
              <Link to="/lp-pools" onClick={closeMenu} className="px-4 py-3 rounded-2xl hover:bg-zinc-800 text-zinc-300">LP Pools</Link>
              <Link to="/tip" onClick={closeMenu} className="px-4 py-3 rounded-2xl hover:bg-zinc-800 text-zinc-300">Tip</Link>
              
              <div className="pt-4 border-t border-zinc-800 mt-2">
                <Link 
                  to="/bitcoin-layer2" 
                  onClick={closeMenu}
                  className="block w-full text-center px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-2xl text-sm font-medium"
                >
                  Connect Wallet
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bitcoin-layer2" element={<BitcoinLayer2 />} />
        <Route path="/hatom" element={<HatomPage />} />
        <Route path="/lp-pools" element={<LPPoolsPage />} />
        <Route path="/tip" element={<TipPage />} />
      </Routes>
    </Router>
  );
}

export default App;