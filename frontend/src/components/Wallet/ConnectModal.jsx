import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import './ConnectModal.css'

// Solana network metadata
const SOLANA_NETWORKS = {
  'solana-mainnet': {
    id: 'solana-mainnet',
    name: 'Solana',
    description: 'Solana Mainnet',
    icon: '◎',
    color: '#9945FF',
    isTestnet: false,
  },
  'solana-devnet': {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    description: 'Solana Test Network',
    icon: '◎',
    color: '#9945FF',
    isTestnet: true,
  },
}

export default function ConnectModal({ isOpen, onClose }) {
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()
  const [selectedNetwork, setSelectedNetwork] = useState(null)

  if (!isOpen) return null

  const handleDisconnect = () => {
    disconnect()
    onClose()
  }

  const handleSolanaConnect = async (networkId) => {
    setSelectedNetwork(networkId)

    // Close our modal and open the Solana wallet modal
    onClose()

    // Small delay to let our modal close first
    setTimeout(() => {
      setSolanaModalVisible(true)
    }, 150)
  }

  const solanaMainnets = Object.values(SOLANA_NETWORKS).filter(n => !n.isTestnet)
  const solanaTestnets = Object.values(SOLANA_NETWORKS).filter(n => n.isTestnet)

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        {/* XP-style title bar */}
        <div className="wallet-modal-titlebar">
          <span className="wallet-modal-titlebar-icon">💼</span>
          <span className="wallet-modal-titlebar-text">Network Connection Wizard</span>
          <button className="wallet-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="wallet-modal-body">
          {/* Wizard sidebar */}
          <div className="wallet-modal-sidebar">
            <div className="sidebar-icon">🌐</div>
            <div className="sidebar-text">
              Connect to Solana to mint, trade, and burn NFTs.
            </div>
            <div className="sidebar-decoration">🔗</div>
          </div>

          {/* Content */}
          <div className="wallet-modal-content">
            <h2 className="wallet-modal-heading">Select a Network</h2>
            <p className="wallet-modal-subheading">
              Choose the Solana network you want to connect to
            </p>

            {/* Network list */}
            <div className="network-list-container">
              {solanaMainnets.map((network) => (
                <button
                  key={network.id}
                  className={`network-item ${selectedNetwork === network.id ? 'selected' : ''}`}
                  onClick={() => handleSolanaConnect(network.id)}
                >
                  <div className="network-icon" style={{ color: network.color }}>{network.icon}</div>
                  <div className="network-info">
                    <span className="network-name">{network.name}</span>
                    <span className="network-type">{network.description}</span>
                  </div>
                  <span className="network-badge mainnet">Live</span>
                </button>
              ))}
              {solanaTestnets.map((network) => (
                <button
                  key={network.id}
                  className={`network-item ${selectedNetwork === network.id ? 'selected' : ''}`}
                  onClick={() => handleSolanaConnect(network.id)}
                >
                  <div className="network-icon" style={{ color: network.color }}>{network.icon}</div>
                  <div className="network-info">
                    <span className="network-name">{network.name}</span>
                    <span className="network-type">{network.description}</span>
                  </div>
                  <span className="network-badge testnet">Test</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="wallet-modal-footer">
          {connected && (
            <div className="wallet-status">
              <span className="status-dot connected" />
              <span className="status-text">
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              </span>
            </div>
          )}
          <div className="wallet-footer-buttons">
            {connected && (
              <button className="wallet-btn wallet-btn-danger" onClick={handleDisconnect}>
                Disconnect
              </button>
            )}
            <button className="wallet-btn wallet-btn-secondary" onClick={onClose}>
              {connected ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
