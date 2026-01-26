import { useRef, useEffect, useCallback, useState } from 'react'
import './MemeCanvas.css'

// Canvas presets from PRD
export const CANVAS_PRESETS = {
  SQUARE: { width: 1080, height: 1080, label: 'Square (1080x1080)' },
  CLASSIC: { width: 1200, height: 900, label: 'Classic (1200x900)' },
  WIDE: { width: 1920, height: 1080, label: 'Wide (1920x1080)' },
  PORTRAIT: { width: 1080, height: 1920, label: 'Portrait (1080x1920)' },
}

/**
 * MemeCanvas - Renders template with text overlays
 * Handles the visual composition of memes
 */
export default function MemeCanvas({
  templateImage,
  textZones = [],
  canvasPreset = 'SQUARE',
  onZoneClick,
  selectedZoneId,
  scale = 0.5, // Display scale (actual canvas is larger)
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const preset = CANVAS_PRESETS[canvasPreset] || CANVAS_PRESETS.SQUARE
  const displayWidth = preset.width * scale
  const displayHeight = preset.height * scale

  // Draw the meme on canvas
  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, preset.width, preset.height)

    // Fill background white
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, preset.width, preset.height)

    // Draw template image if available
    if (templateImage) {
      // Calculate scaling to fit/cover canvas while maintaining aspect ratio
      const imgAspect = templateImage.width / templateImage.height
      const canvasAspect = preset.width / preset.height

      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        // Image is wider - fit to height
        drawHeight = preset.height
        drawWidth = drawHeight * imgAspect
        drawX = (preset.width - drawWidth) / 2
        drawY = 0
      } else {
        // Image is taller - fit to width
        drawWidth = preset.width
        drawHeight = drawWidth / imgAspect
        drawX = 0
        drawY = (preset.height - drawHeight) / 2
      }

      ctx.drawImage(templateImage, drawX, drawY, drawWidth, drawHeight)
    }

    // Draw text zones
    textZones.forEach(zone => {
      const x = (zone.x / 100) * preset.width
      const y = (zone.y / 100) * preset.height
      const style = zone.style || {}

      // Set text style
      const fontSize = style.fontSize || zone.fontSize || 24
      const scaledFontSize = fontSize * (preset.width / 1080) // Scale relative to 1080
      ctx.font = `bold ${scaledFontSize}px ${style.fontFamily || 'Impact, sans-serif'}`
      ctx.textAlign = style.align || zone.align || 'center'
      ctx.textBaseline = 'middle'

      const text = zone.text || ''
      if (!text) return

      // Handle multi-line text
      const lines = text.split('\n')
      const lineHeight = scaledFontSize * 1.2

      lines.forEach((line, index) => {
        const lineY = y + (index - (lines.length - 1) / 2) * lineHeight

        // Draw stroke (outline)
        ctx.strokeStyle = style.strokeColor || '#000000'
        ctx.lineWidth = (style.strokeWidth || 2) * (preset.width / 1080)
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(line, x, lineY)

        // Draw fill
        ctx.fillStyle = style.color || '#FFFFFF'
        ctx.fillText(line, x, lineY)
      })
    })
  }, [templateImage, textZones, preset])

  // Redraw when dependencies change
  useEffect(() => {
    drawMeme()
  }, [drawMeme])

  // Handle click on canvas to select text zones
  const handleCanvasClick = useCallback((e) => {
    if (!onZoneClick) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Get click position in canvas coordinates
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    // Find which zone was clicked (if any)
    const clickedZone = textZones.find(zone => {
      const halfWidth = zone.width / 2
      const halfHeight = zone.height / 2
      return (
        clickX >= zone.x - halfWidth &&
        clickX <= zone.x + halfWidth &&
        clickY >= zone.y - halfHeight &&
        clickY <= zone.y + halfHeight
      )
    })

    onZoneClick(clickedZone?.id || null)
  }, [textZones, onZoneClick])

  // Export the canvas as a data URL
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }, [])

  // Export as blob for uploading
  const exportBlob = useCallback(() => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      if (!canvas) {
        resolve(null)
        return
      }
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png')
    })
  }, [])

  // Expose export methods via ref
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.exportCanvas = exportCanvas
      canvasRef.current.exportBlob = exportBlob
    }
  }, [exportCanvas, exportBlob])

  return (
    <div
      ref={containerRef}
      className="meme-canvas-container"
      style={{ width: displayWidth, height: displayHeight }}
    >
      <canvas
        ref={canvasRef}
        width={preset.width}
        height={preset.height}
        className="meme-canvas"
        onClick={handleCanvasClick}
        style={{
          width: displayWidth,
          height: displayHeight,
        }}
      />

      {/* Zone overlays for visual feedback */}
      {textZones.map(zone => (
        <div
          key={zone.id}
          className={`zone-overlay ${selectedZoneId === zone.id ? 'selected' : ''}`}
          style={{
            left: `${zone.x - zone.width / 2}%`,
            top: `${zone.y - zone.height / 2}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onZoneClick?.(zone.id)
          }}
        >
          {!zone.text && (
            <span className="zone-hint">Click to edit</span>
          )}
        </div>
      ))}
    </div>
  )
}

// Export helper function
export function getCanvasPresets() {
  return Object.entries(CANVAS_PRESETS).map(([key, value]) => ({
    id: key,
    ...value,
  }))
}
