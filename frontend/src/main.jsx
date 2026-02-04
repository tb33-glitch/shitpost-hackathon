import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { getSolanaNetwork } from './config/solana'
import WalletProvider from './providers/WalletProvider'
import { CoinProvider } from './contexts/CoinContext'
import { Desktop } from './components/Desktop'
import { CollectionPipeline } from './pages/admin/CollectionPipeline'

// Import styles
import './styles/desktop.css'
import './styles/outlook.css'
import '@solana/wallet-adapter-react-ui/styles.css'

// Get Solana endpoint from environment variable
// Default to mainnet public RPC (may be rate limited - recommend setting VITE_SOLANA_RPC_URL)
const solanaEndpoint = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

// Debug: Log connection info on startup
console.log('[Solana Config]', {
  rpcUrl: solanaEndpoint,
  network: import.meta.env.VITE_SOLANA_NETWORK || 'not set (defaulting to devnet)',
  feeAccount: import.meta.env.VITE_SOLANA_FEE_ACCOUNT || 'not set',
})

// Solana wallets
const solanaWallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
]

// Simple hash-based routing for admin panel
function App() {
  const [isAdmin, setIsAdmin] = React.useState(
    window.location.hash === '#admin'
  )

  React.useEffect(() => {
    const handleHashChange = () => {
      setIsAdmin(window.location.hash === '#admin')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (isAdmin) {
    return <CollectionPipeline />
  }

  return <Desktop />
}

// Wrapper component for Solana providers
function SolanaProviders({ children }) {
  const wallets = useMemo(() => solanaWallets, [])

  return (
    <ConnectionProvider endpoint={solanaEndpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SolanaProviders>
      <WalletProvider>
        <CoinProvider>
          <App />
        </CoinProvider>
      </WalletProvider>
    </SolanaProviders>
  </React.StrictMode>
)
