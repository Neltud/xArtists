import React, { useEffect, useState } from 'react'
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks/account/useGetLoginInfo'
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks/account/useGetAccountInfo'
import { logout } from '@multiversx/sdk-dapp/utils'
import { LIA_WALLET, shortAddr } from '../config/contracts'
import WalletModal from './WalletModal'
import './WalletConnect.css'

interface WalletConnectProps {
  className?: string
}

const WalletConnect: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const { isLoggedIn, loginMethod } = useGetLoginInfo()
  const { address, account } = useGetAccountInfo()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const open = () => setModalOpen(true)
    window.addEventListener('mvx:open-wallet-modal', open)
    return () => window.removeEventListener('mvx:open-wallet-modal', open)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const isLia =
    isLoggedIn &&
    address &&
    address.toLowerCase() === LIA_WALLET.toLowerCase()

  if (isLoggedIn && address) {
    const egldBalance = account?.balance
      ? (parseFloat(account.balance) / 1e18).toFixed(4)
      : '0'

    return (
      <div className={`wallet-connect connected ${className}`}>
        <div className="wallet-info">
          <span className="wallet-address" title={address}>
            {shortAddr(address)}
            {isLia && <span className="lia-badge">LIA</span>}
          </span>
          <span className="wallet-balance">{egldBalance} EGLD</span>
          <span className="wallet-method">via {loginMethod || 'wallet'}</span>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="btn btn-secondary btn-sm"
          aria-label="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`btn btn-primary wallet-connect-btn ${className}`}
        aria-label="Connect MultiversX wallet"
      >
        Connect Wallet
      </button>
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}

export default WalletConnect
