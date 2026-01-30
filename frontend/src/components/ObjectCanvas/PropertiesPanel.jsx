import { useRef, useEffect } from 'react'
import './PropertiesPanel.css'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../hooks/useObjectCanvas'

const TEXT_COLORS = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#FFFF00', label: 'Yellow' },
  { color: '#FF0000', label: 'Red' },
  { color: '#00FF00', label: 'Green' },
  { color: '#0000FF', label: 'Blue' },
]

const FONT_SIZES = [24, 36, 48, 64, 80, 96, 120]

const FONT_FAMILIES = [
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
  { value: 'Arial Black', label: 'Arial Black' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times' },
  { value: 'Courier New', label: 'Courier' },
  { value: 'Georgia', label: 'Georgia' },
]

export default function PropertiesPanel({
  selectedObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onClearDrawing,
  isDrawingMode,
  isCropMode,
  onToggleCropMode,
  hasVideo,
  videoDuration,
  onRemoveBackground,
  isRemovingBackground,
  removeBackgroundProgress,
  autoFocusTextInput,
}) {
  const textInputRef = useRef(null)

  // Auto-focus text input when triggered (e.g., double-click on text)
  // Only depend on autoFocusTextInput - we don't want to re-select when text changes
  useEffect(() => {
    if (autoFocusTextInput && textInputRef.current && selectedObject?.type === 'text') {
      textInputRef.current.focus()
      textInputRef.current.select()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocusTextInput])
  // Format seconds to MM:SS for display
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Parse time input (accepts seconds or MM:SS format)
  const parseTimeInput = (value) => {
    if (value.includes(':')) {
      const [mins, secs] = value.split(':').map(Number)
      return (mins || 0) * 60 + (secs || 0)
    }
    return parseFloat(value) || 0
  }
  // No selection - show hint
  if (!selectedObject && !isDrawingMode) {
    return (
      <div className="properties-panel">
        <div className="panel-header">Properties</div>
        <div className="panel-empty">
          <div className="empty-icon">👆</div>
          <div className="empty-text">Select an object to edit its properties</div>
        </div>
      </div>
    )
  }

  // Drawing mode active
  if (isDrawingMode) {
    return (
      <div className="properties-panel">
        <div className="panel-header">Drawing Mode</div>
        <div className="panel-content">
          <div className="panel-section">
            <div className="section-label">Drawing Tools</div>
            <p className="hint-text">Click and drag on the canvas to draw</p>
            <button className="action-btn danger" onClick={onClearDrawing}>
              🧹 Clear Drawing
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Text object selected
  if (selectedObject.type === 'text') {
    return (
      <div className="properties-panel">
        <div className="panel-header">Text Properties</div>
        <div className="panel-content">
          {/* Text Content */}
          <div className="panel-section">
            <div className="section-label">Content</div>
            <textarea
              ref={textInputRef}
              className="text-input"
              value={selectedObject.text}
              onChange={(e) => onUpdateObject(selectedObject.id, { text: e.target.value })}
              placeholder="Enter text..."
              rows={3}
            />
          </div>

          {/* Font Family */}
          <div className="panel-section">
            <div className="section-label">Font</div>
            <select
              className="font-select"
              value={FONT_FAMILIES.some(f => f.value === selectedObject.fontFamily) ? selectedObject.fontFamily : 'Impact'}
              onChange={(e) => onUpdateObject(selectedObject.id, { fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="panel-section">
            <div className="section-label">Font Size</div>
            <div className="size-buttons">
              {FONT_SIZES.map(size => (
                <button
                  key={size}
                  className={`size-btn ${selectedObject.fontSize === size ? 'active' : ''}`}
                  onClick={() => onUpdateObject(selectedObject.id, { fontSize: size })}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div className="panel-section">
            <div className="section-label">Text Color</div>
            <div className="color-buttons">
              {TEXT_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  className={`color-btn ${selectedObject.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateObject(selectedObject.id, { color })}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Stroke Color */}
          <div className="panel-section">
            <div className="section-label">Stroke Color</div>
            <div className="color-buttons">
              {TEXT_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  className={`color-btn ${selectedObject.strokeColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateObject(selectedObject.id, { strokeColor: color })}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Overlay Timing (only when video is present) */}
          {hasVideo && videoDuration > 0 && (
            <div className="panel-section">
              <div className="section-label">Timing</div>
              <div className="timing-controls">
                <div className="timing-row">
                  <label>Show from:</label>
                  <input
                    type="number"
                    className="timing-input"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={(selectedObject.showFrom ?? 0).toFixed(1)}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(videoDuration, parseFloat(e.target.value) || 0))
                      onUpdateObject(selectedObject.id, { showFrom: value })
                    }}
                  />
                  <span className="timing-unit">s</span>
                </div>
                <div className="timing-row">
                  <label>Show until:</label>
                  <input
                    type="number"
                    className="timing-input"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={(selectedObject.showUntil ?? videoDuration).toFixed(1)}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(videoDuration, parseFloat(e.target.value) || videoDuration))
                      onUpdateObject(selectedObject.id, { showUntil: value })
                    }}
                  />
                  <span className="timing-unit">s</span>
                </div>
                <div className="timing-info">
                  Duration: {formatTime((selectedObject.showUntil ?? videoDuration) - (selectedObject.showFrom ?? 0))} / {formatTime(videoDuration)}
                </div>
                <button
                  className="action-btn small full-width"
                  onClick={() => onUpdateObject(selectedObject.id, { showFrom: 0, showUntil: videoDuration })}
                >
                  Show Full Duration
                </button>
              </div>
            </div>
          )}

          {/* Z-Order */}
          <div className="panel-section">
            <div className="section-label">Layer Order</div>
            <div className="order-buttons">
              <button className="action-btn" onClick={onBringForward}>
                ⬆️ Forward
              </button>
              <button className="action-btn" onClick={onSendBackward}>
                ⬇️ Back
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="panel-section">
            <button className="action-btn full-width" onClick={onDuplicate} title="Ctrl+D">
              📋 Duplicate
            </button>
            <button className="action-btn danger full-width" onClick={onDeleteObject} style={{ marginTop: '4px' }}>
              🗑️ Delete Text
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Image or Sticker selected
  return (
    <div className="properties-panel">
      <div className="panel-header">
        {selectedObject.type === 'image' ? 'Image Properties' : 'Sticker Properties'}
      </div>
      <div className="panel-content">
        {/* Preview */}
        {selectedObject.type === 'image' && selectedObject.src && (
          <div className="panel-section">
            <div className="section-label">Preview</div>
            <div className="preview-box">
              <img src={selectedObject.src} alt="Preview" />
            </div>
          </div>
        )}

        {/* Size info */}
        <div className="panel-section">
          <div className="section-label">Size</div>
          <div className="info-row">
            <span>W: {Math.round(selectedObject.width)}</span>
            <span>H: {Math.round(selectedObject.height)}</span>
          </div>
          <div className="size-buttons" style={{ marginTop: '8px' }}>
            <button
              className="action-btn"
              onClick={() => {
                // Fit to canvas maintaining aspect ratio
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
              title="Fit to canvas while keeping aspect ratio"
            >
              📏 Fit
            </button>
            <button
              className="action-btn"
              onClick={() => onUpdateObject(selectedObject.id, {
                x: 0,
                y: 0,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
              })}
              title="Stretch to fill entire canvas"
            >
              📐 Fill
            </button>
          </div>
        </div>

        {/* Opacity */}
        {selectedObject.type === 'image' && (
          <div className="panel-section">
            <div className="section-label">Opacity</div>
            <div className="slider-row">
              <input
                type="range"
                className="opacity-slider"
                min="0"
                max="100"
                value={Math.round((selectedObject.opacity ?? 1) * 100)}
                onChange={(e) => onUpdateObject(selectedObject.id, { opacity: e.target.value / 100 })}
              />
              <span className="slider-value">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
            </div>
          </div>
        )}

        {/* Crop */}
        {selectedObject.type === 'image' && (
          <div className="panel-section">
            <div className="section-label">Crop</div>
            {isCropMode ? (
              <div className="crop-mode-active">
                <p className="crop-hint">Drag the edge handles on the image to crop</p>
                <div className="crop-actions">
                  <button
                    className="action-btn small"
                    onClick={() => onUpdateObject(selectedObject.id, { cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 })}
                  >
                    Reset
                  </button>
                  <button className="action-btn small primary" onClick={onToggleCropMode}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <button className="action-btn full-width" onClick={onToggleCropMode}>
                ✂️ Crop Image
              </button>
            )}
          </div>
        )}

        {/* Remove Background */}
        {selectedObject.type === 'image' && onRemoveBackground && (
          <div className="panel-section">
            <div className="section-label">Background</div>
            {isRemovingBackground ? (
              <div className="bg-removal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${removeBackgroundProgress}%` }}
                  />
                </div>
                <span className="progress-text">
                  {removeBackgroundProgress < 10 ? 'Downloading AI model (first time may be slow)...' :
                   removeBackgroundProgress < 40 ? 'Loading AI model...' :
                   removeBackgroundProgress < 90 ? 'Removing background...' :
                   'Finishing up...'}
                </span>
              </div>
            ) : (
              <button
                className="action-btn full-width"
                onClick={() => onRemoveBackground(selectedObject)}
              >
                🪄 Remove Background
              </button>
            )}
          </div>
        )}

        {/* Rotation */}
        <div className="panel-section">
          <div className="section-label">Rotation</div>
          <div className="info-row">
            <span>{Math.round(selectedObject.rotation || 0)}°</span>
            <button
              className="action-btn small"
              onClick={() => onUpdateObject(selectedObject.id, { rotation: 0 })}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Overlay Timing for stickers (only when video is present) */}
        {hasVideo && videoDuration > 0 && selectedObject.type === 'sticker' && (
          <div className="panel-section">
            <div className="section-label">Timing</div>
            <div className="timing-controls">
              <div className="timing-row">
                <label>Show from:</label>
                <input
                  type="number"
                  className="timing-input"
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  value={(selectedObject.showFrom ?? 0).toFixed(1)}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(videoDuration, parseFloat(e.target.value) || 0))
                    onUpdateObject(selectedObject.id, { showFrom: value })
                  }}
                />
                <span className="timing-unit">s</span>
              </div>
              <div className="timing-row">
                <label>Show until:</label>
                <input
                  type="number"
                  className="timing-input"
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  value={(selectedObject.showUntil ?? videoDuration).toFixed(1)}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(videoDuration, parseFloat(e.target.value) || videoDuration))
                    onUpdateObject(selectedObject.id, { showUntil: value })
                  }}
                />
                <span className="timing-unit">s</span>
              </div>
              <div className="timing-info">
                Duration: {formatTime((selectedObject.showUntil ?? videoDuration) - (selectedObject.showFrom ?? 0))} / {formatTime(videoDuration)}
              </div>
              <button
                className="action-btn small full-width"
                onClick={() => onUpdateObject(selectedObject.id, { showFrom: 0, showUntil: videoDuration })}
              >
                Show Full Duration
              </button>
            </div>
          </div>
        )}

        {/* Z-Order */}
        <div className="panel-section">
          <div className="section-label">Layer Order</div>
          <div className="order-buttons">
            <button className="action-btn" onClick={onBringForward}>
              ⬆️ Forward
            </button>
            <button className="action-btn" onClick={onSendBackward}>
              ⬇️ Back
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="panel-section">
          <button className="action-btn full-width" onClick={onDuplicate} title="Ctrl+D">
            📋 Duplicate
          </button>
          <button className="action-btn danger full-width" onClick={onDeleteObject} style={{ marginTop: '4px' }}>
            🗑️ Delete {selectedObject.type === 'image' ? 'Image' : 'Sticker'}
          </button>
        </div>
      </div>
    </div>
  )
}
