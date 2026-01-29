import { STICKERS } from '../../config/stickers'

export default function StickerPicker({ selectedSticker, onSelectSticker, onClose }) {
  return (
    <div
      className="picker-panel sticker-picker"
      style={{
        width: '320px',
        minWidth: '320px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          background: 'linear-gradient(180deg, #0A246A 0%, #0F4BC8 8%, #2280DD 40%, #0F4BC8 88%, #0A246A 93%, #0F4BC8 95%, #4FA3E3 100%)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 'bold',
          fontFamily: "'Trebuchet MS', Tahoma, sans-serif",
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
          borderRadius: '5px 5px 0 0',
        }}
      >
        <span>Stickers</span>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#E04727',
            border: 'none',
            borderRadius: '3px',
            width: '21px',
            height: '21px',
            cursor: 'pointer',
            padding: 0,
            boxShadow: 'inset 1px 1px 0 rgba(255, 255, 255, 0.4), inset -1px -1px 0 rgba(0, 0, 0, 0.2)',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            lineHeight: '21px',
            textAlign: 'center',
          }}
        >✕</button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '2px',
          padding: '8px',
          background: '#ECE9D8',
        }}
      >
        {STICKERS.map((sticker) => (
          <div
            key={sticker.id}
            onClick={() => onSelectSticker(sticker)}
            title={sticker.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              borderRadius: '4px',
              background: selectedSticker?.id === sticker.id ? '#316AC5' : 'transparent',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#316AC5'}
            onMouseLeave={(e) => e.currentTarget.style.background = selectedSticker?.id === sticker.id ? '#316AC5' : 'transparent'}
          >
            <span style={{ fontSize: '24px', lineHeight: 1 }}>{sticker.emoji}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
