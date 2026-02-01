import { useState, useCallback, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ReportsManager } from '../../components/Admin/ReportsManager'
import { importTemplate, getCommunityTemplatesFromAPI, deleteTemplatesBatch, updateTemplate } from '../../utils/api'
import { reloadCustomTemplates } from '../../config/memeTemplates'
import '../../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Admin wallets
const ADMIN_WALLETS = (import.meta.env.VITE_ADMIN_WALLETS || '')
  .split(',')
  .map(w => w.trim().toLowerCase())
  .filter(Boolean)

export function CollectionPipeline() {
  const { publicKey, connected, signMessage } = useWallet()
  const { setVisible } = useWalletModal()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const [activeTab, setActiveTab] = useState('scraper')
  const walletAddress = publicKey?.toString()
  const isAdminWallet = walletAddress && ADMIN_WALLETS.includes(walletAddress.toLowerCase())

  // Reports count
  const [pendingReports, setPendingReports] = useState(() => {
    try {
      const reports = JSON.parse(localStorage.getItem('shitpost-reports') || '[]')
      return reports.filter(r => !r.status || r.status === 'pending').length
    } catch { return 0 }
  })

  useEffect(() => {
    if (!connected) setIsAuthenticated(false)
  }, [connected])

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
      const timestamp = Date.now()
      const message = `shitpost.pro admin access\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`
      await signMessage(new TextEncoder().encode(message))
      setIsAuthenticated(true)
    } catch (err) {
      setAuthError(err.message || 'Failed to verify wallet signature')
    } finally {
      setIsVerifying(false)
    }
  }, [connected, publicKey, signMessage, walletAddress, isAdminWallet])

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1>Admin Panel</h1>
          <p>Template management and content moderation</p>
          {ADMIN_WALLETS.length === 0 ? (
            <div className="auth-error">No admin wallets configured. Set VITE_ADMIN_WALLETS in .env</div>
          ) : !connected ? (
            <>
              <p>Connect an authorized admin wallet to continue.</p>
              <button onClick={() => setVisible(true)}>Connect Wallet</button>
            </>
          ) : !isAdminWallet ? (
            <>
              <p className="wallet-info">Connected: {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}</p>
              <div className="auth-error">This wallet is not authorized for admin access.</div>
              <button onClick={() => setVisible(true)}>Switch Wallet</button>
            </>
          ) : (
            <>
              <p className="wallet-info">Connected: {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}</p>
              <p>Sign a message to verify admin access.</p>
              <button onClick={handleVerifyAdmin} disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Verify Admin Access'}
              </button>
              {authError && <p className="auth-error">{authError}</p>}
            </>
          )}
          <p className="back-link"><a href="/">← Back to shitpost.pro</a></p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <nav className="admin-tabs">
          <button className={activeTab === 'scraper' ? 'active' : ''} onClick={() => setActiveTab('scraper')}>
            Scraper
          </button>
          <button className={activeTab === 'database' ? 'active' : ''} onClick={() => setActiveTab('database')}>
            Database
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => { setActiveTab('reports'); setPendingReports(0) }}
            style={pendingReports > 0 ? { background: '#dc3545', color: 'white' } : {}}
          >
            Reports {pendingReports > 0 && `(${pendingReports})`}
          </button>
        </nav>
        <div className="admin-wallet-info">{walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}</div>
        <a href="/" className="admin-back">Back to App</a>
      </header>

      <main className="admin-main">
        {activeTab === 'scraper' && <ScraperTab walletAddress={walletAddress} />}
        {activeTab === 'database' && <DatabaseTab walletAddress={walletAddress} />}
        {activeTab === 'reports' && <ReportsManager />}
      </main>
    </div>
  )
}

