import { useState, useCallback, useEffect, useRef } from 'react'
import { saveVideo, getAllVideos, deleteVideo, clearAllVideos, createVideoURL } from '../../utils/videoStorage'
import './VideoManager.css'

export function VideoManager() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const fileInputRef = useRef(null)

  // Load videos on mount
  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    setLoading(true)
    try {
      const videoList = await getAllVideos()
      setVideos(videoList)
    } catch (e) {
      console.error('Failed to load videos:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleFiles = useCallback(async (files) => {
    const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/'))

    if (videoFiles.length === 0) {
      setUploadStatus('No video files found. Please drop .mp4, .webm, or .mov files.')
      return
    }

    setUploadStatus(`Uploading ${videoFiles.length} video(s)...`)
    let uploaded = 0

    for (const file of videoFiles) {
      try {
        await saveVideo({
          id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          tags: [file.name.replace(/\.[^.]+$/, '')],
          source: 'drag-drop',
        }, file)
        uploaded++
      } catch (e) {
        console.error('Failed to save video:', e)
      }
    }

    setUploadStatus(`✓ Uploaded ${uploaded} video(s)!`)
    loadVideos()

    // Clear status after 3 seconds
    setTimeout(() => setUploadStatus(null), 3000)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleFileInput = useCallback((e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }, [handleFiles])

  const handleDeleteVideo = useCallback(async (videoId) => {
    if (!confirm('Delete this video?')) return
    try {
      await deleteVideo(videoId)
      loadVideos()
    } catch (e) {
      console.error('Failed to delete video:', e)
    }
  }, [])

  const handleClearAll = useCallback(async () => {
    if (!confirm('Delete ALL videos from the library?')) return
    try {
      await clearAllVideos()
      setVideos([])
      setUploadStatus('All videos cleared.')
      setTimeout(() => setUploadStatus(null), 3000)
    } catch (e) {
      console.error('Failed to clear videos:', e)
    }
  }, [])

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const totalSize = videos.reduce((sum, v) => sum + (v.size || 0), 0)

  return (
    <div className="video-manager">
      {/* Header */}
      <div className="video-manager-header">
        <h2>Video Library ({videos.length} videos, {formatSize(totalSize)})</h2>
        {videos.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="video-instructions">
        <p><strong>How to add videos:</strong></p>
        <ol>
          <li>Copy a Twitter/X video URL</li>
          <li>Go to <a href="https://twitsave.com" target="_blank" rel="noopener noreferrer">twitsave.com</a> or <a href="https://ssstwitter.com" target="_blank" rel="noopener noreferrer">ssstwitter.com</a></li>
          <li>Paste the URL and download the video</li>
          <li>Drag the downloaded video here ↓</li>
        </ol>
      </div>

      {/* Drop Zone */}
      <div
        className={`video-drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <div className="drop-zone-content">
          <span className="drop-icon">🎬</span>
          <span className="drop-text">
            {isDragging ? 'Drop videos here!' : 'Drag & drop videos here'}
          </span>
          <span className="drop-hint">or click to browse</span>
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.startsWith('✓') ? 'success' : ''}`}>
          {uploadStatus}
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="video-loading">Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="video-empty">
          <p>No videos in library yet.</p>
          <p>Drop some videos above to get started!</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={() => handleDeleteVideo(video.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Video card component with preview
function VideoCard({ video, onDelete }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (video.blob) {
      const url = createVideoURL(video)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [video])

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="video-card">
      <div className="video-preview">
        {previewUrl ? (
          <video
            ref={videoRef}
            src={previewUrl}
            muted
            playsInline
            preload="metadata"
            onMouseEnter={() => videoRef.current?.play()}
            onMouseLeave={() => {
              if (videoRef.current) {
                videoRef.current.pause()
                videoRef.current.currentTime = 0
              }
            }}
          />
        ) : (
          <div className="video-placeholder">🎬</div>
        )}
        <button className="video-delete-btn" onClick={onDelete}>×</button>
      </div>
      <div className="video-info">
        <div className="video-name" title={video.name}>{video.name}</div>
        <div className="video-meta">{formatSize(video.size)}</div>
      </div>
    </div>
  )
}

export default VideoManager
