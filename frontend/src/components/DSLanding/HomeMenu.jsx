import { memo } from 'react'

const menuItems = [
  { icon: '🎨', label: 'Meme Studio', color: '#ff6b00' },
  { icon: '💰', label: 'Meme Armory', color: '#00c853' },
  { icon: '🔥', label: 'Sacred Waste', color: '#ff4444' },
  { icon: '❓', label: 'WTF is this?', color: '#3a6ea5' },
]

function HomeMenu({ selectedIndex, onSelect, onHover }) {
  return (
    <div className="ds-home-menu">
      <div className="ds-menu-grid">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`ds-menu-item ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => onSelect(index)}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            style={{ '--item-color': item.color }}
          >
            <div className="ds-menu-icon-wrapper">
              <div className="ds-menu-icon">{item.icon}</div>
            </div>
            <div className="ds-menu-label">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="ds-menu-hint">
        <span className="hint-icon">👆</span> Touch or use arrow keys to navigate
      </div>
    </div>
  )
}

export default memo(HomeMenu)
