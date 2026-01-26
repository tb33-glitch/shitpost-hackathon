// Canvas dimensions
export const CANVAS_SIZE = 320
export const CANVAS_SCALE = 1.5 // Display scale (1.5 = 50% larger)

// All colors for the palette (all free to use!)
export const ALL_COLORS = [
  // Basic
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  // Grays
  '#808080', // Gray
  '#C0C0C0', // Silver
  // Darks
  '#800000', // Maroon
  '#808000', // Olive
  '#008000', // Green
  '#008080', // Teal
  '#000080', // Navy
  '#800080', // Purple
  '#808040', // Dark olive
  '#004040', // Dark teal
  '#004080', // Dark blue
  '#804000', // Brown
  // Brights
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#00FF00', // Lime
  '#00FFFF', // Aqua
  '#FF00FF', // Fuchsia
  '#8000FF', // Violet
  // Pastels
  '#FFFF80', // Light yellow
  '#00FF80', // Light green
  '#80FFFF', // Light cyan
  '#8080FF', // Light blue
  '#FF0080', // Hot pink
  '#FF8040', // Light orange
  // Special
  '#FFD700', // Gold
  '#FF6B00', // Orange
]

// Seasonal color palettes - limited edition colors that rotate
export const SEASONAL_PALETTES = {
  // Winter (Dec-Feb)
  winter: {
    name: 'Winter Frost',
    colors: [
      '#A5F2F3', // Ice blue
      '#D4F1F9', // Frost
      '#1E90FF', // Dodger blue
      '#4169E1', // Royal blue
      '#87CEEB', // Sky blue
      '#B0E0E6', // Powder blue
    ],
    startMonth: 12,
    endMonth: 2,
  },
  // Spring (Mar-May)
  spring: {
    name: 'Spring Bloom',
    colors: [
      '#FFB7C5', // Cherry blossom
      '#98FB98', // Pale green
      '#DDA0DD', // Plum
      '#F0E68C', // Khaki
      '#90EE90', // Light green
      '#FFE4E1', // Misty rose
    ],
    startMonth: 3,
    endMonth: 5,
  },
  // Summer (Jun-Aug)
  summer: {
    name: 'Summer Vibes',
    colors: [
      '#FF6B6B', // Coral red
      '#4ECDC4', // Turquoise
      '#FFE66D', // Sunny yellow
      '#FF8C42', // Sunset orange
      '#95E1D3', // Mint
      '#F38181', // Salmon
    ],
    startMonth: 6,
    endMonth: 8,
  },
  // Fall (Sep-Nov)
  fall: {
    name: 'Autumn Harvest',
    colors: [
      '#D2691E', // Chocolate
      '#CD853F', // Peru
      '#DAA520', // Goldenrod
      '#8B4513', // Saddle brown
      '#A0522D', // Sienna
      '#BC8F8F', // Rosy brown
    ],
    startMonth: 9,
    endMonth: 11,
  },
  // Special events
  halloween: {
    name: 'Spooky Season',
    colors: [
      '#FF6600', // Pumpkin
      '#800080', // Purple
      '#000000', // Black
      '#2E8B57', // Slime green
      '#8B0000', // Blood red
      '#483D8B', // Dark slate blue
    ],
    startMonth: 10,
    endMonth: 10,
  },
  holiday: {
    name: 'Holiday Spirit',
    colors: [
      '#C41E3A', // Cardinal red
      '#228B22', // Forest green
      '#FFD700', // Gold
      '#DC143C', // Crimson
      '#006400', // Dark green
      '#FFFAFA', // Snow
    ],
    startMonth: 12,
    endMonth: 12,
  },
}

// Get current seasonal palette based on date
export function getCurrentSeasonalPalette() {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12

  // Check for special event palettes first (they override seasonal)
  for (const [key, palette] of Object.entries(SEASONAL_PALETTES)) {
    if (key === 'halloween' || key === 'holiday') {
      if (month >= palette.startMonth && month <= palette.endMonth) {
        return { key, ...palette }
      }
    }
  }

  // Then check regular seasonal palettes
  for (const [key, palette] of Object.entries(SEASONAL_PALETTES)) {
    if (key !== 'halloween' && key !== 'holiday') {
      // Handle year wraparound (winter: Dec-Feb)
      if (palette.startMonth > palette.endMonth) {
        if (month >= palette.startMonth || month <= palette.endMonth) {
          return { key, ...palette }
        }
      } else {
        if (month >= palette.startMonth && month <= palette.endMonth) {
          return { key, ...palette }
        }
      }
    }
  }

  // Default to summer if nothing matches
  return { key: 'summer', ...SEASONAL_PALETTES.summer }
}

// Get combined palette (base + seasonal)
export function getFullPalette() {
  const seasonal = getCurrentSeasonalPalette()
  return {
    base: ALL_COLORS,
    seasonal: seasonal.colors,
    seasonName: seasonal.name,
    all: [...ALL_COLORS, ...seasonal.colors],
  }
}
