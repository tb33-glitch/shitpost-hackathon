import { useEffect, useRef } from 'react'
import { CANVAS_SIZE, CANVAS_SCALE } from '../../config/constants'

export default function LayeredCanvas({
  layers,
  activeLayerId,
  onRegisterCanvas,
  tool,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  previewCanvasRef,
}) {
  const displaySize = CANVAS_SIZE * CANVAS_SCALE
  const containerRef = useRef(null)
  const canvasRefs = useRef({})

  // Register canvases when layers change
  useEffect(() => {
    layers.forEach(layer => {
      const canvas = canvasRefs.current[layer.id]
      if (canvas) {
        onRegisterCanvas(layer.id, canvas)

        // Initialize canvas context
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.imageSmoothingEnabled = false
      }
    })
  }, [layers, onRegisterCanvas])

  return (
    <div
      ref={containerRef}
      className={`layered-canvas-wrapper tool-${tool}`}
      style={{
        position: 'relative',
        width: displaySize,
        height: displaySize,
      }}
    >
      {/* Render each layer canvas */}
      {layers.map((layer) => (
        <canvas
          key={layer.id}
          ref={(el) => {
            if (el) canvasRefs.current[layer.id] = el
          }}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: displaySize,
            height: displaySize,
            opacity: layer.visible ? layer.opacity : 0,
            pointerEvents: layer.id === activeLayerId ? 'auto' : 'none',
            imageRendering: 'pixelated',
            zIndex: layers.indexOf(layer) + 1,
          }}
          onMouseDown={layer.id === activeLayerId ? onMouseDown : undefined}
          onMouseMove={layer.id === activeLayerId ? onMouseMove : undefined}
          onMouseUp={layer.id === activeLayerId ? onMouseUp : undefined}
          onMouseLeave={layer.id === activeLayerId ? onMouseUp : undefined}
        />
      ))}

      {/* Preview canvas for shape tools (always on top) */}
      <canvas
        ref={previewCanvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="preview-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: displaySize,
          height: displaySize,
          pointerEvents: 'none',
          opacity: 0.6,
          zIndex: 100,
        }}
      />

      {/* Interaction layer (invisible, captures all mouse events) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: displaySize,
          height: displaySize,
          zIndex: 101,
          cursor: 'crosshair',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  )
}
