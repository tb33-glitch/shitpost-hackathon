import { useRef, useEffect, useState } from 'react'
import './PropertiesPanel.css'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../hooks/useObjectCanvas'
import {
  createKeyframe,
  addKeyframe,
  removeKeyframe,
  updateKeyframe,
  getKeyframeAtTime,
  hasAnimation,
  EASING_FUNCTIONS,
} from '../../hooks/useKeyframeAnimation'

const TEXT_COLORS = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#FFFF00', label: 'Yellow' },
  { color: '#FF0000', label: 'Red' },
  { color: '#00FF00', label: 'Green' },
  { color: '#0000FF', label: 'Blue' },
]

// Extended color palette for shapes
const SHAPE_COLORS = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#808080', label: 'Gray' },
  { color: '#FF0000', label: 'Red' },
  { color: '#00FF00', label: 'Green' },
  { color: '#0000FF', label: 'Blue' },
  { color: '#FFFF00', label: 'Yellow' },
  { color: '#FF00FF', label: 'Magenta' },
  { color: '#00FFFF', label: 'Cyan' },
  { color: '#FFA500', label: 'Orange' },
  { color: '#800080', label: 'Purple' },
  { color: 'transparent', label: 'None' },
]

const STROKE_WIDTHS = [0, 1, 2, 3, 5, 8, 12]

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
  currentTime = 0, // Current video playback time for keyframe creation
  onRemoveBackground,
  isRemovingBackground,
  removeBackgroundProgress,
  autoFocusTextInput,
  isEyedropperMode,
  eyedropperTarget,
  onStartEyedropper,
  onCancelEyedropper,
}) {
  const textInputRef = useRef(null)
  const [fillHexInput, setFillHexInput] = useState('')
  const [strokeHexInput, setStrokeHexInput] = useState('')
  const [fillHexError, setFillHexError] = useState(false)
  const [strokeHexError, setStrokeHexError] = useState(false)

  // Validate hex color
  const isValidHex = (hex) => /^#[0-9A-Fa-f]{6}$/.test(hex)

  // Handle hex input change
  const handleHexChange = (value, type) => {
    // Add # if missing
    let hex = value.startsWith('#') ? value : '#' + value
    hex = hex.toUpperCase()

    if (type === 'fill') {
      setFillHexInput(hex)
      setFillHexError(!isValidHex(hex) && hex.length > 1)
    } else {
      setStrokeHexInput(hex)
      setStrokeHexError(!isValidHex(hex) && hex.length > 1)
    }
  }

  // Apply hex color
  const applyHexColor = (type) => {
    const hex = type === 'fill' ? fillHexInput : strokeHexInput
    if (isValidHex(hex)) {
      if (type === 'fill') {
        onUpdateObject(selectedObject.id, { fillColor: hex })
        setFillHexInput('')
        setFillHexError(false)
      } else {
        onUpdateObject(selectedObject.id, { strokeColor: hex })
        setStrokeHexInput('')
        setStrokeHexError(false)
      }
    }
  }

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
  // Eyedropper mode banner component
  const EyedropperBanner = () => {
    if (!isEyedropperMode) return null
    const targetLabels = {
      fill: 'fill color',
      stroke: 'stroke color',
      textColor: 'text color',
      textStroke: 'text stroke',
      background: 'background',
      drawing: 'drawing color',
    }
    return (
      <div className="eyedropper-banner">
        <span>◉ Click canvas to pick {targetLabels[eyedropperTarget] || 'color'}</span>
        <button onClick={onCancelEyedropper}>✕</button>
      </div>
    )
  }

  // Keyframe section component (for animation controls)
  const KeyframeSection = () => {
    if (!hasVideo || videoDuration <= 0) return null

    const keyframes = selectedObject?.keyframes || []
    const existingAtTime = getKeyframeAtTime(keyframes, currentTime, 0.05)

    const handleAddKeyframe = () => {
      const newKeyframe = createKeyframe(selectedObject, currentTime, 'linear')
      const updatedKeyframes = addKeyframe(keyframes, newKeyframe)
      onUpdateObject(selectedObject.id, { keyframes: updatedKeyframes })
    }

    const handleRemoveKeyframe = (kfId) => {
      const updatedKeyframes = removeKeyframe(keyframes, kfId)
      onUpdateObject(selectedObject.id, { keyframes: updatedKeyframes })
    }

    const handleEasingChange = (kfId, newEasing) => {
      const updatedKeyframes = updateKeyframe(keyframes, kfId, { easing: newEasing })
      onUpdateObject(selectedObject.id, { keyframes: updatedKeyframes })
    }

    const handleClearAllKeyframes = () => {
      onUpdateObject(selectedObject.id, { keyframes: [] })
    }

    return (
      <div className="panel-section">
        <div className="section-label">Animation</div>
        <div className="keyframe-controls">
          <button
            className={`action-btn full-width ${existingAtTime ? 'warning' : ''}`}
            onClick={handleAddKeyframe}
            title={existingAtTime ? 'Update keyframe at current time' : 'Add keyframe at current time'}
          >
            {existingAtTime ? '◆ Update Keyframe' : '◇ Add Keyframe'} @ {formatTime(currentTime)}
          </button>

          {keyframes.length > 0 && (
            <div className="keyframe-list">
              <div className="keyframe-list-header">
                <span>Keyframes ({keyframes.length})</span>
                <button
                  className="action-btn tiny danger"
                  onClick={handleClearAllKeyframes}
                  title="Remove all keyframes"
                >
                  Clear
                </button>
              </div>
              {keyframes.sort((a, b) => a.time - b.time).map((kf) => (
                <div key={kf.id} className="keyframe-item">
                  <span className="keyframe-time">◆ {formatTime(kf.time)}</span>
                  <select
                    className="keyframe-easing"
                    value={kf.easing || 'linear'}
                    onChange={(e) => handleEasingChange(kf.id, e.target.value)}
                    title="Easing to this keyframe"
                  >
                    {Object.keys(EASING_FUNCTIONS).map((ease) => (
                      <option key={ease} value={ease}>{ease}</option>
                    ))}
                  </select>
                  <button
                    className="keyframe-delete"
                    onClick={() => handleRemoveKeyframe(kf.id)}
                    title="Delete keyframe"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {keyframes.length === 0 && (
            <div className="keyframe-hint">
              Position object, add keyframe at different times to animate
            </div>
          )}
        </div>
      </div>
    )
  }

  // No selection - show hint
  if (!selectedObject && !isDrawingMode) {
    return (
      <div className="properties-panel">
        <div className="panel-header">Properties</div>
        <EyedropperBanner />
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
        <EyedropperBanner />
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
        <EyedropperBanner />
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
              {onStartEyedropper && (
                <button
                  className={`eyedropper-btn ${isEyedropperMode && eyedropperTarget === 'textColor' ? 'active' : ''}`}
                  onClick={() => isEyedropperMode && eyedropperTarget === 'textColor' ? onCancelEyedropper() : onStartEyedropper('textColor')}
                  title="Pick color from canvas"
                >
                  ◉
                </button>
              )}
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
              {onStartEyedropper && (
                <button
                  className={`eyedropper-btn ${isEyedropperMode && eyedropperTarget === 'textStroke' ? 'active' : ''}`}
                  onClick={() => isEyedropperMode && eyedropperTarget === 'textStroke' ? onCancelEyedropper() : onStartEyedropper('textStroke')}
                  title="Pick color from canvas"
                >
                  ◉
                </button>
              )}
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

          {/* Keyframe Animation */}
          <KeyframeSection />

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

  // Shape selected
  if (selectedObject.type === 'shape') {
    return (
      <div className="properties-panel">
        <div className="panel-header">Shape Properties</div>
        <EyedropperBanner />
        <div className="panel-content">
          {/* Shape Type */}
          <div className="panel-section">
            <div className="section-label">Shape Type</div>
            <div className="shape-type-buttons">
              <button
                className={`shape-type-btn ${selectedObject.shapeType === 'rectangle' ? 'active' : ''}`}
                onClick={() => onUpdateObject(selectedObject.id, { shapeType: 'rectangle' })}
              >
                <span className="shape-icon">▢</span> Rectangle
              </button>
              <button
                className={`shape-type-btn ${selectedObject.shapeType === 'circle' ? 'active' : ''}`}
                onClick={() => onUpdateObject(selectedObject.id, { shapeType: 'circle' })}
              >
                <span className="shape-icon">●</span> Circle
              </button>
            </div>
          </div>

          {/* Fill Color */}
          <div className="panel-section">
            <div className="section-label">Fill Color</div>
            <div className="color-buttons">
              {SHAPE_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  className={`color-btn ${selectedObject.fillColor === color ? 'active' : ''} ${color === 'transparent' ? 'transparent-btn' : ''}`}
                  style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                  onClick={() => onUpdateObject(selectedObject.id, { fillColor: color })}
                  title={label}
                />
              ))}
            </div>
            <div className="hex-input-row">
              <div className="hex-input-field">
                <span className="hex-label">Hex:</span>
                <input
                  type="text"
                  className={`hex-input ${fillHexError ? 'error' : ''}`}
                  placeholder={selectedObject.fillColor === 'transparent' ? 'None' : selectedObject.fillColor}
                  value={fillHexInput}
                  onChange={(e) => handleHexChange(e.target.value, 'fill')}
                  onKeyDown={(e) => e.key === 'Enter' && applyHexColor('fill')}
                  maxLength={7}
                />
              </div>
              <div className="hex-input-buttons">
                <button
                  className="hex-apply-btn"
                  onClick={() => applyHexColor('fill')}
                  disabled={!isValidHex(fillHexInput)}
                >
                  ✓ Apply
                </button>
                {onStartEyedropper && (
                  <button
                    className={`eyedropper-btn ${isEyedropperMode && eyedropperTarget === 'fill' ? 'active' : ''}`}
                    onClick={() => isEyedropperMode && eyedropperTarget === 'fill' ? onCancelEyedropper() : onStartEyedropper('fill')}
                    title="Pick color from canvas"
                  >
                    ◉ Pick
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stroke Color */}
          <div className="panel-section">
            <div className="section-label">Stroke Color</div>
            <div className="color-buttons">
              {SHAPE_COLORS.filter(c => c.color !== 'transparent').map(({ color, label }) => (
                <button
                  key={color}
                  className={`color-btn ${selectedObject.strokeColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateObject(selectedObject.id, { strokeColor: color })}
                  title={label}
                />
              ))}
            </div>
            <div className="hex-input-row">
              <div className="hex-input-field">
                <span className="hex-label">Hex:</span>
                <input
                  type="text"
                  className={`hex-input ${strokeHexError ? 'error' : ''}`}
                  placeholder={selectedObject.strokeColor}
                  value={strokeHexInput}
                  onChange={(e) => handleHexChange(e.target.value, 'stroke')}
                  onKeyDown={(e) => e.key === 'Enter' && applyHexColor('stroke')}
                  maxLength={7}
                />
              </div>
              <div className="hex-input-buttons">
                <button
                  className="hex-apply-btn"
                  onClick={() => applyHexColor('stroke')}
                  disabled={!isValidHex(strokeHexInput)}
                >
                  ✓ Apply
                </button>
                {onStartEyedropper && (
                  <button
                    className={`eyedropper-btn ${isEyedropperMode && eyedropperTarget === 'stroke' ? 'active' : ''}`}
                    onClick={() => isEyedropperMode && eyedropperTarget === 'stroke' ? onCancelEyedropper() : onStartEyedropper('stroke')}
                    title="Pick color from canvas"
                  >
                    ◉ Pick
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stroke Width */}
          <div className="panel-section">
            <div className="section-label">Stroke Width</div>
            <div className="size-buttons">
              {STROKE_WIDTHS.map(width => (
                <button
                  key={width}
                  className={`size-btn ${selectedObject.strokeWidth === width ? 'active' : ''}`}
                  onClick={() => onUpdateObject(selectedObject.id, { strokeWidth: width })}
                >
                  {width === 0 ? 'None' : width}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
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

          {/* Size info */}
          <div className="panel-section">
            <div className="section-label">Size</div>
            <div className="info-row">
              <span>W: {Math.round(selectedObject.width)}</span>
              <span>H: {Math.round(selectedObject.height)}</span>
            </div>
          </div>

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

          {/* Keyframe Animation */}
          <KeyframeSection />

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
              🗑️ Delete Shape
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Video selected
  if (selectedObject.type === 'video') {
    return (
      <div className="properties-panel">
        <div className="panel-header">Video Properties</div>
        <EyedropperBanner />
        <div className="panel-content">
          {/* Size info */}
          <div className="panel-section">
            <div className="section-label">Size</div>
            <div className="info-row">
              <span>W: {Math.round(selectedObject.width)}</span>
              <span>H: {Math.round(selectedObject.height)}</span>
            </div>
          </div>

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

          {/* Keyframe Animation */}
          <KeyframeSection />

          {/* Actions */}
          <div className="panel-section">
            <button className="action-btn full-width" onClick={onDuplicate} title="Ctrl+D">
              📋 Duplicate
            </button>
            <button className="action-btn danger full-width" onClick={onDeleteObject} style={{ marginTop: '4px' }}>
              🗑️ Delete Video
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
      <EyedropperBanner />
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

        {/* Keyframe Animation */}
        <KeyframeSection />

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
