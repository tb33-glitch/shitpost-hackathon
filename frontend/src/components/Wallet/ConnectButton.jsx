import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import ChainSelector from './ChainSelector'

export default function ConnectButton() {
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()

  // Get display address
  const displayAddress = connected && publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : null

  const handleConnect = () => {
    setVisible(true)
  }

  const handleDisconnect = () => {
    disconnect()
  }

  if (connected) {
    return (
      <div className="wallet-area" data-onboarding="wallet-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ChainSelector />
        <span className="wallet-address">
          {displayAddress}
        </span>
        <button onClick={handleDisconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <div className="wallet-area" data-onboarding="wallet-button">
      <button onClick={handleConnect}>
        Connect Wallet
      </button>
    </div>
  )
}
