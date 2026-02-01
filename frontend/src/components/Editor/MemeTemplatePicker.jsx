import { useState, useRef, useEffect } from 'react'
import { fetchTrendingTemplates } from '../../config/memeTemplates'
import { getCommunityTemplates } from '../../utils/templateRegistry'
import './MemeTemplatePicker.css'

const TABS = {
  ALL: 'all',
  HOT: 'hot',
  COMMUNITY: 'community',
}

// Proxy external images through backend to avoid CORS issues
function getProxiedImageUrl(url) {
  if (!url) return url
  // Don't proxy data URLs, blob URLs, or already-proxied URLs
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/api/')) {
    return url
  }
  // Don't proxy Supabase URLs - they have CORS enabled
  if (url.includes('.supabase.co/')) {
    return url
  }
  // Proxy other external URLs
  if (url.startsWith('http')) {
    return `/api/memes/proxy-image?url=${encodeURIComponent(url)}`
  }
  return url
}

export default function MemeTemplatePicker({ onSelectTemplate, onClose }) {
  const [activeTab, setActiveTab] = useState(TABS.ALL)
  const [searchQuery, setSearchQuery] = useState('')
  const [allTemplates, setAllTemplates] = useState([])
  const [hotTemplates, setHotTemplates] = useState([])
  const [communityTemplates, setCommunityTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef(null)

  // Load all templates on mount
  useEffect(() => {
    setIsLoading(true)

    // Fetch from all sources (Imgflip + Memegen)
    fetch('/api/memes/templates?source=all&limit=500')
      .then(res => res.json())
      .then(data => {
        const templates = data.templates.map(t => ({
          id: t.id,
          name: t.name,
          image: t.url,
          aspectRatio: t.width && t.height ? t.width / t.height : 1,
          boxCount: t.boxCount || 2,
          popularity: t.captions || 0,
          source: t.source,
          textZones: generateTextZones(t.boxCount || 2),
        }))
        setAllTemplates(templates)
        // Hot = random 10 from top 50 Imgflip templates
        const top50 = templates.filter(t => t.source === 'imgflip').slice(0, 50)
        const shuffled = top50.sort(() => Math.random() - 0.5)
        setHotTemplates(shuffled.slice(0, 10))
        setIsLoading(false)
      })
      .catch(() => {
        // Fallback to just Imgflip
        fetchTrendingTemplates(100).then(templates => {
          setAllTemplates(templates)
          setHotTemplates(templates)
          setIsLoading(false)
        })
      })

    // Load community templates
    getCommunityTemplates().then(templates => {
      console.log('[MemeTemplatePicker] Loaded community templates:', templates.length, templates)
      setCommunityTemplates(templates)
    })

    // Listen for localStorage changes (from admin panel in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'shitpost-template-registry') {
        getCommunityTemplates().then(setCommunityTemplates)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Reload community templates when switching to Community tab
  useEffect(() => {
    if (activeTab === TABS.COMMUNITY) {
      getCommunityTemplates().then(setCommunityTemplates)
    }
  }, [activeTab])

  // Generate text zones based on box count
  function generateTextZones(boxCount) {
    if (boxCount === 1) {
      return [{ id: 'text1', x: 50, y: 85, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' }]
    }
    if (boxCount === 2) {
      return [
        { id: 'top', x: 50, y: 10, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
        { id: 'bottom', x: 50, y: 90, width: 90, height: 20, defaultText: '', fontSize: 24, align: 'center' },
      ]
    }
    // 3+ boxes
    const zones = []
    for (let i = 0; i < boxCount; i++) {
      zones.push({
        id: `text${i + 1}`,
        x: 50,
        y: 10 + (80 / boxCount) * i + (80 / boxCount) / 2,
        width: 90,
        height: 80 / boxCount - 5,
        defaultText: '',
        fontSize: 18,
        align: 'center',
      })
    }
    return zones
  }

  // Get templates for current tab
  const getCurrentTemplates = () => {
    let templates
    switch (activeTab) {
      case TABS.HOT:
        templates = hotTemplates
        break
      case TABS.COMMUNITY:
        templates = communityTemplates
        break
      case TABS.ALL:
      default:
        templates = allTemplates
    }

    // Filter by search if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return templates
  }

  const displayTemplates = getCurrentTemplates()

  const handleTemplateClick = (template) => {
    // Proxy the image URL to avoid CORS issues when exporting
    const proxiedTemplate = {
      ...template,
      image: getProxiedImageUrl(template.image),
    }
    onSelectTemplate(proxiedTemplate)
    onClose()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const customTemplate = {
        id: 'custom-' + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        image: event.target.result,
        aspectRatio: 1,
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
    e.target.value = ''
  }

  return (
    <div className="meme-template-picker">
      <div className="picker-header">
        <span>Choose a Meme Template</span>
        <button className="picker-close" onClick={onClose}>X</button>
      </div>

      {/* Search Bar */}
      <div className="picker-search">
        <input
          type="text"
          placeholder="Search memes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="picker-search-input"
          autoFocus
        />
        {searchQuery && (
          <button
            className="picker-search-clear"
            onClick={() => setSearchQuery('')}
          >
            X
          </button>
        )}
        <button
          className="picker-upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload
        </button>
      </div>

      {/* Tabs */}
      <div className="picker-tabs">
        <button
          className={`picker-tab ${activeTab === TABS.ALL ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.ALL)}
        >
          All ({allTemplates.length})
        </button>
        <button
          className={`picker-tab ${activeTab === TABS.HOT ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.HOT)}
        >
          Hot
        </button>
        <button
          className={`picker-tab ${activeTab === TABS.COMMUNITY ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.COMMUNITY)}
        >
          Community ({communityTemplates.length})
        </button>
        <button
          className="picker-tab"
          style={{ background: '#f39c12', color: 'white' }}
          onClick={() => {
            const raw = localStorage.getItem('shitpost-template-registry')
            const registry = raw ? JSON.parse(raw) : null
            console.log('[DEBUG] Raw localStorage:', raw)
            console.log('[DEBUG] Parsed registry:', registry)
            if (registry?.templates) {
              registry.templates.forEach((t, i) => {
                console.log(`[DEBUG] Template ${i}:`, t.name, '| imageUrl:', t.imageUrl?.slice(0, 60) || 'undefined', '| imageCid:', t.imageCid)
              })
            }
            alert(`Registry has ${registry?.templates?.length || 0} templates. Check console for details.`)
          }}
        >
          Debug
        </button>
      </div>

      {/* Status bar */}
      <div className="picker-status">
        {isLoading ? (
          <span className="status-loading">Loading templates...</span>
        ) : searchQuery ? (
          <span>{displayTemplates.length} results for "{searchQuery}"</span>
        ) : activeTab === TABS.ALL ? (
          <span>All templates from Imgflip + Memegen</span>
        ) : activeTab === TABS.HOT ? (
          <span>Top trending memes</span>
        ) : (
          <span>Community submitted templates</span>
        )}
      </div>

      {/* Template Grid - Larger with more items */}
      {displayTemplates.length > 0 ? (
        <div className="picker-grid">
          {displayTemplates.map((template, index) => (
            <div
              key={`${template.id}-${index}`}
              className="picker-template-card"
              onClick={() => handleTemplateClick(template)}
            >
              <div className="template-preview">
                {template.isVideo ? (
                  <>
                    <video
                      src={template.image}
                      muted
                      preload="metadata"
                      onMouseEnter={(e) => e.target.play().catch(() => {})}
                      onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0 }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling?.nextSibling) {
                          e.target.nextSibling.nextSibling.style.display = 'flex'
                        }
                      }}
                    />
                    <div className="video-play-indicator">▶</div>
                  </>
                ) : (
                  <img
                    src={template.image}
                    alt={template.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex'
                      }
                    }}
                  />
                )}
                <div className="template-preview-fallback" style={{ display: 'none' }}>
                  {template.name.charAt(0)}
                </div>
              </div>
              <div className="template-name">{template.name}</div>
            </div>
          ))}
        </div>
      ) : !isLoading && (
        <div className="picker-empty">
          {searchQuery ? (
            `No memes found for "${searchQuery}". Try a different search term.`
          ) : activeTab === TABS.COMMUNITY ? (
            <div className="empty-community">
              <div className="empty-icon">+</div>
              <p>No community templates yet!</p>
              <p className="empty-hint">Use the Submit button in Meme Studio to add yours.</p>
            </div>
          ) : (
            'No templates available. Try uploading your own!'
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}
