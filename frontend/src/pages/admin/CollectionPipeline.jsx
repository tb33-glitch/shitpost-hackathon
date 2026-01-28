import { useState, useCallback, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { LinkInput } from '../../components/Admin/LinkInput'
import { ExtractionQueue } from '../../components/Admin/ExtractionQueue'
import { ApprovedManager } from '../../components/Admin/ApprovedManager'
import { VideoManager } from '../../components/Admin/VideoManager'
import { ReportsManager } from '../../components/Admin/ReportsManager'
import { addToRegistry, getLocalRegistry } from '../../utils/templateRegistry'
import { reloadCustomTemplates } from '../../config/memeTemplates'
import { downloadVideo, saveVideo, getAllVideos } from '../../utils/videoStorage'
import { isVideoContent } from '../../utils/urlValidation'
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
  const [syncStatus, setSyncStatus] = useState(null)
  const [failedVideos, setFailedVideos] = useState([])
  const [isDraggingVideo, setIsDraggingVideo] = useState(false)
  const videoUploadRef = useRef(null)

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

  // Define addLog first since other hooks depend on it
  const addLog = useCallback((message, level = 'info') => {
    setExtractionLogs(prev => [{
      id: Date.now(),
      message,
      level,
      timestamp: new Date().toISOString(),
    }, ...prev].slice(0, 100)) // Keep last 100 logs
  }, [])

  // Auto-sync content to frontend storage (images to registry, videos to IndexedDB)
  const autoSyncContent = useCallback(async (mediaItems, sourceUrl) => {
    const registry = getLocalRegistry()
    const existingImageUrls = new Set(registry.templates.map(t => t.imageUrl))
    const existingVideos = await getAllVideos()
    const existingVideoUrls = new Set(existingVideos.map(v => v.mediaUrl))

    let syncedImages = 0
    let syncedVideos = 0
    const newFailedVideos = []

    for (const item of mediaItems) {
      const isVideo = isVideoContent(item)

      if (isVideo) {
        // Skip if already in video library
        if (existingVideoUrls.has(item.mediaUrl)) {
          addLog(`Video already in library: ${item.mediaUrl.slice(0, 50)}...`)
          continue
        }

        // Try to download and save video
        try {
          addLog(`Downloading video: ${item.mediaUrl.slice(0, 50)}...`)
          setSyncStatus(`Downloading video...`)
          const blob = await downloadVideo(item.mediaUrl, null, sourceUrl)

          await saveVideo({
            id: `video-${item.id}`,
            sourceUrl: sourceUrl,
            mediaUrl: item.mediaUrl,
            name: item.tags?.[0] || `Video ${Date.now()}`,
            tags: item.tags || [],
            source: 'auto-sync',
          }, blob)

          syncedVideos++
          addLog(`✓ Video synced to library`, 'success')
        } catch (e) {
          addLog(`✗ Video download failed: ${e.message}`, 'error')
          newFailedVideos.push({
            sourceUrl: sourceUrl,
            mediaUrl: item.mediaUrl,
            name: item.tags?.[0] || 'Untitled',
          })
        }
      } else {
        // Handle image - sync to template registry
        if (existingImageUrls.has(item.mediaUrl)) {
          addLog(`Image already in registry: ${item.mediaUrl.slice(0, 50)}...`)
          continue
        }

        try {
          const entry = {
            name: item.tags?.[0] || `template-${item.id}`,
            category: item.category || 'templates',
            imageCid: `admin-${item.id}`,
            imageUrl: item.mediaUrl,
            tags: item.tags || [],
            submittedBy: 'admin',
            displayName: 'Admin',
            xp: 10,
            submittedAt: new Date().toISOString(),
            cid: `admin-approved-${item.id}`,
            sourceUrl: sourceUrl,
            isAdminApproved: true,
          }

          await addToRegistry(entry)
          syncedImages++
          addLog(`✓ Image synced to templates`, 'success')
        } catch (e) {
          addLog(`✗ Image sync failed: ${e.message}`, 'error')
        }
      }
    }

    // Update failed videos list
    if (newFailedVideos.length > 0) {
      setFailedVideos(prev => [...prev, ...newFailedVideos])
    }

    // Reload templates cache
    if (syncedImages > 0) {
      await reloadCustomTemplates()
    }

    const parts = []
    if (syncedImages > 0) parts.push(`${syncedImages} image(s)`)
    if (syncedVideos > 0) parts.push(`${syncedVideos} video(s)`)
    if (newFailedVideos.length > 0) parts.push(`${newFailedVideos.length} video(s) failed`)

    if (parts.length > 0) {
      setSyncStatus(`Auto-synced: ${parts.join(', ')}`)
      setTimeout(() => setSyncStatus(null), 5000)
    }
  }, [addLog])

  // Handle manual video upload for failed downloads
  const handleManualVideoUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    let uploadedCount = 0
    for (const file of files) {
      if (!file.type.startsWith('video/')) continue

      try {
        await saveVideo({
          id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          tags: [file.name.replace(/\.[^.]+$/, '')],
          source: 'manual-upload',
        }, file)
        uploadedCount++
      } catch (err) {
        console.error('Failed to save video:', err)
      }
    }

    if (uploadedCount > 0) {
      addLog(`✓ Manually uploaded ${uploadedCount} video(s)`, 'success')
      setFailedVideos([])
      setSyncStatus(`Uploaded ${uploadedCount} video(s)!`)
      setTimeout(() => setSyncStatus(null), 3000)
    }
    e.target.value = ''
  }, [addLog])

  // Drag and drop handlers for video upload
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingVideo(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingVideo(false)
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingVideo(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'))
    if (files.length === 0) {
      setSyncStatus('No video files detected. Drop .mp4, .webm, or .mov files.')
      setTimeout(() => setSyncStatus(null), 3000)
      return
    }

    let uploadedCount = 0
    for (const file of files) {
      try {
        await saveVideo({
          id: `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          tags: [file.name.replace(/\.[^.]+$/, '')],
          source: 'drag-drop',
        }, file)
        uploadedCount++
      } catch (err) {
        console.error('Failed to save dropped video:', err)
      }
    }

    if (uploadedCount > 0) {
      addLog(`✓ Dropped ${uploadedCount} video(s)`, 'success')
      setFailedVideos([])
      setSyncStatus(`✓ Added ${uploadedCount} video(s) to library!`)
      setTimeout(() => setSyncStatus(null), 3000)
    }
  }, [addLog])

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

  const handleExtractionComplete = useCallback(async (item, extractedMedia) => {
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

    // Auto-sync to frontend storage (images → registry, videos → IndexedDB)
    await autoSyncContent(approvedMedia, item.url)

    // Switch to approved tab so user can see the new items
    setActiveTab('approved')
  }, [addLog, autoSyncContent])

  const handleExtractionError = useCallback((item, error) => {
    setExtractionQueue(prev =>
      prev.map(i => i.id === item.id ? { ...i, status: 'error', error: error.message } : i)
    )
    addLog(`Error extracting from ${item.url}: ${error.message}`, 'error')
  }, [addLog])

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

      <main
        className="admin-main"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ position: 'relative' }}
      >
        {/* Drag overlay */}
        {isDraggingVideo && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(155, 89, 182, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            borderRadius: '8px',
            border: '3px dashed white',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
          }}>
            <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎬</span>
            <span>Drop videos here!</span>
            <span style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.5rem' }}>
              Videos will be added to the library for use in MemeStudio
            </span>
          </div>
        )}

        {/* Sync status banner */}
        {syncStatus && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: syncStatus.includes('failed') ? '#fff3cd' : '#d4edda',
            color: syncStatus.includes('failed') ? '#856404' : '#155724',
            borderRadius: '6px',
            fontSize: '0.875rem',
          }}>
            🔄 {syncStatus}
          </div>
        )}

        {/* Failed videos banner with manual upload */}
        {failedVideos.length > 0 && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '6px',
          }}>
            <strong>⚠️ {failedVideos.length} video(s) couldn't be downloaded</strong>
            <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#856404' }}>
              Download manually from{' '}
              <a href="https://twitsave.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>twitsave.com</a>
              {' '}then upload:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => videoUploadRef.current?.click()}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                📤 Upload Videos
              </button>
              <button
                onClick={() => setFailedVideos([])}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <input
                ref={videoUploadRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleManualVideoUpload}
                style={{ display: 'none' }}
              />
            </div>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.8rem', color: '#856404', maxHeight: '100px', overflow: 'auto' }}>
              {failedVideos.map((v, i) => (
                <li key={i}>
                  {v.name}{' '}
                  {v.sourceUrl && (
                    <a
                      href={`https://twitsave.com/info?url=${encodeURIComponent(v.sourceUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0066cc' }}
                    >
                      [Download]
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

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
