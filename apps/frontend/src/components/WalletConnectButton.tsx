import React from 'react'
import { useWallet } from '../context/WalletContext'

const WalletConnectButton: React.FC = () => {
  const { connected, address, shortAddress, disconnect } = useWallet()

  const handleLogin = () => {
    // In production, trigger xPortal or DeFi Wallet SDK flow here.
    window.location.href = '/unlock'
  }

  if (connected && address) {
    return (
      <button
        className="px-3 py-1.5 rounded-lg bg-[#16161f] border border-green-500/30 text-green-400 text-xs mono hover:border-red-500/40 hover:text-red-400 transition-colors"
        onClick={disconnect}
        title="Cliquer pour déconnecter"
      >
        ✅ {shortAddress}
      </button>
    )
  }

  return (
    <button className="btn-primary text-sm px-4 py-2" onClick={handleLogin}>
      🔗 Connecter Wallet
    </button>
  )
}

export default WalletConnectButton