import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

// Solana network metadata
const SOLANA_NETWORKS = {
  'solana-mainnet': {
    id: 'solana-mainnet',
    name: 'Solana',
    icon: '◎',
    color: '#9945FF',
    isTestnet: false,
  },
  'solana-devnet': {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    icon: '◎',
    color: '#9945FF',
    isTestnet: true,
  },
}

export default function ChainSelector() {
  const { connected } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSolanaNetwork, setActiveSolanaNetwork] = useState('solana-devnet')
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render if not connected
  if (!connected) return null

  const currentNetwork = SOLANA_NETWORKS[activeSolanaNetwork]

  const handleNetworkSelect = (networkId) => {
    setActiveSolanaNetwork(networkId)
    setIsOpen(false)
  }

  return (
    <div className="chain-selector" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="chain-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '12px' }}>{currentNetwork?.icon || '◎'}</span>
        <span>{currentNetwork?.name || 'Solana'}</span>
        <span style={{ fontSize: '8px' }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="chain-selector-dropdown"
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '2px',
            backgroundColor: '#c0c0c0',
            border: '2px outset #ffffff',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            zIndex: 1000,
            minWidth: '150px',
          }}
        >
          {Object.values(SOLANA_NETWORKS).map((network) => {
            const isActive = activeSolanaNetwork === network.id

            return (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '4px 8px',
                  border: 'none',
                  backgroundColor: isActive ? '#000080' : 'transparent',
                  color: isActive ? '#ffffff' : '#000000',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#000080'
                    e.target.style.color = '#ffffff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.color = '#000000'
                  }
                }}
              >
                <span style={{ fontSize: '12px' }}>{network.icon}</span>
                <span>{network.name}</span>
                {network.isTestnet && (
                  <span style={{
                    fontSize: '8px',
                    backgroundColor: '#ffcc00',
                    color: '#000000',
                    padding: '1px 3px',
                    borderRadius: '2px',
                  }}>
                    TEST
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
