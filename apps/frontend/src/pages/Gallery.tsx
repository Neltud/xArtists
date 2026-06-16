import React from 'react';
import LIAChatWidget from '../components/LIAChatWidget';

export default function Gallery() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <h1 className="text-5xl font-bold mb-8">Galerie xArtists</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Artwork cards avec scores LIA, boutons Mint/Claim */}
        <div className="bg-zinc-900 p-6 rounded-3xl">Artwork Card Example - Score IA 92/100</div>
        {/* Plus de cartes */}
      </div>
      <LIAChatWidget />
    </div>
  );
}