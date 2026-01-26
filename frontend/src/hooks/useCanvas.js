import { useRef, useState, useCallback, useEffect } from 'react'
import { CANVAS_SIZE, CANVAS_SCALE } from '../config/constants'
import {
  floodFill,
  drawLine,
  drawRectangle,
  drawEllipse,
  clearCanvas,
  getPixelColor,
  setPixel,
} from '../utils/canvasUtils'
import { rgbToHex } from '../utils/colors'

export const TOOLS = {
  PENCIL: 'pencil',
  ERASER: 'eraser',
  FILL: 'fill',
  EYEDROPPER: 'eyedropper',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  STICKER: 'sticker',
}

const MAX_HISTORY = 50

export default function useCanvas(getActiveCanvas) {
  const previewCanvasRef = useRef(null)
  const [tool, setTool] = useState(TOOLS.PENCIL)
  const [color, setColor] = useState('#000000')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState(null)
  const [filled, setFilled] = useState(false)
  const [selectedSticker, setSelectedSticker] = useState(null)

  // Undo/Redo history (per-layer would be complex, so we do global snapshots)
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Get the current canvas (from layers)
  const getCurrentCanvas = useCallback(() => {
    if (getActiveCanvas) {
      return getActiveCanvas()
    }
    return null
  }, [getActiveCanvas])

  // Save state to history
  const saveToHistory = useCallback(() => {
    const canvas = getCurrentCanvas()
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Remove any redo states
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)

    // Add new state
    historyRef.current.push({ imageData, canvasId: canvas.dataset?.layerId })

    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }

    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [getCurrentCanvas])

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return

    const canvas = getCurrentCanvas()
    if (!canvas) return

    historyIndexRef.current--
    const state = historyRef.current[historyIndexRef.current]
    if (state) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.putImageData(state.imageData, 0, 0)
    }

    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(true)
  }, [getCurrentCanvas])

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return

    const canvas = getCurrentCanvas()
    if (!canvas) return

    historyIndexRef.current++
    const state = historyRef.current[historyIndexRef.current]
    if (state) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.putImageData(state.imageData, 0, 0)
    }

    setCanUndo(true)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
  }, [getCurrentCanvas])

  // Reset history when layer changes
  const resetHistory = useCallback(() => {
    historyRef.current = []
    historyIndexRef.current = -1
    setCanUndo(false)
    setCanRedo(false)

    // Save initial state of new layer
    const canvas = getCurrentCanvas()
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      historyRef.current = [{ imageData }]
      historyIndexRef.current = 0
    }
  }, [getCurrentCanvas])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e) => {
    const canvas = getCurrentCanvas()
    if (!canvas) return null

    // Get the parent container's position
    const container = canvas.parentElement
    if (!container) return null

    const rect = container.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / CANVAS_SCALE)
    const y = Math.floor((e.clientY - rect.top) / CANVAS_SCALE)

    return {
      x: Math.max(0, Math.min(CANVAS_SIZE - 1, x)),
      y: Math.max(0, Math.min(CANVAS_SIZE - 1, y)),
    }
  }, [getCurrentCanvas])

  // Draw sticker on canvas (scaled for canvas size)
  const drawSticker = useCallback((ctx, x, y, sticker) => {
    if (!sticker || !sticker.data) return

    const stickerSize = sticker.data.length
    // Scale stickers to be proportional to canvas size
    // Stickers are 16x16 designed for 128px, scale for current canvas size
    const scale = Math.max(1, Math.floor(CANVAS_SIZE / 128))
    const scaledSize = stickerSize * scale
    const halfSize = Math.floor(scaledSize / 2)

    for (let sy = 0; sy < stickerSize; sy++) {
      for (let sx = 0; sx < stickerSize; sx++) {
        const pixelColor = sticker.data[sy][sx]
        if (pixelColor) {
          // Draw each sticker pixel as a scaled block
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const px = x - halfSize + (sx * scale) + dx
              const py = y - halfSize + (sy * scale) + dy
              if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE) {
                setPixel(ctx, px, py, pixelColor)
              }
            }
          }
        }
      }
    }
  }, [])

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e) => {
      const coords = getCanvasCoords(e)
      if (!coords) return

      const canvas = getCurrentCanvas()
      if (!canvas) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      setIsDrawing(true)
      setStartPos(coords)

      switch (tool) {
        case TOOLS.PENCIL:
          saveToHistory()
          setPixel(ctx, coords.x, coords.y, color)
          break

        case TOOLS.ERASER:
          saveToHistory()
          // For layers, we clear to transparent instead of white
          ctx.clearRect(coords.x, coords.y, 1, 1)
          break

        case TOOLS.FILL:
          saveToHistory()
          floodFill(ctx, coords.x, coords.y, color)
          setIsDrawing(false)
          break

        case TOOLS.EYEDROPPER: {
          const pixelColor = getPixelColor(ctx, coords.x, coords.y)
          if (pixelColor.a > 0) {
            setColor(rgbToHex(pixelColor.r, pixelColor.g, pixelColor.b))
          }
          setIsDrawing(false)
          break
        }

        case TOOLS.STICKER:
          if (selectedSticker) {
            saveToHistory()
            drawSticker(ctx, coords.x, coords.y, selectedSticker)
          }
          setIsDrawing(false)
          break

        default:
          saveToHistory()
          break
      }
    },
    [tool, color, getCanvasCoords, getCurrentCanvas, saveToHistory, selectedSticker, drawSticker]
  )

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing) return

      const coords = getCanvasCoords(e)
      if (!coords) return

      const canvas = getCurrentCanvas()
      if (!canvas) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      switch (tool) {
        case TOOLS.PENCIL:
          if (startPos) {
            drawLine(ctx, startPos.x, startPos.y, coords.x, coords.y, color)
          }
          setStartPos(coords)
          break

        case TOOLS.ERASER:
          if (startPos) {
            // Draw transparent line for eraser on layers
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = CANVAS_SIZE
            tempCanvas.height = CANVAS_SIZE
            const tempCtx = tempCanvas.getContext('2d')

            // Draw line on temp canvas
            drawLine(tempCtx, startPos.x, startPos.y, coords.x, coords.y, '#000000')

            // Get the pixels from temp canvas and clear them on main canvas
            const tempData = tempCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
            for (let i = 0; i < tempData.data.length; i += 4) {
              if (tempData.data[i + 3] > 0) {
                const pixelIndex = i / 4
                const px = pixelIndex % CANVAS_SIZE
                const py = Math.floor(pixelIndex / CANVAS_SIZE)
                ctx.clearRect(px, py, 1, 1)
              }
            }
          }
          setStartPos(coords)
          break

        case TOOLS.LINE:
        case TOOLS.RECTANGLE:
        case TOOLS.ELLIPSE:
          // Draw preview on preview canvas
          if (previewCanvasRef.current && startPos) {
            const previewCtx = previewCanvasRef.current.getContext('2d')
            previewCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

            if (tool === TOOLS.LINE) {
              drawLine(previewCtx, startPos.x, startPos.y, coords.x, coords.y, color)
            } else if (tool === TOOLS.RECTANGLE) {
              drawRectangle(previewCtx, startPos.x, startPos.y, coords.x, coords.y, color, filled)
            } else if (tool === TOOLS.ELLIPSE) {
              drawEllipse(previewCtx, startPos.x, startPos.y, coords.x, coords.y, color, filled)
            }
          }
          break

        default:
          break
      }
    },
    [isDrawing, tool, color, startPos, filled, getCanvasCoords, getCurrentCanvas]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(
    (e) => {
      if (!isDrawing) return

      const coords = getCanvasCoords(e)
      if (!coords) return

      const canvas = getCurrentCanvas()
      if (!canvas) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      switch (tool) {
        case TOOLS.LINE:
          if (startPos) {
            drawLine(ctx, startPos.x, startPos.y, coords.x, coords.y, color)
          }
          break

        case TOOLS.RECTANGLE:
          if (startPos) {
            drawRectangle(ctx, startPos.x, startPos.y, coords.x, coords.y, color, filled)
          }
          break

        case TOOLS.ELLIPSE:
          if (startPos) {
            drawEllipse(ctx, startPos.x, startPos.y, coords.x, coords.y, color, filled)
          }
          break

        default:
          break
      }

      // Clear preview canvas
      if (previewCanvasRef.current) {
        const previewCtx = previewCanvasRef.current.getContext('2d')
        previewCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }

      setIsDrawing(false)
      setStartPos(null)
    },
    [isDrawing, tool, color, startPos, filled, getCanvasCoords, getCurrentCanvas]
  )

  // Clear current layer
  const clear = useCallback(() => {
    const canvas = getCurrentCanvas()
    if (!canvas) return

    saveToHistory()
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }, [getCurrentCanvas, saveToHistory])

  // Load template onto current layer
  const loadTemplate = useCallback((templateData) => {
    const canvas = getCurrentCanvas()
    if (!canvas || !templateData) return

    saveToHistory()
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    // Clear first
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw template
    for (let y = 0; y < templateData.length; y++) {
      for (let x = 0; x < templateData[y].length; x++) {
        const pixelColor = templateData[y][x]
        if (pixelColor && pixelColor !== '#FFFFFF') {
          setPixel(ctx, x, y, pixelColor)
        }
      }
    }
  }, [getCurrentCanvas, saveToHistory])

  // Load meme (ImageData or template object) onto current layer
  const loadMeme = useCallback((data) => {
    const canvas = getCurrentCanvas()
    if (!canvas || !data) return

    saveToHistory()
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    // If it's ImageData, put it directly
    if (data instanceof ImageData) {
      ctx.putImageData(data, 0, 0)
      return
    }

    // If it's a template object with an image URL
    if (data.image) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Clear canvas first
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

        // Calculate scaling to fit canvas while maintaining aspect ratio
        const imgAspect = img.width / img.height
        const canvasAspect = 1 // Our canvas is square

        let drawWidth, drawHeight, drawX, drawY

        if (imgAspect > canvasAspect) {
          // Image is wider - fit to height
          drawHeight = CANVAS_SIZE
          drawWidth = drawHeight * imgAspect
          drawX = (CANVAS_SIZE - drawWidth) / 2
          drawY = 0
        } else {
          // Image is taller - fit to width
          drawWidth = CANVAS_SIZE
          drawHeight = drawWidth / imgAspect
          drawX = 0
          drawY = (CANVAS_SIZE - drawHeight) / 2
        }

        // Draw the image
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        // Draw default text if template has text zones
        if (data.textZones && data.textZones.length > 0) {
          data.textZones.forEach(zone => {
            if (zone.defaultText) {
              const x = (zone.x / 100) * CANVAS_SIZE
              const y = (zone.y / 100) * CANVAS_SIZE
              const fontSize = Math.max(8, Math.floor((zone.fontSize || 16) * (CANVAS_SIZE / 400)))

              ctx.font = `bold ${fontSize}px Impact, sans-serif`
              ctx.textAlign = zone.align || 'center'
              ctx.textBaseline = 'middle'

              // Draw stroke
              ctx.strokeStyle = '#000000'
              ctx.lineWidth = Math.max(1, fontSize / 8)
              ctx.lineJoin = 'round'
              ctx.strokeText(zone.defaultText, x, y)

              // Draw fill
              ctx.fillStyle = '#FFFFFF'
              ctx.fillText(zone.defaultText, x, y)
            }
          })
        }
      }
      img.onerror = () => {
        console.error('Failed to load template image:', data.image)
      }
      img.src = data.image
    }
  }, [getCurrentCanvas, saveToHistory])

  return {
    previewCanvasRef,
    tool,
    setTool,
    color,
    setColor,
    filled,
    setFilled,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clear,
    undo,
    redo,
    canUndo,
    canRedo,
    loadTemplate,
    loadMeme,
    selectedSticker,
    setSelectedSticker,
    resetHistory,
    isDrawing,
  }
}
