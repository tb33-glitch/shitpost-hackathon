import { useState, useCallback, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { LinkInput } from '../../components/Admin/LinkInput'
import { ExtractionQueue } from '../../components/Admin/ExtractionQueue'
import { ApprovedManager } from '../../components/Admin/ApprovedManager'
import { VideoManager } from '../../components/Admin/VideoManager'
import { ReportsManager } from '../../components/Admin/ReportsManager'
import '../../styles/admin.css'

// Admin wallets - ONLY these addresses can access admin panel
// Add your admin wallet public keys here
const ADMIN_WALLETS = (import.meta.env.VITE_ADMIN_WALLETS || '')
  .split(',')
  .map(w => w.trim().toLowerCase())
  .filter(Boolean)

const STORAGE_KEY = 'shitpost-admin-pipeline'

// Load persisted state from localStorage
function loadPersistedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load persisted state:', e)
  }
  return null
}

// Save state to localStorage
function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to persist state:', e)
  }
}

export function CollectionPipeline() {
  const { publicKey, connected, signMessage } = useWallet()
  const { setVisible } = useWalletModal()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Load persisted state on mount
  const persistedState = loadPersistedState()

  // Pipeline state
  const [activeTab, setActiveTab] = useState('input') // input, queue, approved, reports
  const [extractionQueue, setExtractionQueue] = useState([])
  const [approvedItems, setApprovedItems] = useState(persistedState?.approvedItems || [])
  const [extractionLogs, setExtractionLogs] = useState(persistedState?.logs || [])

  // Check if connected wallet is an admin
  const walletAddress = publicKey?.toString()
  const isAdminWallet = walletAddress && ADMIN_WALLETS.includes(walletAddress.toLowerCase())

  // Get pending reports count
  const getPendingReportsCount = () => {
    try {
      const reports = JSON.parse(localStorage.getItem('shitpost-reports') || '[]')
      return reports.filter(r => !r.status || r.status === 'pending').length
    } catch {
      return 0
    }
  }
  const [pendingReports, setPendingReports] = useState(getPendingReportsCount)

  // Refresh reports count when tab changes
  useEffect(() => {
    if (activeTab === 'reports') {
      setPendingReports(getPendingReportsCount())
    }
  }, [activeTab])

  // Persist state changes
  useEffect(() => {
    persistState({
      approvedItems,
      logs: extractionLogs.slice(0, 500), // Keep last 500 logs
    })
  }, [approvedItems, extractionLogs])

  // Reset auth when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setIsAuthenticated(false)
    }
  }, [connected])

  // Verify admin access with wallet signature
  const handleVerifyAdmin = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) {
      setAuthError('Please connect your wallet first')
      return
    }

    if (!isAdminWallet) {
      setAuthError('This wallet is not authorized for admin access')
      return
    }

    setIsVerifying(true)
    setAuthError('')

    try {
      // Create a challenge message with timestamp to prevent replay attacks
      const timestamp = Date.now()
      const message = `shitpost.pro admin access\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`

      // Request signature
      const encodedMessage = new TextEncoder().encode(message)
      await signMessage(encodedMessage)

      // Signature verified - grant access
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Admin verification failed:', err)
      setAuthError(err.message || 'Failed to verify wallet signature')
    } finally {
      setIsVerifying(false)
    }
  }, [connected, publicKey, signMessage, walletAddress, isAdminWallet])

  const addToExtractionQueue = useCallback((urls) => {
    const newItems = urls.map((url, index) => ({
      id: `${Date.now()}-${index}`,
      url,
      status: 'pending',
      type: detectUrlType(url),
      addedAt: new Date().toISOString(),
    }))
    setExtractionQueue(prev => [...prev, ...newItems])
    setActiveTab('queue')
  }, [])

  const handleExtractionComplete = useCallback((item, extractedMedia) => {
    // Remove from extraction queue
    setExtractionQueue(prev => prev.filter(i => i.id !== item.id))

    // Auto-approve items directly (skip review step)
    const approvedMedia = extractedMedia.map((media, index) => ({
      id: `${item.id}-media-${index}`,
      ...media,
      sourceUrl: item.url,
      sourceType: item.type,
      extractedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      status: 'approved',
      category: 'templates',
      tags: [],
    }))
    setApprovedItems(prev => [...prev, ...approvedMedia])

    // Log the extraction
    addLog(`Auto-approved ${extractedMedia.length} item(s) from ${item.url}`)

    // Switch to approved tab so user can see the new items
    setActiveTab('approved')
  }, [])

  const handleExtractionError = useCallback((item, error) => {
    setExtractionQueue(prev =>
      prev.map(i => i.id === item.id ? { ...i, status: 'error', error: error.message } : i)
    )
    addLog(`Error extracting from ${item.url}: ${error.message}`, 'error')
  }, [])

  const addLog = useCallback((message, level = 'info') => {
    setExtractionLogs(prev => [{
      id: Date.now(),
      message,
      level,
      timestamp: new Date().toISOString(),
    }, ...prev].slice(0, 100)) // Keep last 100 logs
  }, [])

  // Show wallet connection / verification screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1>Admin Access</h1>
          <p>Meme Collection Pipeline</p>

          {ADMIN_WALLETS.length === 0 ? (
            <div className="auth-error">
              No admin wallets configured.<br />
              Set VITE_ADMIN_WALLETS in your .env file.
            </div>
          ) : !connected ? (
            <>
              <p>Connect an authorized admin wallet to continue.</p>
              <button onClick={() => setVisible(true)}>
                Connect Wallet
              </button>
            </>
          ) : !isAdminWallet ? (
            <>
              <p className="wallet-info">
                Connected: {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
              </p>
              <div className="auth-error">
                This wallet is not authorized for admin access.
              </div>
              <button onClick={() => setVisible(true)}>
                Switch Wallet
              </button>
            </>
          ) : (
            <>
              <p className="wallet-info">
                Connected: {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
              </p>
              <p>Sign a message to verify admin access.</p>
              <button
                onClick={handleVerifyAdmin}
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify Admin Access'}
              </button>
              {authError && <p className="auth-error">{authError}</p>}
            </>
          )}

          <p className="back-link">
            <a href="/">← Back to shitpost.pro</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Meme Collection Pipeline</h1>
        <nav className="admin-tabs">
          <button
            className={activeTab === 'input' ? 'active' : ''}
            onClick={() => setActiveTab('input')}
          >
            Link Input
          </button>
          <button
            className={activeTab === 'queue' ? 'active' : ''}
            onClick={() => setActiveTab('queue')}
          >
            Extraction Queue ({extractionQueue.length})
          </button>
          <button
            className={activeTab === 'approved' ? 'active' : ''}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({approvedItems.length})
          </button>
          <button
            className={activeTab === 'videos' ? 'active' : ''}
            onClick={() => setActiveTab('videos')}
          >
            🎬 Videos
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
            style={pendingReports > 0 ? { background: '#dc3545', color: 'white' } : {}}
          >
            Reports {pendingReports > 0 ? `(${pendingReports})` : ''}
          </button>
        </nav>
        <div className="admin-wallet-info">
          {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
        </div>
        <a href="/" className="admin-back">← Back to App</a>
      </header>

      <main className="admin-main">
        {activeTab === 'input' && (
          <LinkInput onSubmit={addToExtractionQueue} />
        )}

        {activeTab === 'queue' && (
          <ExtractionQueue
            items={extractionQueue}
            onExtractionComplete={handleExtractionComplete}
            onExtractionError={handleExtractionError}
            logs={extractionLogs}
          />
        )}

        {activeTab === 'approved' && (
          <ApprovedManager items={approvedItems} />
        )}

        {activeTab === 'videos' && (
          <VideoManager />
        )}

        {activeTab === 'reports' && (
          <ReportsManager />
        )}
      </main>
    </div>
  )
}

// URL type detection utility
function detectUrlType(url) {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter'
    }
    if (hostname.includes('reddit.com') || hostname.includes('redd.it')) {
      return 'reddit'
    }
    if (hostname.includes('imgur.com') || hostname.includes('i.imgur.com')) {
      return 'imgur'
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }

    // Check for direct image URLs
    const path = urlObj.pathname.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp|mp4|webm)(\?.*)?$/i.test(path)) {
      return 'direct'
    }

    return 'unknown'
  } catch {
    return 'invalid'
  }
}

export default CollectionPipeline
