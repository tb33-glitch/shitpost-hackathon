import { useState } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../hooks/useObjectCanvas'
import './MobilePropertiesSheet.css'

const TEXT_COLORS = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#FFFF00', label: 'Yellow' },
  { color: '#FF0000', label: 'Red' },
  { color: '#00FF00', label: 'Green' },
  { color: '#0000FF', label: 'Blue' },
  { color: '#FF00FF', label: 'Magenta' },
  { color: '#00FFFF', label: 'Cyan' },
]

const FONT_SIZES = [24, 36, 48, 64, 80, 96, 120]

const FONT_FAMILIES = [
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans' },
  { value: '"Arial Black", sans-serif', label: 'Arial Black' },
  { value: 'Arial, sans-serif', label: 'Arial' },
]

export default function MobilePropertiesSheet({
  isOpen,
  onClose,
  selectedObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicate,
  onBringForward,
  onSendBackward,
  hasVideo,
  videoDuration,
  onRemoveBackground,
  isRemovingBackground,
  removeBackgroundProgress,
}) {
  const [activeTab, setActiveTab] = useState('style')

  if (!isOpen || !selectedObject) return null

  const isText = selectedObject.type === 'text'
  const isImage = selectedObject.type === 'image'
  const isSticker = selectedObject.type === 'sticker'

  return (
    <div className="mobile-sheet-overlay" onClick={onClose}>
      <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Handle bar */}
        <div className="sheet-handle" />

        {/* Header */}
        <div className="sheet-header">
          <span className="sheet-title">
            {isText ? 'Edit Text' : isImage ? 'Edit Image' : 'Edit Sticker'}
          </span>
          <button className="sheet-close" onClick={onClose}>Done</button>
        </div>

        {/* Tabs */}
        <div className="sheet-tabs">
          <button
            className={`sheet-tab ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            Style
          </button>
          <button
            className={`sheet-tab ${activeTab === 'arrange' ? 'active' : ''}`}
            onClick={() => setActiveTab('arrange')}
          >
            Arrange
          </button>
          <button
            className={`sheet-tab ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            Actions
          </button>
        </div>

        {/* Content */}
        <div className="sheet-content">
          {/* STYLE TAB */}
          {activeTab === 'style' && isText && (
            <>
              {/* Text Input */}
              <div className="sheet-section">
                <label className="sheet-label">Text</label>
                <textarea
                  className="sheet-textarea"
                  value={selectedObject.text}
                  onChange={(e) => onUpdateObject(selectedObject.id, { text: e.target.value })}
                  placeholder="Enter text..."
                  rows={2}
                />
              </div>

              {/* Font */}
              <div className="sheet-section">
                <label className="sheet-label">Font</label>
                <select
                  className="sheet-select"
                  value={selectedObject.fontFamily}
                  onChange={(e) => onUpdateObject(selectedObject.id, { fontFamily: e.target.value })}
                >
                  {FONT_FAMILIES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="sheet-section">
                <label className="sheet-label">Size</label>
                <div className="sheet-size-grid">
                  {FONT_SIZES.map(size => (
                    <button
                      key={size}
                      className={`sheet-size-btn ${selectedObject.fontSize === size ? 'active' : ''}`}
                      onClick={() => onUpdateObject(selectedObject.id, { fontSize: size })}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div className="sheet-section">
                <label className="sheet-label">Text Color</label>
                <div className="sheet-color-grid">
                  {TEXT_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      className={`sheet-color-btn ${selectedObject.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => onUpdateObject(selectedObject.id, { color })}
                      title={label}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Color */}
              <div className="sheet-section">
                <label className="sheet-label">Stroke Color</label>
                <div className="sheet-color-grid">
                  {TEXT_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      className={`sheet-color-btn ${selectedObject.strokeColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => onUpdateObject(selectedObject.id, { strokeColor: color })}
                      title={label}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'style' && isImage && (
            <>
              {/* Opacity */}
              <div className="sheet-section">
                <label className="sheet-label">Opacity: {Math.round((selectedObject.opacity ?? 1) * 100)}%</label>
                <input
                  type="range"
                  className="sheet-slider"
                  min="0"
                  max="100"
                  value={Math.round((selectedObject.opacity ?? 1) * 100)}
                  onChange={(e) => onUpdateObject(selectedObject.id, { opacity: e.target.value / 100 })}
                />
              </div>

              {/* Size Presets */}
              <div className="sheet-section">
                <label className="sheet-label">Size</label>
                <div className="sheet-btn-row">
                  <button
                    className="sheet-action-btn"
                    onClick={() => {
                      const aspectRatio = selectedObject.width / selectedObject.height
                      let newWidth, newHeight
                      if (aspectRatio > 1) {
                        newWidth = CANVAS_WIDTH
                        newHeight = CANVAS_WIDTH / aspectRatio
                      } else {
                        newHeight = CANVAS_HEIGHT
                        newWidth = CANVAS_HEIGHT * aspectRatio
                      }
                      onUpdateObject(selectedObject.id, {
                        x: (CANVAS_WIDTH - newWidth) / 2,
                        y: (CANVAS_HEIGHT - newHeight) / 2,
                        width: newWidth,
                        height: newHeight,
                      })
                    }}
                  >
                    Fit
                  </button>
                  <button
                    className="sheet-action-btn"
                    onClick={() => onUpdateObject(selectedObject.id, {
                      x: 0, y: 0,
                      width: CANVAS_WIDTH,
                      height: CANVAS_HEIGHT,
                    })}
                  >
                    Fill
                  </button>
                </div>
              </div>

              {/* Remove Background */}
              {onRemoveBackground && (
                <div className="sheet-section">
                  <label className="sheet-label">Background</label>
                  {isRemovingBackground ? (
                    <div className="sheet-progress">
                      <div className="sheet-progress-bar">
                        <div
                          className="sheet-progress-fill"
                          style={{ width: `${removeBackgroundProgress}%` }}
                        />
                      </div>
                      <span className="sheet-progress-text">
                        {removeBackgroundProgress < 30 ? 'Loading AI...' :
                         removeBackgroundProgress < 90 ? 'Removing...' : 'Finishing...'}
                      </span>
                    </div>
                  ) : (
                    <button
                      className="sheet-action-btn full"
                      onClick={() => onRemoveBackground(selectedObject)}
                    >
                      Remove Background
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'style' && isSticker && (
            <div className="sheet-section">
              <p className="sheet-hint">Drag to move, pinch corners to resize</p>
            </div>
          )}

          {/* ARRANGE TAB */}
          {activeTab === 'arrange' && (
            <>
              <div className="sheet-section">
                <label className="sheet-label">Layer Order</label>
                <div className="sheet-btn-row">
                  <button className="sheet-action-btn" onClick={onBringForward}>
                    Bring Forward
                  </button>
                  <button className="sheet-action-btn" onClick={onSendBackward}>
                    Send Back
                  </button>
                </div>
              </div>

              <div className="sheet-section">
                <label className="sheet-label">Rotation: {Math.round(selectedObject.rotation || 0)}°</label>
                <button
                  className="sheet-action-btn"
                  onClick={() => onUpdateObject(selectedObject.id, { rotation: 0 })}
                >
                  Reset Rotation
                </button>
              </div>

              {/* Video Timing */}
              {hasVideo && videoDuration > 0 && (isText || isSticker) && (
                <div className="sheet-section">
                  <label className="sheet-label">Timing</label>
                  <div className="sheet-timing-row">
                    <span>Show from:</span>
                    <input
                      type="number"
                      className="sheet-timing-input"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                      value={(selectedObject.showFrom ?? 0).toFixed(1)}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(videoDuration, parseFloat(e.target.value) || 0))
                        onUpdateObject(selectedObject.id, { showFrom: value })
                      }}
                    />
                    <span>s</span>
                  </div>
                  <div className="sheet-timing-row">
                    <span>Show until:</span>
                    <input
                      type="number"
                      className="sheet-timing-input"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                      value={(selectedObject.showUntil ?? videoDuration).toFixed(1)}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(videoDuration, parseFloat(e.target.value) || videoDuration))
                        onUpdateObject(selectedObject.id, { showUntil: value })
                      }}
                    />
                    <span>s</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ACTIONS TAB */}
          {activeTab === 'actions' && (
            <>
              <div className="sheet-section">
                <button className="sheet-action-btn full" onClick={onDuplicate}>
                  Duplicate
                </button>
              </div>
              <div className="sheet-section">
                <button className="sheet-action-btn full danger" onClick={() => {
                  onDeleteObject()
                  onClose()
                }}>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
