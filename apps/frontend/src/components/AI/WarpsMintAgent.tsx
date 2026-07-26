import React, { useState } from 'react'
import { useWallet } from '../../context/WalletContext'

/** Warps v3 AI Minting Agent — integration placeholder */
export const WarpsMintAgent: React.FC = () => {
  const { address, connected } = useWallet()
  const [prompt, setPrompt] = useState('')

  const handleMintWithAI = async () => {
    if (!connected || !address) return
    // TODO: Integrate mx-agent-kit + Warps v3
    // Example: agent.generateArt(prompt).then(mint via warp)
    alert('Warps v3 AI Minting Agent activated! (Intégration en cours)')
  }

  return (
    <div className="card">
      <h3 className="font-bold mb-3">🤖 Warps v3 AI Minting Agent</h3>
      {!connected && <p className="text-sm text-gray-400 mb-3">Connectez votre wallet pour mint.</p>}
      <input
        type="text"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Décrivez votre NFT Phygital..."
        className="w-full p-3 rounded-lg bg-[#111118] border border-[#2a2a3a] text-sm mb-3 focus:outline-none focus:border-purple-500"
      />
      <button
        onClick={handleMintWithAI}
        disabled={!connected}
        className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ✨ Mint avec AI Agent
      </button>
    </div>
  )
}
