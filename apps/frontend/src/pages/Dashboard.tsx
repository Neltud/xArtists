import React from 'react';
import LIAChatWidget from '../components/LIAChatWidget';
import MoonpayButton from '../components/MoonpayButton';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-5xl font-bold mb-8">xArtists Dashboard LIA v5</h1>
      <p>Monitoring, Portfolio, AI Decisions, Live Prices...</p>
      <MoonpayButton />
      <LIAChatWidget />
      {/* Autres sections dashboard */}
    </div>
  );
}