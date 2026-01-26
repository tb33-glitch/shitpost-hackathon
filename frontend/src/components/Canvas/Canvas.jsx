import { CANVAS_SIZE, CANVAS_SCALE } from '../../config/constants'

export default function Canvas({
  canvasRef,
  previewCanvasRef,
  tool,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) {
  const displaySize = CANVAS_SIZE * CANVAS_SCALE

  return (
    <div className={`canvas-wrapper tool-${tool}`}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: displaySize,
          height: displaySize,
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <canvas
        ref={previewCanvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="preview-canvas"
        style={{
          width: displaySize,
          height: displaySize,
        }}
      />
    </div>
  )
}
