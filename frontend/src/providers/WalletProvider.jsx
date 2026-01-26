import React, { createContext, useContext, useState, useMemo } from 'react'
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react'
import { getSolanaNetwork, isSolanaConfigured } from '../config/solana'

// Create context
const WalletContext = createContext(null)

export function useUnifiedWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useUnifiedWallet must be used within a WalletProvider')
  }
  return context
}

export default function WalletProvider({ children }) {
  // Solana wallet state
  const solanaWallet = useSolanaWallet()
  const { connection: solanaConnection } = useConnection()

  // Local state for network preference
  const [solanaNetwork, setSolanaNetwork] = useState('devnet')

  // Connection state
  const isConnected = solanaWallet.connected

  // Unified address
  const address = useMemo(() => {
    if (isConnected) {
      return solanaWallet.publicKey?.toString()
    }
    return null
  }, [isConnected, solanaWallet.publicKey])

  // Network info
  const chainInfo = useMemo(() => {
    if (isConnected) {
      const network = getSolanaNetwork(solanaNetwork)
      return {
        type: 'solana',
        chainId: solanaNetwork,
        name: `Solana ${network.name}`,
        icon: '◎',
        isTestnet: network.isTestnet,
        isSupported: isSolanaConfigured(),
      }
    }
    return null
  }, [isConnected, solanaNetwork])

  // Format address for display
  const displayAddress = useMemo(() => {
    if (!address) return null
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }, [address])

  // Context value
  const value = useMemo(() => ({
    // Connection state
    isConnected,
    address,
    displayAddress,
    chainInfo,

    // Solana wallet state
    solana: {
      isConnected,
      publicKey: solanaWallet.publicKey,
      network: solanaNetwork,
      connection: solanaConnection,
      wallet: solanaWallet,
    },

    // Actions
    setSolanaNetwork,

    // Helpers (kept for compatibility, always true/false for Solana-only)
    isSolana: isConnected,
    isEvm: false,
    hasBothWallets: false,
  }), [
    isConnected,
    address,
    displayAddress,
    chainInfo,
    solanaWallet,
    solanaNetwork,
    solanaConnection,
  ])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
