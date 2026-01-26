import { useState, useRef, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  MEME_TEMPLATES,
  TEMPLATE_CATEGORIES,
  CATEGORY_LABELS,
  getTemplatesByCategory,
  loadCustomTemplates,
  voteOnTemplate,
  getRecentTemplates
} from '../../config/memeTemplates'
import { getLeaderboard, getWalletXP } from '../../utils/templateRegistry'
import useXPClaim from '../../hooks/useXPClaim'
import ReportModal from '../ReportModal'
import './MemeTemplatePicker.css'

export default function MemeTemplatePicker({ onSelectTemplate, onClose }) {
  const { publicKey, connected: isConnected } = useWallet()
  const address = publicKey?.toString()
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES.RECENT)
  const [searchQuery, setSearchQuery] = useState('')
  const [customTemplates, setCustomTemplates] = useState([])
  const [recentTemplates, setRecentTemplates] = useState([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingTemplate, setReportingTemplate] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimDisplayName, setClaimDisplayName] = useState('')
  const fileInputRef = useRef(null)

  const {
    isClaiming,
    hasClaimedXP,
    myClaimedProfile,
    claimXP,
    getClaimedProfile,
  } = useXPClaim()

  const categories = Object.values(TEMPLATE_CATEGORIES)

  // Load leaderboard when that tab is selected
  useEffect(() => {
    if (activeCategory === TEMPLATE_CATEGORIES.LEADERBOARD) {
      setLeaderboard(getLeaderboard())
      if (isConnected && address) {
        setMyStats(getWalletXP(address))
      }
    }
  }, [activeCategory, address, isConnected])

  // Handle claiming XP
  const handleClaimXP = useCallback(async () => {
    const result = await claimXP(claimDisplayName || null)
    if (result) {
      setShowClaimModal(false)
      setClaimDisplayName('')
      // Refresh leaderboard
      setLeaderboard(getLeaderboard())
      setMyStats(getWalletXP(address))
    }
  }, [claimXP, claimDisplayName, address])

  // Load custom templates on mount and when category changes
  const refreshTemplates = useCallback(() => {
    loadCustomTemplates().then(templates => {
      setCustomTemplates(templates)
    })
    getRecentTemplates().then(templates => {
      setRecentTemplates(templates)
    })
  }, [])

  useEffect(() => {
    refreshTemplates()
  }, [refreshTemplates])

  // Refresh when Recent tab is selected
  useEffect(() => {
    if (activeCategory === TEMPLATE_CATEGORIES.RECENT) {
      refreshTemplates()
    }
  }, [activeCategory, refreshTemplates])

  // Handle voting
  const handleVote = useCallback((e, templateId, voteType) => {
    e.stopPropagation()
    const newVotes = voteOnTemplate(templateId, voteType)
    // Update templates in state with new vote counts
    setCustomTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, votes: newVotes } : t
    ))
    setRecentTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, votes: newVotes } : t
    ))
  }, [])

  // All templates including custom ones
  const allTemplates = [...MEME_TEMPLATES, ...customTemplates]

  // Filter templates by search or category
  const getFilteredTemplates = () => {
    if (searchQuery.trim()) {
      return allTemplates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    // For recent category, show recently added templates
    if (activeCategory === TEMPLATE_CATEGORIES.RECENT) {
      return recentTemplates
    }
    // For community category, include custom templates
    if (activeCategory === TEMPLATE_CATEGORIES.COMMUNITY) {
      return [
        ...getTemplatesByCategory(activeCategory),
        ...customTemplates.filter(t => !t.isSticker)
      ]
    }
    return getTemplatesByCategory(activeCategory)
  }

  const filteredTemplates = getFilteredTemplates()

  const handleTemplateClick = (template) => {
    if (template.isCustomUpload) {
      fileInputRef.current?.click()
      return
    }
    onSelectTemplate(template)
    onClose()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const customTemplate = {
        id: 'custom-' + Date.now(),
        name: file.name,
        category: TEMPLATE_CATEGORIES.COMMUNITY,
        image: event.target.result, // Data URL
        aspectRatio: 1, // Will be determined after loading
        textZones: [
          { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
          { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
        ],
        isCustom: true,
      }
      onSelectTemplate(customTemplate)
      onClose()
    }
    reader.readAsDataURL(file)
    e.target.value = '' // Reset input
  }

  return (
    <div className="meme-template-picker">
      <div className="picker-header">
        <span>Select Template</span>
        <button className="picker-close" onClick={onClose}>X</button>
      </div>

      {/* Search Bar */}
      <div className="picker-search">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="picker-search-input"
        />
        {searchQuery && (
          <button
            className="picker-search-clear"
            onClick={() => setSearchQuery('')}
          >
            X
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="picker-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`picker-tab ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard View */}
      {activeCategory === TEMPLATE_CATEGORIES.LEADERBOARD && (
        <div className="picker-leaderboard">
          {/* My Stats */}
          {isConnected && myStats && (
            <div className="leaderboard-my-stats">
              <div className="my-stats-header">
                <span className="my-stats-label">Your Stats</span>
                {myStats.xp > 0 && !hasClaimedXP() && (
                  <button
                    className="claim-btn"
                    onClick={() => setShowClaimModal(true)}
                    disabled={isClaiming}
                  >
                    ✍️ Claim XP
                  </button>
                )}
                {hasClaimedXP() && (
                  <span className="claimed-badge">✓ Verified</span>
                )}
              </div>
              <div className="my-stats-row">
                <span className="my-stat"><strong>{myStats.xp}</strong> XP</span>
                <span className="my-stat"><strong>{myStats.templateCount}</strong> templates</span>
                <span className="my-stat">Rank <strong>#{leaderboard.findIndex(l => l.address?.toLowerCase() === address?.toLowerCase()) + 1 || '—'}</strong></span>
              </div>
              {myClaimedProfile()?.displayName && (
                <div className="my-display-name">
                  Display name: <strong>{myClaimedProfile().displayName}</strong>
                </div>
              )}
            </div>
          )}

          {/* Claim Modal */}
          {showClaimModal && (
            <div className="claim-modal-overlay" onClick={() => setShowClaimModal(false)}>
              <div className="claim-modal" onClick={e => e.stopPropagation()}>
                <div className="claim-modal-header">
                  <span>Claim Your XP</span>
                  <button className="claim-modal-close" onClick={() => setShowClaimModal(false)}>×</button>
                </div>
                <div className="claim-modal-content">
                  <p>Sign a message with your wallet to verify ownership and claim your XP.</p>
                  <div className="claim-form">
                    <label>Display Name (optional)</label>
                    <input
                      type="text"
                      value={claimDisplayName}
                      onChange={(e) => setClaimDisplayName(e.target.value)}
                      placeholder="Enter a display name..."
                      maxLength={20}
                    />
                    <p className="claim-hint">This name will appear on the leaderboard instead of your wallet address.</p>
                  </div>
                  <div className="claim-preview">
                    <div className="claim-preview-row">
                      <span>XP to claim:</span>
                      <strong>{myStats?.xp || 0} XP</strong>
                    </div>
                    <div className="claim-preview-row">
                      <span>Templates:</span>
                      <strong>{myStats?.templateCount || 0}</strong>
                    </div>
                  </div>
                  <button
                    className="claim-submit-btn"
                    onClick={handleClaimXP}
                    disabled={isClaiming}
                  >
                    {isClaiming ? 'Signing...' : '✍️ Sign & Claim'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="leaderboard-list">
            {leaderboard.length === 0 ? (
              <div className="leaderboard-empty">
                <div className="empty-trophy">🏆</div>
                <p>No contributors yet!</p>
                <p className="empty-hint">Submit a template to claim #1</p>
              </div>
            ) : (
              leaderboard.map((entry, index) => {
                const rank = index + 1
                const isMe = isConnected && address?.toLowerCase() === entry.address?.toLowerCase()
                const claimedProfile = getClaimedProfile(entry.address)
                const displayName = claimedProfile?.displayName || entry.displayName
                return (
                  <div key={entry.address} className={`leaderboard-row ${isMe ? 'is-me' : ''}`}>
                    <div className="lb-rank">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>
                    <div className="lb-user">
                      <span className="lb-name">
                        {displayName || `${entry.address?.slice(0, 6)}...${entry.address?.slice(-4)}`}
                        {claimedProfile && <span className="lb-verified" title="Verified wallet">✓</span>}
                      </span>
                      {isMe && <span className="lb-you">YOU</span>}
                    </div>
                    <div className="lb-stats">
                      <span className="lb-xp">{entry.xp} XP</span>
                      <span className="lb-count">{entry.templateCount} 📝</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* How to earn XP */}
          <div className="leaderboard-info">
            <strong>How to earn XP:</strong> Submit templates (+10 XP each)
          </div>
        </div>
      )}

      {/* Template Grid */}
      {activeCategory !== TEMPLATE_CATEGORIES.LEADERBOARD && (
      <div className="picker-grid">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`picker-template-card ${template.isCustomUpload ? 'upload-card' : ''}`}
            onClick={() => handleTemplateClick(template)}
          >
            {template.isCustomUpload ? (
              <div className="upload-placeholder">
                <span className="upload-icon">+</span>
                <span className="upload-text">Upload Image</span>
              </div>
            ) : (
              <>
                <div className="template-preview">
                  <img
                    src={template.image}
                    alt={template.name}
                    onError={(e) => {
                      // Fallback for missing images
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="template-preview-fallback" style={{ display: 'none' }}>
                    {template.name.charAt(0)}
                  </div>
                  {/* Report button for community templates */}
                  {template.isCommunity && (
                    <button
                      className="template-report-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setReportingTemplate(template)
                        setShowReportModal(true)
                      }}
                      title="Report this template"
                    >
                      !
                    </button>
                  )}
                </div>
                <div className="template-name">
                  {template.isCommunity && <span className="community-badge">UGC</span>}
                  {template.isCustom && !template.isCommunity && <span className="custom-badge">NEW</span>}
                  {template.name}
                </div>
                {/* Voting buttons for community/recent templates */}
                {(template.isCommunity || template.isRecent) && (
                  <div className="template-votes">
                    <button
                      className={`vote-btn up ${template.votes?.userVote === 'up' ? 'active' : ''}`}
                      onClick={(e) => handleVote(e, template.id, 'up')}
                      title="Upvote"
                    >
                      +{template.votes?.up || 0}
                    </button>
                    <button
                      className={`vote-btn down ${template.votes?.userVote === 'down' ? 'active' : ''}`}
                      onClick={(e) => handleVote(e, template.id, 'down')}
                      title="Downvote"
                    >
                      -{template.votes?.down || 0}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      )}

      {filteredTemplates.length === 0 && activeCategory !== TEMPLATE_CATEGORIES.LEADERBOARD && (
        <div className="picker-empty">
          No templates found for "{searchQuery}"
        </div>
      )}

      {/* Hidden file input for custom uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false)
          setReportingTemplate(null)
        }}
        template={reportingTemplate}
      />
    </div>
  )
}
