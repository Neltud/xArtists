import React from 'react';
import LIAChatWidget from '../components/LIAChatWidget';

const Gallery: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">xArtists Galerie</h1>
        <p className="text-zinc-400 mb-12">Découvrez les œuvres, score LIA, mint & RWA</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="group bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-violet-500 transition-all">
              <div className="aspect-square bg-gradient-to-br from-rose-500 via-purple-500 to-indigo-500 flex items-center justify-center relative">
                <div className="text-8xl opacity-75 group-hover:scale-110 transition-transform">🎨</div>
                <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full text-xs">Score {85 + i}%</div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-1">Œuvre #{i+1} - Artiste MultiversX</h3>
                <p className="text-sm text-zinc-400 mb-4">NFT + Claim Physique possible</p>
                <div className="flex gap-3">
                  <button className="flex-1 bg-violet-600 py-3 rounded-2xl text-sm">Mint NFT</button>
                  <button className="flex-1 border border-zinc-700 py-3 rounded-2xl text-sm">Détails</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LIAChatWidget />
    </div>
  );
};

export default Gallery;