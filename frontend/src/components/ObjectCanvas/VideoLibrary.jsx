import { useState, useEffect, useCallback } from 'react'
import { getAllVideos, deleteVideo, createVideoURL, getLibraryStats } from '../../utils/videoStorage'
import './VideoLibrary.css'

export default function VideoLibrary({ onSelectVideo, onClose }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [previewUrls, setPreviewUrls] = useState({})

  // Load videos on mount
  useEffect(() => {
    loadVideos()
    return () => {
      // Cleanup preview URLs
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const loadVideos = async () => {
    setLoading(true)
    console.log('[VideoLibrary] Loading videos from IndexedDB...')
    try {
      const [videoList, libraryStats] = await Promise.all([
        getAllVideos(),
        getLibraryStats(),
      ])
      console.log('[VideoLibrary] Loaded videos:', videoList.length, 'Stats:', libraryStats)
      videoList.forEach((v, i) => console.log(`[VideoLibrary] Video ${i}:`, v.id, v.name, v.size, 'bytes'))
      setVideos(videoList)
      setStats(libraryStats)

      // Create preview URLs for each video
      const urls = {}
      videoList.forEach(video => {
        if (video.blob) {
          urls[video.id] = URL.createObjectURL(video.blob)
        }
      })
      setPreviewUrls(urls)
    } catch (e) {
      console.error('Failed to load videos:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectVideo = useCallback((video) => {
    // Create a fresh URL for the video
    const url = createVideoURL(video)
    if (url) {
      onSelectVideo(url, video)
      onClose()
    }
  }, [onSelectVideo, onClose])

  const handleDeleteVideo = useCallback(async (e, videoId) => {
    e.stopPropagation()
    if (confirm('Delete this video from the library?')) {
      try {
        await deleteVideo(videoId)
        // Revoke the preview URL
        if (previewUrls[videoId]) {
          URL.revokeObjectURL(previewUrls[videoId])
        }
        // Reload
        loadVideos()
      } catch (e) {
        console.error('Failed to delete video:', e)
      }
    }
  }, [previewUrls])

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="video-library">
      <div className="video-library-header">
        <span>Video Library</span>
        {stats && (
          <span className="video-library-stats">
            {stats.count} videos ({stats.totalSizeMB} MB)
          </span>
        )}
        <button className="video-library-close" onClick={onClose}>×</button>
      </div>

      <div className="video-library-content">
        {loading ? (
          <div className="video-library-loading">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="video-library-empty">
            <div className="empty-icon">🎬</div>
            <p>No videos in library</p>
            <p className="empty-hint">
              Sync videos from the admin panel to add them here
            </p>
          </div>
        ) : (
          <div className="video-library-grid">
            {videos.map(video => (
              <div
                key={video.id}
                className="video-library-item"
                onClick={() => handleSelectVideo(video)}
              >
                <div className="video-thumbnail">
                  {previewUrls[video.id] ? (
                    <video
                      src={previewUrls[video.id]}
                      muted
                      preload="metadata"
                      onMouseEnter={(e) => e.target.play()}
                      onMouseLeave={(e) => {
                        e.target.pause()
                        e.target.currentTime = 0
                      }}
                    />
                  ) : (
                    <div className="video-thumbnail-placeholder">🎬</div>
                  )}
                  <button
                    className="video-delete-btn"
                    onClick={(e) => handleDeleteVideo(e, video.id)}
                    title="Delete video"
                  >
                    ×
                  </button>
                </div>
                <div className="video-info">
                  <div className="video-name" title={video.name}>
                    {video.name}
                  </div>
                  <div className="video-meta">
                    {formatSize(video.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="video-library-footer">
        <span className="video-library-hint">
          Click a video to add it to the canvas
        </span>
      </div>
    </div>
  )
}
