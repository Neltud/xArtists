import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetAccountInfo, logout } from '@multiversx/sdk-dapp/hooks';

const Header: React.FC = () => {
  const { address, isLoggedIn } = useGetAccountInfo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Staking', path: '/staking' },
    { label: 'Governance', path: '/governance' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'RWA', path: '/rwa-claim' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <span className="text-xl font-bold">🎨</span>
          </div>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">xArtists</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-zinc-300 hover:text-white transition-colors text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          {isLoggedIn && address ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-zinc-400">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href="/unlock"
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              Connect Wallet
            </a>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`text-2xl transition-transform ${mobileMenuOpen ? 'rotate-45' : ''}`}>≡</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-t border-zinc-800"
          >
            <nav className="flex flex-col gap-2 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
