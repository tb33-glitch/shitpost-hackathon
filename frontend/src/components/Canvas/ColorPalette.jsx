import { ALL_COLORS } from '../../config/constants'

export default function ColorPalette({
  color,
  onColorChange,
}) {
  return (
    <div className="color-palette">
      {/* Current color display */}
      <div className="current-colors">
        <div className="current-color-display">
          <div className="foreground-color" style={{ backgroundColor: color }} />
          <div className="background-color" />
        </div>
        <span style={{ fontSize: '10px' }}>
          Color: {color}
        </span>
      </div>

      {/* All colors grid */}
      <div className="all-colors-section">
        <div className="color-palette-grid">
          {ALL_COLORS.map((c, index) => (
            <div
              key={index}
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
