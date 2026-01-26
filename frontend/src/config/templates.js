// Canvas templates - 128x128 pixel grids
// Each template provides a starting point for artwork

import { CANVAS_SIZE } from './constants'

// Helper to create empty canvas
const createEmpty = () => Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill('#FFFFFF'))

// Helper to draw a rectangle on template
const drawRect = (template, x, y, w, h, color) => {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (y + dy < CANVAS_SIZE && x + dx < CANVAS_SIZE) {
        template[y + dy][x + dx] = color
      }
    }
  }
}

// Helper to draw border
const drawBorder = (template, color, thickness = 1) => {
  for (let i = 0; i < thickness; i++) {
    // Top and bottom
    for (let x = 0; x < CANVAS_SIZE; x++) {
      template[i][x] = color
      template[CANVAS_SIZE - 1 - i][x] = color
    }
    // Left and right
    for (let y = 0; y < CANVAS_SIZE; y++) {
      template[y][i] = color
      template[y][CANVAS_SIZE - 1 - i] = color
    }
  }
}

// Helper to draw grid
const drawGrid = (template, spacing, color) => {
  for (let x = 0; x < CANVAS_SIZE; x += spacing) {
    for (let y = 0; y < CANVAS_SIZE; y++) {
      template[y][x] = color
    }
  }
  for (let y = 0; y < CANVAS_SIZE; y += spacing) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      template[y][x] = color
    }
  }
}

// Create templates
const createBorderTemplate = () => {
  const t = createEmpty()
  drawBorder(t, '#000000', 2)
  return t
}

const createGridTemplate = () => {
  const t = createEmpty()
  // Scale grid spacing relative to canvas size
  const spacing = Math.floor(CANVAS_SIZE / 8)
  drawGrid(t, spacing, '#C0C0C0')
  return t
}

const createFrameTemplate = () => {
  const t = createEmpty()
  // Outer frame
  drawBorder(t, '#808080', 4)
  // Inner frame
  for (let i = 4; i < 8; i++) {
    for (let x = i; x < CANVAS_SIZE - i; x++) {
      t[i][x] = '#FFD700'
      t[CANVAS_SIZE - 1 - i][x] = '#FFD700'
    }
    for (let y = i; y < CANVAS_SIZE - i; y++) {
      t[y][i] = '#FFD700'
      t[y][CANVAS_SIZE - 1 - i] = '#FFD700'
    }
  }
  return t
}

const createQuadrantTemplate = () => {
  const t = createEmpty()
  const half = CANVAS_SIZE / 2
  // Dividing lines
  for (let i = 0; i < CANVAS_SIZE; i++) {
    t[half - 1][i] = '#C0C0C0'
    t[half][i] = '#C0C0C0'
    t[i][half - 1] = '#C0C0C0'
    t[i][half] = '#C0C0C0'
  }
  return t
}

const createPortraitTemplate = () => {
  const t = createEmpty()
  // Scale all values relative to canvas size
  const scale = CANVAS_SIZE / 128

  // Head circle area (guide)
  const cx = Math.floor(64 * scale)
  const cy = Math.floor(40 * scale)
  const r = Math.floor(25 * scale)

  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (dist >= r - 1 && dist <= r + 1) {
        if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
          t[y][x] = '#E0E0E0'
        }
      }
    }
  }

  // Body area (guide)
  const bodyX = Math.floor(44 * scale)
  const bodyY = Math.floor(70 * scale)
  const bodyW = Math.floor(40 * scale)
  const bodyH = Math.floor(50 * scale)

  // Draw body outline
  for (let x = bodyX; x < bodyX + bodyW; x++) {
    if (x < CANVAS_SIZE) {
      t[bodyY][x] = '#E0E0E0'
      if (bodyY + bodyH - 1 < CANVAS_SIZE) t[bodyY + bodyH - 1][x] = '#E0E0E0'
    }
  }
  for (let y = bodyY; y < bodyY + bodyH; y++) {
    if (y < CANVAS_SIZE) {
      t[y][bodyX] = '#E0E0E0'
      if (bodyX + bodyW - 1 < CANVAS_SIZE) t[y][bodyX + bodyW - 1] = '#E0E0E0'
    }
  }

  return t
}

const createLandscapeTemplate = () => {
  const t = createEmpty()
  // Scale relative to canvas size
  const scale = CANVAS_SIZE / 128

  // Sky/ground line at 2/3 height
  const horizonY = Math.floor(CANVAS_SIZE * 0.66)
  const lineThickness = Math.max(2, Math.floor(2 * scale))

  for (let dy = 0; dy < lineThickness; dy++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      if (horizonY + dy < CANVAS_SIZE) {
        t[horizonY + dy][x] = '#808080'
      }
    }
  }

  // Light blue hint for sky (left and right borders)
  for (let y = 0; y < horizonY; y++) {
    t[y][0] = '#E0F0FF'
    t[y][CANVAS_SIZE - 1] = '#E0F0FF'
  }

  // Green hint for ground (left and right borders)
  for (let y = horizonY + lineThickness; y < CANVAS_SIZE; y++) {
    t[y][0] = '#E0FFE0'
    t[y][CANVAS_SIZE - 1] = '#E0FFE0'
  }

  return t
}

const createComicPanelTemplate = () => {
  const t = createEmpty()
  // 2x2 comic panels
  const gutter = 4
  const panelW = (CANVAS_SIZE - gutter * 3) / 2
  const panelH = (CANVAS_SIZE - gutter * 3) / 2

  // Draw panel borders
  const panels = [
    { x: gutter, y: gutter },
    { x: gutter * 2 + panelW, y: gutter },
    { x: gutter, y: gutter * 2 + panelH },
    { x: gutter * 2 + panelW, y: gutter * 2 + panelH },
  ]

  panels.forEach(({ x, y }) => {
    // Top border
    for (let dx = 0; dx < panelW; dx++) t[Math.floor(y)][Math.floor(x + dx)] = '#000000'
    // Bottom border
    for (let dx = 0; dx < panelW; dx++) t[Math.floor(y + panelH - 1)][Math.floor(x + dx)] = '#000000'
    // Left border
    for (let dy = 0; dy < panelH; dy++) t[Math.floor(y + dy)][Math.floor(x)] = '#000000'
    // Right border
    for (let dy = 0; dy < panelH; dy++) t[Math.floor(y + dy)][Math.floor(x + panelW - 1)] = '#000000'
  })

  return t
}

export const TEMPLATES = [
  {
    name: 'Blank',
    id: 'blank',
    description: 'Start fresh',
    getData: createEmpty,
  },
  {
    name: 'Border',
    id: 'border',
    description: 'Simple black border',
    getData: createBorderTemplate,
  },
  {
    name: 'Grid',
    id: 'grid',
    description: '16px grid guide',
    getData: createGridTemplate,
  },
  {
    name: 'Frame',
    id: 'frame',
    description: 'Golden picture frame',
    getData: createFrameTemplate,
  },
  {
    name: 'Quadrants',
    id: 'quadrants',
    description: '4 equal sections',
    getData: createQuadrantTemplate,
  },
  {
    name: 'Portrait',
    id: 'portrait',
    description: 'Head & body guides',
    getData: createPortraitTemplate,
  },
  {
    name: 'Landscape',
    id: 'landscape',
    description: 'Sky & ground division',
    getData: createLandscapeTemplate,
  },
  {
    name: 'Comic',
    id: 'comic',
    description: '4-panel comic layout',
    getData: createComicPanelTemplate,
  },
]

export default TEMPLATES
