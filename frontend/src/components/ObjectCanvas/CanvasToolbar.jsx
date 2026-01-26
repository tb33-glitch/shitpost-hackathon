import { useState } from 'react'
import { MemeTemplatePicker } from '../Editor'
import StickerPicker from '../Canvas/StickerPicker'
import './CanvasToolbar.css'

const BACKGROUND_COLORS = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#FF0000', label: 'Red' },
  { color: '#00FF00', label: 'Green' },
  { color: '#0000FF', label: 'Blue' },
  { color: '#FFFF00', label: 'Yellow' },
  { color: '#FF00FF', label: 'Magenta' },
  { color: '#00FFFF', label: 'Cyan' },
  { color: '#808080', label: 'Gray' },
]

const DRAWING_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
]

export default function CanvasToolbar({
  // Object operations
  onAddImage,
  onAddText,
  onAddSticker,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  onClearAll,
  hasSelection,

  // Background
  backgroundColor,
  onBackgroundColorChange,

  // Drawing mode
  isDrawingMode,
  onToggleDrawingMode,
  drawingColor,
  onDrawingColorChange,
  onClearDrawing,

  // History
  onUndo,
  onRedo,
  canUndo,
  canRedo,

  // Selected object for text editing
  selectedObject,
  onUpdateObject,

  // Export
  onExport,
}) {
  const [showTemplates, setShowTemplates] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)

  const handleTemplateSelect = (template) => {
    onAddImage(template)
    setShowTemplates(false)
  }

  const handleStickerSelect = (sticker) => {
    onAddSticker(sticker)
    setShowStickers(false)
  }

  return (
    <div className="canvas-toolbar">
      {/* Undo/Redo */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↩️
        </button>
        <button
          className="toolbar-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↪️
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Add Objects */}
      <div className="toolbar-group">
        <div className="toolbar-dropdown">
          <button
            className="toolbar-btn primary"
            onClick={() => {
              setShowStickers(false)
              setShowTemplates(!showTemplates)
            }}
            title="Add Template"
          >
            🖼️ Add Template
          </button>
          {showTemplates && (
            <div className="toolbar-dropdown-content">
              <MemeTemplatePicker
                onSelectTemplate={handleTemplateSelect}
                onClose={() => setShowTemplates(false)}
              />
            </div>
          )}
        </div>

        <button
          className="toolbar-btn primary"
          onClick={() => onAddText()}
          title="Add Text"
        >
          T Add Text
        </button>

        <div className="toolbar-dropdown">
          <button
            className="toolbar-btn"
            onClick={() => {
              setShowTemplates(false)
              setShowStickers(!showStickers)
            }}
            title="Add Sticker"
          >
            ⭐ Stickers
          </button>
          {showStickers && (
            <div className="toolbar-dropdown-content">
              <StickerPicker
                onSelectSticker={handleStickerSelect}
                onClose={() => setShowStickers(false)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Drawing Mode */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${isDrawingMode ? 'active' : ''}`}
          onClick={onToggleDrawingMode}
          title="Drawing Mode"
        >
          ✏️ Draw
        </button>
        {isDrawingMode && (
          <>
            <div className="color-picker-inline">
              {DRAWING_COLORS.map(color => (
                <button
                  key={color}
                  className={`color-swatch ${drawingColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onDrawingColorChange(color)}
                  title={color}
                />
              ))}
            </div>
            <button
              className="toolbar-btn small"
              onClick={onClearDrawing}
              title="Clear Drawing"
            >
              🧹 Clear Drawing
            </button>
          </>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Z-Order and Delete (only when selected) */}
      {hasSelection && (
        <>
          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={onBringForward}
              title="Bring Forward"
            >
              ⬆️ Forward
            </button>
            <button
              className="toolbar-btn"
              onClick={onSendBackward}
              title="Send Backward"
            >
              ⬇️ Back
            </button>
            <button
              className="toolbar-btn danger"
              onClick={onDeleteSelected}
              title="Delete (Del)"
            >
              🗑️ Delete
            </button>
          </div>
          <div className="toolbar-divider" />
        </>
      )}

      {/* Text editing (only when text is selected) */}
      {selectedObject?.type === 'text' && (
        <>
          <div className="toolbar-group text-edit-group">
            <input
              type="text"
              className="text-input"
              value={selectedObject.text}
              onChange={(e) => onUpdateObject(selectedObject.id, { text: e.target.value })}
              placeholder="Enter text..."
            />
            <div className="color-picker-inline">
              {['#FFFFFF', '#000000', '#FFFF00', '#FF0000'].map(color => (
                <button
                  key={color}
                  className={`color-swatch ${selectedObject.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #999' : 'none' }}
                  onClick={() => onUpdateObject(selectedObject.id, { color })}
                  title={color}
                />
              ))}
            </div>
            <select
              className="font-size-select"
              value={selectedObject.fontSize}
              onChange={(e) => onUpdateObject(selectedObject.id, { fontSize: parseInt(e.target.value) })}
            >
              <option value="24">24px</option>
              <option value="36">36px</option>
              <option value="48">48px</option>
              <option value="64">64px</option>
              <option value="80">80px</option>
              <option value="96">96px</option>
            </select>
          </div>
          <div className="toolbar-divider" />
        </>
      )}

      {/* Background */}
      <div className="toolbar-group">
        <div className="toolbar-dropdown">
          <button
            className="toolbar-btn"
            onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
            title="Background Color"
          >
            <span
              className="bg-color-preview"
              style={{ backgroundColor: backgroundColor }}
            />
            Background
          </button>
          {showBackgroundPicker && (
            <div className="background-picker">
              {BACKGROUND_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  className={`bg-color-option ${backgroundColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onBackgroundColorChange(color)
                    setShowBackgroundPicker(false)
                  }}
                  title={label}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Clear All */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn danger"
          onClick={onClearAll}
          title="Clear All"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Export */}
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <button
          className="toolbar-btn export-btn"
          onClick={onExport}
          title="Export as PNG"
        >
          💾 Export
        </button>
      </div>
    </div>
  )
}
