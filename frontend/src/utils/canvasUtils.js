import { CANVAS_SIZE } from '../config/constants'
import { hexToRgb, colorsMatch } from './colors'

// Export canvas to PNG blob
export async function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
}

// Export canvas to data URL
export function canvasToDataURL(canvas) {
  return canvas.toDataURL('image/png')
}

// Get pixel color at coordinates
export function getPixelColor(ctx, x, y) {
  const imageData = ctx.getImageData(x, y, 1, 1)
  const data = imageData.data
  return {
    r: data[0],
    g: data[1],
    b: data[2],
    a: data[3],
  }
}

// Set pixel color at coordinates
export function setPixel(ctx, x, y, color) {
  const rgb = typeof color === 'string' ? hexToRgb(color) : color
  if (!rgb) return

  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  ctx.fillRect(x, y, 1, 1)
}

// Flood fill algorithm (bucket tool)
export function floodFill(ctx, startX, startY, fillColor) {
  const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  const data = imageData.data

  const startIdx = (startY * CANVAS_SIZE + startX) * 4
  const startR = data[startIdx]
  const startG = data[startIdx + 1]
  const startB = data[startIdx + 2]
  const startA = data[startIdx + 3]

  const fillRgb = hexToRgb(fillColor)
  if (!fillRgb) return

  // Don't fill if clicking on the same color
  if (
    startR === fillRgb.r &&
    startG === fillRgb.g &&
    startB === fillRgb.b &&
    startA === 255
  ) {
    return
  }

  const stack = [[startX, startY]]
  const visited = new Set()

  while (stack.length > 0) {
    const [x, y] = stack.pop()
    const key = `${x},${y}`

    if (visited.has(key)) continue
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue

    const idx = (y * CANVAS_SIZE + x) * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const a = data[idx + 3]

    // Check if this pixel matches the start color
    if (r !== startR || g !== startG || b !== startB || a !== startA) {
      continue
    }

    visited.add(key)

    // Fill this pixel
    data[idx] = fillRgb.r
    data[idx + 1] = fillRgb.g
    data[idx + 2] = fillRgb.b
    data[idx + 3] = 255

    // Add neighbors
    stack.push([x + 1, y])
    stack.push([x - 1, y])
    stack.push([x, y + 1])
    stack.push([x, y - 1])
  }

  ctx.putImageData(imageData, 0, 0)
}

// Bresenham's line algorithm
export function drawLine(ctx, x0, y0, x1, y1, color) {
  const rgb = hexToRgb(color)
  if (!rgb) return

  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    ctx.fillRect(x0, y0, 1, 1)

    if (x0 === x1 && y0 === y1) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
}

// Draw rectangle (outline or filled)
export function drawRectangle(ctx, x0, y0, x1, y1, color, filled = false) {
  const rgb = hexToRgb(color)
  if (!rgb) return

  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`

  const minX = Math.min(x0, x1)
  const maxX = Math.max(x0, x1)
  const minY = Math.min(y0, y1)
  const maxY = Math.max(y0, y1)

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else {
    // Top and bottom edges
    for (let x = minX; x <= maxX; x++) {
      ctx.fillRect(x, minY, 1, 1)
      ctx.fillRect(x, maxY, 1, 1)
    }
    // Left and right edges
    for (let y = minY; y <= maxY; y++) {
      ctx.fillRect(minX, y, 1, 1)
      ctx.fillRect(maxX, y, 1, 1)
    }
  }
}

// Midpoint ellipse algorithm
export function drawEllipse(ctx, x0, y0, x1, y1, color, filled = false) {
  const rgb = hexToRgb(color)
  if (!rgb) return

  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`

  const cx = Math.floor((x0 + x1) / 2)
  const cy = Math.floor((y0 + y1) / 2)
  const rx = Math.abs(Math.floor((x1 - x0) / 2))
  const ry = Math.abs(Math.floor((y1 - y0) / 2))

  if (rx === 0 || ry === 0) {
    // Degenerate case: draw a line
    drawLine(ctx, x0, y0, x1, y1, color)
    return
  }

  const points = []

  // Midpoint ellipse algorithm
  let x = 0
  let y = ry
  let px = 0
  let py = 2 * rx * rx * y

  // Region 1
  let p = ry * ry - rx * rx * ry + 0.25 * rx * rx
  while (px < py) {
    points.push({ x: cx + x, y: cy + y })
    points.push({ x: cx - x, y: cy + y })
    points.push({ x: cx + x, y: cy - y })
    points.push({ x: cx - x, y: cy - y })

    x++
    px += 2 * ry * ry
    if (p < 0) {
      p += ry * ry + px
    } else {
      y--
      py -= 2 * rx * rx
      p += ry * ry + px - py
    }
  }

  // Region 2
  p = ry * ry * (x + 0.5) * (x + 0.5) + rx * rx * (y - 1) * (y - 1) - rx * rx * ry * ry
  while (y >= 0) {
    points.push({ x: cx + x, y: cy + y })
    points.push({ x: cx - x, y: cy + y })
    points.push({ x: cx + x, y: cy - y })
    points.push({ x: cx - x, y: cy - y })

    y--
    py -= 2 * rx * rx
    if (p > 0) {
      p += rx * rx - py
    } else {
      x++
      px += 2 * ry * ry
      p += rx * rx - py + px
    }
  }

  if (filled) {
    // Fill by drawing horizontal lines
    const scanlines = {}
    for (const point of points) {
      if (!scanlines[point.y]) {
        scanlines[point.y] = { minX: point.x, maxX: point.x }
      } else {
        scanlines[point.y].minX = Math.min(scanlines[point.y].minX, point.x)
        scanlines[point.y].maxX = Math.max(scanlines[point.y].maxX, point.x)
      }
    }

    for (const [y, { minX, maxX }] of Object.entries(scanlines)) {
      for (let x = minX; x <= maxX; x++) {
        if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
          ctx.fillRect(x, parseInt(y), 1, 1)
        }
      }
    }
  } else {
    // Draw outline points
    for (const point of points) {
      if (point.x >= 0 && point.x < CANVAS_SIZE && point.y >= 0 && point.y < CANVAS_SIZE) {
        ctx.fillRect(point.x, point.y, 1, 1)
      }
    }
  }
}

// Clear canvas to white
export function clearCanvas(ctx) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
}
