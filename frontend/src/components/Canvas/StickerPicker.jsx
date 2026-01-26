import { STICKERS } from '../../config/stickers'

export default function StickerPicker({ selectedSticker, onSelectSticker, onClose }) {
  return (
    <div className="picker-panel sticker-picker">
      <div className="picker-header">
        <span>Stickers</span>
        <button className="picker-close" onClick={onClose}>X</button>
      </div>
      <div className="picker-grid">
        {STICKERS.map((sticker) => (
          <div
            key={sticker.id}
            className={`picker-item ${selectedSticker?.id === sticker.id ? 'selected' : ''}`}
            onClick={() => onSelectSticker(sticker)}
            title={sticker.name}
          >
            <StickerPreview sticker={sticker} />
            <span className="picker-item-name">{sticker.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Render a small preview of the sticker
function StickerPreview({ sticker }) {
  const size = sticker.data.length
  const scale = Math.floor(24 / size)

  return (
    <div
      className="sticker-preview"
      style={{
        width: size * scale,
        height: size * scale,
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${scale}px)`,
      }}
    >
      {sticker.data.flat().map((color, i) => (
        <div
          key={i}
          style={{
            width: scale,
            height: scale,
            backgroundColor: color || 'transparent',
          }}
        />
      ))}
    </div>
  )
}
