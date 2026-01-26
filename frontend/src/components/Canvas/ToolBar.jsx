import { useState } from 'react'
import { TOOLS } from '../../hooks/useCanvas'
import StickerPicker from './StickerPicker'
import TemplatePicker from './TemplatePicker'
import { MemeTemplatePicker } from '../Editor'

const toolIcons = {
  [TOOLS.PENCIL]: '✏️',
  [TOOLS.ERASER]: '🧹',
  [TOOLS.FILL]: '🪣',
  [TOOLS.EYEDROPPER]: '💉',
  [TOOLS.LINE]: '📏',
  [TOOLS.RECTANGLE]: '⬜',
  [TOOLS.ELLIPSE]: '⭕',
  [TOOLS.STICKER]: '⭐',
}

const toolLabels = {
  [TOOLS.PENCIL]: 'Pencil',
  [TOOLS.ERASER]: 'Eraser',
  [TOOLS.FILL]: 'Fill',
  [TOOLS.EYEDROPPER]: 'Pick Color',
  [TOOLS.LINE]: 'Line',
  [TOOLS.RECTANGLE]: 'Rectangle',
  [TOOLS.ELLIPSE]: 'Ellipse',
  [TOOLS.STICKER]: 'Stickers',
}

export default function ToolBar({
  tool,
  onToolChange,
  filled,
  onFilledChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedSticker,
  onSelectSticker,
  onLoadTemplate,
  onLoadMeme,
}) {
  const [showStickers, setShowStickers] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showMemes, setShowMemes] = useState(false)

  // Close other pickers when opening one
  const openStickers = () => {
    setShowTemplates(false)
    setShowMemes(false)
    setShowStickers(!showStickers)
  }

  const openTemplates = () => {
    setShowStickers(false)
    setShowMemes(false)
    setShowTemplates(!showTemplates)
  }

  const openMemes = () => {
    setShowStickers(false)
    setShowTemplates(false)
    setShowMemes(!showMemes)
  }

  const handleStickerSelect = (sticker) => {
    onSelectSticker(sticker)
    onToolChange(TOOLS.STICKER)
    setShowStickers(false)
  }

  return (
    <div className="toolbar">
      {/* Undo/Redo */}
      <div className="toolbar-section toolbar-actions">
        <button
          className="tool-button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <span style={{ fontSize: '12px' }}>↩️</span>
        </button>
        <button
          className="tool-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <span style={{ fontSize: '12px' }}>↪️</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Drawing Tools */}
      <div className="toolbar-section">
        {Object.values(TOOLS).filter(t => t !== TOOLS.STICKER).map((t) => (
          <button
            key={t}
            className={`tool-button ${tool === t ? 'active' : ''}`}
            onClick={() => onToolChange(t)}
            title={toolLabels[t]}
          >
            <span style={{ fontSize: '14px' }}>{toolIcons[t]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* Stickers, Templates, Memes - labeled buttons */}
      <div className="toolbar-extras">
        <div style={{ position: 'relative' }}>
          <button
            className={`extra-button ${tool === TOOLS.STICKER ? 'active' : ''}`}
            onClick={openStickers}
            title="Stickers"
          >
            ⭐ Stickers
          </button>

          {showStickers && (
            <StickerPicker
              selectedSticker={selectedSticker}
              onSelectSticker={handleStickerSelect}
              onClose={() => setShowStickers(false)}
            />
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="extra-button"
            onClick={openTemplates}
            title="Templates"
          >
            📋 Templates
          </button>

          {showTemplates && (
            <TemplatePicker
              onSelectTemplate={(data) => {
                onLoadTemplate(data)
                setShowTemplates(false)
              }}
              onClose={() => setShowTemplates(false)}
            />
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="extra-button"
            onClick={openMemes}
            title="Meme Templates"
          >
            🔥 Memes
          </button>

          {showMemes && (
            <MemeTemplatePicker
              onSelectTemplate={(template) => {
                onLoadMeme(template)
                setShowMemes(false)
              }}
              onClose={() => setShowMemes(false)}
            />
          )}
        </div>
      </div>

      {/* Fill option for shapes */}
      {(tool === TOOLS.RECTANGLE || tool === TOOLS.ELLIPSE) && (
        <div style={{ marginTop: '8px', padding: '4px' }}>
          <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={filled}
              onChange={(e) => onFilledChange(e.target.checked)}
            />
            Filled
          </label>
        </div>
      )}

      {/* Selected sticker indicator */}
      {tool === TOOLS.STICKER && selectedSticker && (
        <div style={{ marginTop: '8px', padding: '4px', fontSize: '10px', textAlign: 'center' }}>
          {selectedSticker.name}
        </div>
      )}
    </div>
  )
}