// ===========================================
// SCRAPER TAB - Import URLs directly to Supabase
// ===========================================
function ScraperTab({ walletAddress }) {
  const [inputValue, setInputValue] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [results, setResults] = useState([])
  const [stats, setStats] = useState({ success: 0, failed: 0 })

  const parsedUrls = inputValue
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      try { new URL(line); return true } catch { return false }
    })

  const handleImport = async () => {
    if (parsedUrls.length === 0) return

    setIsImporting(true)
    setResults([])
    setStats({ success: 0, failed: 0 })

    let success = 0
    let failed = 0

    for (const url of parsedUrls) {
      try {
        // First extract media from URL via scraper
        const extractRes = await fetch(`${API_BASE_URL}/scraper/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (!extractRes.ok) throw new Error('Failed to extract')
        const extractData = await extractRes.json()

        if (!extractData.media || extractData.media.length === 0) {
          throw new Error('No media found')
        }

        // Import each media item to Supabase
        for (const media of extractData.media) {
          if (media.mediaType === 'video') {
            setResults(prev => [...prev, { url: media.mediaUrl, status: 'skipped', message: 'Video skipped' }])
            continue
          }

          try {
            const result = await importTemplate({
              name: media.metadata?.title || `Import ${Date.now()}`,
              sourceUrl: media.mediaUrl,
              category: 'templates',
              tags: [],
              submittedBy: walletAddress || 'admin',
              displayName: 'Admin',
            })

            setResults(prev => [...prev, {
              url: media.mediaUrl,
              status: 'success',
              message: 'Imported to Supabase',
              imageUrl: result.template?.image_url
            }])
            success++
          } catch (err) {
            setResults(prev => [...prev, { url: media.mediaUrl, status: 'error', message: err.message }])
            failed++
          }
        }
      } catch (err) {
        setResults(prev => [...prev, { url, status: 'error', message: err.message }])
        failed++
      }

      setStats({ success, failed })
    }

    setIsImporting(false)
    setInputValue('')
    await reloadCustomTemplates()
  }

  return (
    <div className="scraper-tab">
      <div className="scraper-input-section">
        <h2>Import URLs to Supabase</h2>
        <p>Paste URLs (one per line) → Images are downloaded and stored permanently in Supabase</p>

        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="https://x.com/user/status/123456789
https://reddit.com/r/memes/comments/abc123
https://i.imgur.com/xyz.jpg
https://pbs.twimg.com/media/abc.jpg"
          disabled={isImporting}
          rows={6}
        />

        <div className="scraper-actions">
          <button
            onClick={handleImport}
            disabled={parsedUrls.length === 0 || isImporting}
            className="primary-btn"
          >
            {isImporting ? 'Importing...' : `Import ${parsedUrls.length} URL${parsedUrls.length !== 1 ? 's' : ''}`}
          </button>
          <button onClick={() => setInputValue('')} disabled={!inputValue || isImporting} className="secondary-btn">
            Clear
          </button>
          <span className="url-count">{parsedUrls.length} valid URLs</span>
        </div>

        <div className="supported-sources">
          <span className="badge success">Reddit</span>
          <span className="badge success">Imgur</span>
          <span className="badge success">Direct URLs</span>
          <span className="badge warning">Twitter (copy image URL)</span>
        </div>
      </div>

      {results.length > 0 && (
        <div className="import-results">
          <h3>Import Results ({stats.success} success, {stats.failed} failed)</h3>
          <div className="results-list">
            {results.map((r, i) => (
              <div key={i} className={`result-item ${r.status}`}>
                <span className="result-status">
                  {r.status === 'success' ? '✓' : r.status === 'skipped' ? '⏭' : '✗'}
                </span>
                <span className="result-url">{r.url.slice(0, 60)}...</span>
                <span className="result-message">{r.message}</span>
                {r.imageUrl && (
                  <img src={r.imageUrl} alt="" className="result-preview" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================================
// DATABASE TAB - View/manage Supabase templates
// ===========================================
function DatabaseTab({ walletAddress }) {
  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [status, setStatus] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editName, setEditName] = useState('')
  const fileInputRef = useRef(null)

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCommunityTemplatesFromAPI()
      setTemplates(data.templates || [])
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to load: ${err.message}` })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadTemplates() }, [loadTemplates])

  const filteredTemplates = templates.filter(t => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return t.name?.toLowerCase().includes(search) ||
           t.tags?.some(tag => tag.toLowerCase().includes(search))
  })

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} template(s)? This will also remove images from storage.`)) return

    setStatus({ type: 'info', message: 'Deleting...' })

    try {
      const result = await deleteTemplatesBatch(Array.from(selectedIds))
      setStatus({ type: 'success', message: `Deleted ${result.deleted} template(s)${result.failed > 0 ? `, ${result.failed} failed` : ''}` })
    } catch (err) {
      setStatus({ type: 'error', message: `Delete failed: ${err.message}` })
    }

    setSelectedIds(new Set())
    await loadTemplates()
    await reloadCustomTemplates()
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setEditName(template.name)
  }

  const handleSaveEdit = async () => {
    if (!editingTemplate || !editName.trim()) return

    setStatus({ type: 'info', message: 'Saving...' })
    try {
      await updateTemplate(editingTemplate.id, { name: editName.trim() })
      setStatus({ type: 'success', message: 'Template renamed' })
      setEditingTemplate(null)
      await loadTemplates()
      await reloadCustomTemplates()
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to rename: ${err.message}` })
    }
  }

  const handleManualUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setStatus({ type: 'info', message: `Uploading ${files.length} file(s)...` })
    let uploaded = 0

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) continue

      // Check file size limits
      const maxSize = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        setStatus({ type: 'error', message: `${file.name} too large (max ${isVideo ? '25MB' : '10MB'})` })
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file, file.name)

        // Direct upload to Supabase via templates/upload endpoint
        const name = file.name.replace(/\.[^.]+$/, '')
        const uploadRes = await fetch(
          `${API_BASE_URL}/templates/upload?name=${encodeURIComponent(name)}&submitted_by=${encodeURIComponent(walletAddress || 'admin')}&display_name=Admin`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          throw new Error(err.message || err.error || 'Upload failed')
        }

        uploaded++
        setStatus({ type: 'info', message: `Uploaded ${uploaded}/${files.length}...` })
      } catch (err) {
        console.error('Upload failed:', file.name, err)
        setStatus({ type: 'error', message: `Failed: ${file.name} - ${err.message}` })
      }
    }

    if (uploaded > 0) {
      setStatus({ type: 'success', message: `Uploaded ${uploaded} file(s)` })
    }
    e.target.value = ''
    await loadTemplates()
    await reloadCustomTemplates()
  }

  return (
    <div className="database-tab">
      <div className="database-header">
        <h2>Supabase Templates ({templates.length})</h2>
        <div className="database-actions">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={() => fileInputRef.current?.click()} className="primary-btn">
            Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleManualUpload}
            style={{ display: 'none' }}
          />
          <button onClick={loadTemplates} disabled={isLoading} className="secondary-btn">
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="danger-btn"
          >
            Delete ({selectedIds.size})
          </button>
        </div>
      </div>

      {status && (
        <div className={`status-banner ${status.type}`}>
          {status.message}
          <button onClick={() => setStatus(null)}>×</button>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <p>No templates in database</p>
          <p>Use the Scraper tab to import templates</p>
        </div>
      ) : (
        <div className="template-grid">
          {filteredTemplates.map(t => (
            <div
              key={t.id}
              className={`template-card ${selectedIds.has(t.id) ? 'selected' : ''}`}
              onClick={() => toggleSelect(t.id)}
            >
              <div className="template-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.has(t.id)}
                  onChange={() => toggleSelect(t.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                className="template-edit-btn"
                onClick={(e) => { e.stopPropagation(); handleEditTemplate(t) }}
                title="Edit name"
              >
                ✏️
              </button>
              {t.media_type === 'video' ? (
                <div className="template-video-wrapper">
                  <video src={t.image_url} muted preload="metadata" />
                  <div className="video-indicator">▶</div>
                </div>
              ) : (
                <img src={t.image_url} alt={t.name} />
              )}
              <div className="template-info">
                <div className="template-name">{t.name}</div>
                <div className="template-meta">
                  {t.source_type === 'migration' && <span className="badge curated">Curated</span>}
                  {t.source_type === 'scraper' && <span className="badge scraped">Scraped</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTemplate && (
        <div className="edit-modal-overlay" onClick={() => setEditingTemplate(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Template</h3>
            <img src={editingTemplate.image_url} alt={editingTemplate.name} className="edit-preview" />
            <label>
              Name:
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                autoFocus
              />
            </label>
            <div className="edit-modal-actions">
              <button onClick={() => setEditingTemplate(null)} className="secondary-btn">Cancel</button>
              <button onClick={handleSaveEdit} className="primary-btn" disabled={!editName.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollectionPipeline
