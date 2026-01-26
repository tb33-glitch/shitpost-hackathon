import { useState, useMemo } from 'react'

// Common trademarked terms to flag
const TRADEMARK_KEYWORDS = [
  'coca-cola', 'coke', 'pepsi', 'nike', 'adidas', 'apple', 'google',
  'microsoft', 'facebook', 'meta', 'twitter', 'instagram', 'tiktok',
  'disney', 'marvel', 'dc comics', 'pokemon', 'nintendo', 'sony',
  'mcdonalds', 'burger king', 'starbucks', 'amazon', 'walmart',
  'nfl', 'nba', 'mlb', 'fifa', 'olympics', 'super bowl',
]

export function ContentCard({ item, onApprove, onReject }) {
  const [category, setCategory] = useState(item.category || 'templates')
  const [tags, setTags] = useState(item.tags?.join(', ') || '')
  const [videoError, setVideoError] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Check for potential trademark concerns
  const trademarkWarning = useMemo(() => {
    const searchText = (item.sourceUrl + ' ' + (item.metadata?.title || '')).toLowerCase()
    const foundTerms = TRADEMARK_KEYWORDS.filter(term => searchText.includes(term))
    return foundTerms.length > 0 ? foundTerms : null
  }, [item])

  const handleApprove = () => {
    onApprove(item, {
      category,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
    })
  }

  const handleReject = () => {
    onReject(item)
  }

  const isVideo = item.mediaType === 'video' ||
    item.mediaUrl?.includes('.mp4') ||
    item.mediaUrl?.includes('.webm')

  const isTwitterVideo = item.mediaUrl?.includes('video.twimg.com')

  // Download video via proxy or direct
  const handleDownloadVideo = async () => {
    // Open in new tab - user can right-click save or it may auto-download
    window.open(item.mediaUrl, '_blank')
  }

  return (
    <div className="content-card">
      <div className="content-card-media">
        {isVideo ? (
          videoError || isTwitterVideo ? (
            <div className="video-fallback">
              <div className="video-fallback-icon">🎬</div>
              <div className="video-fallback-text">Video extracted</div>
              <button className="video-fallback-btn" onClick={handleDownloadVideo}>
                Open Video ↗
              </button>
              <button
                className="video-fallback-btn secondary"
                onClick={() => navigator.clipboard.writeText(item.mediaUrl)}
              >
                Copy URL
              </button>
            </div>
          ) : (
            <video
              src={item.mediaUrl}
              controls
              muted
              onError={() => setVideoError(true)}
            />
          )
        ) : imageError ? (
          <div className="video-fallback">
            <div className="video-fallback-icon">🖼️</div>
            <div className="video-fallback-text">Image couldn't load</div>
            <button className="video-fallback-btn" onClick={() => window.open(item.mediaUrl, '_blank')}>
              Open Image ↗
            </button>
          </div>
        ) : (
          <img
            src={item.mediaUrl}
            alt="Extracted media"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        <span className="content-card-media-type">
          {item.sourceType}
          {isVideo && ' (video)'}
        </span>
      </div>

      <div className="content-card-body">
        {trademarkWarning && (
          <div className="content-card-warning">
            Potential trademark: {trademarkWarning.join(', ')}
          </div>
        )}

        <div className="content-card-source">
          <span>Source:</span>
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
            {item.sourceUrl}
          </a>
        </div>

        <div className="content-card-meta">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="templates">Templates</option>
              <option value="stickers">Stickers</option>
              <option value="backgrounds">Backgrounds</option>
            </select>
          </label>

          <label>
            Tags (comma-separated)
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="funny, reaction, popular"
            />
          </label>
        </div>

        <div className="content-card-actions">
          <button className="btn-approve" onClick={handleApprove}>
            Approve
          </button>
          <button className="btn-reject" onClick={handleReject}>
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContentCard
