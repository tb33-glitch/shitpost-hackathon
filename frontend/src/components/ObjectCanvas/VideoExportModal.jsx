import { useState } from 'react'
import './VideoExportModal.css'

/**
 * Modal for video export with format options and progress display
 */
export default function VideoExportModal({
  isOpen,
  onClose,
  onExport,
  isLoading,
  isExporting,
  progress,
  error,
  duration,
}) {
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('high')
  const [includeAudio, setIncludeAudio] = useState(true)

  if (!isOpen) return null

  const handleExport = () => {
    onExport({
      format,
      quality,
      fps: quality === 'high' ? 30 : quality === 'medium' ? 24 : 15,
      scale: format === 'gif' ? (quality === 'high' ? 0.75 : quality === 'medium' ? 0.5 : 0.25) : 1,
      includeAudio: format !== 'gif' && includeAudio,
    })
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="video-export-modal-overlay" onClick={onClose}>
      <div className="video-export-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Video</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {!isExporting && !isLoading && (
          <div className="modal-content">
            {/* Format selection */}
            <div className="option-group">
              <label>Format</label>
              <div className="option-buttons">
                <button
                  className={`option-btn ${format === 'mp4' ? 'active' : ''}`}
                  onClick={() => setFormat('mp4')}
                >
                  <span className="option-icon">🎬</span>
                  <span className="option-label">Video</span>
                  <span className="option-desc">WebM with audio</span>
                </button>
                <button
                  className={`option-btn ${format === 'gif' ? 'active' : ''}`}
                  onClick={() => setFormat('gif')}
                >
                  <span className="option-icon">🎞️</span>
                  <span className="option-label">GIF</span>
                  <span className="option-desc">No audio, loops</span>
                </button>
              </div>
            </div>

            {/* Audio toggle (only for video format) */}
            {format === 'mp4' && (
              <div className="option-group">
                <label>Audio</label>
                <div className="audio-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={includeAudio}
                      onChange={(e) => setIncludeAudio(e.target.checked)}
                    />
                    <span className="toggle-text">
                      {includeAudio ? '🔊 Include audio' : '🔇 No audio'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Quality selection */}
            <div className="option-group">
              <label>Quality</label>
              <div className="quality-buttons">
                <button
                  className={`quality-btn ${quality === 'high' ? 'active' : ''}`}
                  onClick={() => setQuality('high')}
                >
                  High
                </button>
                <button
                  className={`quality-btn ${quality === 'medium' ? 'active' : ''}`}
                  onClick={() => setQuality('medium')}
                >
                  Medium
                </button>
                <button
                  className={`quality-btn ${quality === 'low' ? 'active' : ''}`}
                  onClick={() => setQuality('low')}
                >
                  Low
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="export-info">
              <div className="info-row">
                <span>Duration:</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="info-row">
                <span>FPS:</span>
                <span>{quality === 'high' ? 30 : quality === 'medium' ? 24 : 15}</span>
              </div>
              {format === 'gif' && (
                <div className="info-row warning">
                  <span>Note:</span>
                  <span>GIFs are scaled down for file size</span>
                </div>
              )}
            </div>

            {error && (
              <div className="export-error">
                {error}
              </div>
            )}

            <button className="export-btn" onClick={handleExport}>
              Export {format.toUpperCase()}
            </button>
          </div>
        )}

        {(isLoading || isExporting) && (
          <div className="modal-content loading">
            <div className="progress-container">
              <div className="progress-spinner" />
              <div className="progress-text">
                {isLoading ? 'Loading video encoder...' : 'Exporting...'}
              </div>
              {isExporting && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="progress-percent">{Math.round(progress)}%</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
