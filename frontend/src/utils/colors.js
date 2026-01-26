// Convert hex to RGB
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Convert RGB to hex
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// Check if two colors match (with tolerance for anti-aliasing)
export function colorsMatch(color1, color2, tolerance = 0) {
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2

  if (!rgb1 || !rgb2) return false

  return (
    Math.abs(rgb1.r - rgb2.r) <= tolerance &&
    Math.abs(rgb1.g - rgb2.g) <= tolerance &&
    Math.abs(rgb1.b - rgb2.b) <= tolerance
  )
}
