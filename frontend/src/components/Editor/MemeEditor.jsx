import { useState, useCallback, useRef } from 'react'
import MemeCanvas, { CANVAS_PRESETS, getCanvasPresets } from './MemeCanvas'
import MemeTemplatePicker from './MemeTemplatePicker'
import TextEditor from './TextEditor'
import useTemplates from '../../hooks/useTemplates'
import './MemeEditor.css'

/**
 * MemeEditor - Main meme creation interface
 * Combines template selection, canvas, and text editing
 */
export default function MemeEditor({ onExport, onMint }) {
  const canvasRef = useRef(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [canvasPreset, setCanvasPreset] = useState('SQUARE')
  const [selectedZoneId, setSelectedZoneId] = useState(null)

  const {
    selectedTemplate,
    templateImage,
    isLoading,
    error,
    selectTemplate,
    clearTemplate,
    updateTextContent,
    updateTextStyle,
    getZonesWithContent,
    hasTemplate,
  } = useTemplates()

  const zones = getZonesWithContent()

  // Handle template selection
  const handleSelectTemplate = useCallback((template) => {
    selectTemplate(template)
    setSelectedZoneId(null)
    setShowTemplatePicker(false)
  }, [selectTemplate])

  // Handle zone selection
  const handleZoneClick = useCallback((zoneId) => {
    setSelectedZoneId(zoneId)
  }, [])

  // Handle export/mint
  const handleExport = useCallback(async () => {
    // Find the canvas element inside MemeCanvas
    const canvasContainer = document.querySelector('.meme-canvas-container canvas')
    if (!canvasContainer) return null

    const dataURL = canvasContainer.toDataURL('image/png')
    if (onExport) {
      onExport(dataURL)
    }
    return dataURL
  }, [onExport])

  const handleMint = useCallback(async () => {
    const dataURL = await handleExport()
    if (dataURL && onMint) {
      onMint({
        dataURL,
        template: selectedTemplate,
        textZones: zones,
      })
    }
  }, [handleExport, onMint, selectedTemplate, zones])

  // Clear and start over
  const handleClear = useCallback(() => {
    if (window.confirm('Clear current meme and start over?')) {
      clearTemplate()
      setSelectedZoneId(null)
    }
  }, [clearTemplate])

  return (
    <div className="meme-editor">
      {/* Toolbar */}
      <div className="meme-editor-toolbar">
        <div className="toolbar-left">
          <button
            className="toolbar-button"
            onClick={() => setShowTemplatePicker(true)}
          >
            Templates
          </button>
          <button
            className="toolbar-button"
            onClick={handleClear}
            disabled={!hasTemplate}
          >
            Clear
          </button>
        </div>

        <div className="toolbar-center">
          <label>Canvas:</label>
          <select
            value={canvasPreset}
            onChange={(e) => setCanvasPreset(e.target.value)}
          >
            {getCanvasPresets().map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <button
            className="toolbar-button primary"
            onClick={handleMint}
            disabled={!hasTemplate}
          >
            Mint - $2
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="meme-editor-content">
        {/* Canvas Area */}
        <div className="meme-editor-canvas-area">
          {!hasTemplate ? (
            <div className="meme-editor-placeholder">
              <div className="placeholder-content">
                <span className="placeholder-icon">+</span>
                <span className="placeholder-text">Select a template to get started</span>
                <button
                  className="placeholder-button"
                  onClick={() => setShowTemplatePicker(true)}
                >
                  Browse Templates
                </button>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="meme-editor-loading">
                  Loading template...
                </div>
              )}
              {error && (
                <div className="meme-editor-error">
                  {error}
                </div>
              )}
              {!isLoading && !error && (
                <MemeCanvas
                  ref={canvasRef}
                  templateImage={templateImage}
                  textZones={zones}
                  canvasPreset={canvasPreset}
                  onZoneClick={handleZoneClick}
                  selectedZoneId={selectedZoneId}
                  scale={0.5}
                />
              )}
            </>
          )}
        </div>

        {/* Right Panel - Text Editor */}
        <div className="meme-editor-sidebar">
          <TextEditor
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={handleZoneClick}
            onUpdateText={updateTextContent}
            onUpdateStyle={updateTextStyle}
          />

          {/* Template Info */}
          {selectedTemplate && (
            <fieldset className="template-info">
              <legend>Template</legend>
              <div className="template-info-row">
                <span className="template-info-label">Name:</span>
                <span>{selectedTemplate.name}</span>
              </div>
              <div className="template-info-row">
                <span className="template-info-label">Category:</span>
                <span>{selectedTemplate.category}</span>
              </div>
              <button
                className="change-template-button"
                onClick={() => setShowTemplatePicker(true)}
              >
                Change Template
              </button>
            </fieldset>
          )}
        </div>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div className="modal-overlay" onClick={() => setShowTemplatePicker(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <MemeTemplatePicker
              onSelectTemplate={handleSelectTemplate}
              onClose={() => setShowTemplatePicker(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
