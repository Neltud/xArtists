// Version mise à jour avec toutes les routes et Header

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LIAChatWidget from './components/LIAChatWidget';
// ... autres imports

function App() {
  return (
    <Router basename="/xArtists">
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/rwa-claim" element={<RWAClaim />} />
        <Route path="/staking" element={<Staking />} />
        <Route path="/governance" element={<Governance />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
      <LIAChatWidget />
    </Router>
  );
}

export default App;