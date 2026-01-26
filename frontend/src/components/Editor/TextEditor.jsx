import { useState, useCallback } from 'react'
import './TextEditor.css'

// Available text colors (from PRD)
const TEXT_COLORS = [
  { id: 'white', color: '#FFFFFF', label: 'White' },
  { id: 'black', color: '#000000', label: 'Black' },
  { id: 'yellow', color: '#FFFF00', label: 'Yellow' },
  { id: 'red', color: '#FF0000', label: 'Red' },
]

// Font size presets
const FONT_SIZES = [
  { value: 16, label: 'Small' },
  { value: 24, label: 'Medium' },
  { value: 32, label: 'Large' },
  { value: 48, label: 'XL' },
  { value: 64, label: 'XXL' },
]

/**
 * TextEditor - Edit text content and styling for meme zones
 */
export default function TextEditor({
  zones = [],
  selectedZoneId,
  onSelectZone,
  onUpdateText,
  onUpdateStyle,
}) {
  const selectedZone = zones.find(z => z.id === selectedZoneId)

  const handleTextChange = useCallback((e) => {
    if (!selectedZoneId) return
    onUpdateText(selectedZoneId, e.target.value)
  }, [selectedZoneId, onUpdateText])

  const handleColorChange = useCallback((color) => {
    if (!selectedZoneId) return
    onUpdateStyle(selectedZoneId, { color })
  }, [selectedZoneId, onUpdateStyle])

  const handleFontSizeChange = useCallback((e) => {
    if (!selectedZoneId) return
    onUpdateStyle(selectedZoneId, { fontSize: parseInt(e.target.value, 10) })
  }, [selectedZoneId, onUpdateStyle])

  const handleStrokeColorChange = useCallback((color) => {
    if (!selectedZoneId) return
    onUpdateStyle(selectedZoneId, { strokeColor: color })
  }, [selectedZoneId, onUpdateStyle])

  return (
    <div className="text-editor">
      <fieldset className="text-editor-section">
        <legend>Text Zones</legend>

        {/* Zone selector */}
        <div className="zone-list">
          {zones.map(zone => (
            <button
              key={zone.id}
              className={`zone-button ${selectedZoneId === zone.id ? 'selected' : ''}`}
              onClick={() => onSelectZone(zone.id)}
            >
              <span className="zone-label">{zone.id}</span>
              <span className="zone-preview">
                {zone.text ? zone.text.substring(0, 20) + (zone.text.length > 20 ? '...' : '') : '(empty)'}
              </span>
            </button>
          ))}
        </div>

        {zones.length === 0 && (
          <div className="no-zones">
            Select a template to add text
          </div>
        )}
      </fieldset>

      {/* Text input */}
      {selectedZone && (
        <fieldset className="text-editor-section">
          <legend>Edit Text: {selectedZone.id}</legend>

          <div className="text-input-wrapper">
            <textarea
              className="text-input"
              value={selectedZone.text || ''}
              onChange={handleTextChange}
              placeholder="Enter your text..."
              rows={3}
            />
          </div>

          {/* Font Size */}
          <div className="style-row">
            <label>Size:</label>
            <select
              value={selectedZone.style?.fontSize || selectedZone.fontSize || 24}
              onChange={handleFontSizeChange}
            >
              {FONT_SIZES.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label} ({size.value}px)
                </option>
              ))}
            </select>
          </div>

          {/* Text Color */}
          <div className="style-row">
            <label>Color:</label>
            <div className="color-buttons">
              {TEXT_COLORS.map(({ id, color, label }) => (
                <button
                  key={id}
                  className={`color-button ${(selectedZone.style?.color || '#FFFFFF') === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={label}
                >
                  {(selectedZone.style?.color || '#FFFFFF') === color && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Color */}
          <div className="style-row">
            <label>Outline:</label>
            <div className="color-buttons">
              {TEXT_COLORS.map(({ id, color, label }) => (
                <button
                  key={id}
                  className={`color-button ${(selectedZone.style?.strokeColor || '#000000') === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleStrokeColorChange(color)}
                  title={label}
                >
                  {(selectedZone.style?.strokeColor || '#000000') === color && '✓'}
                </button>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {/* Quick tips */}
      <div className="text-editor-tips">
        <span>Tip: Use Enter for new lines</span>
      </div>
    </div>
  )
}
