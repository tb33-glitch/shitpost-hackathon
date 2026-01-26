import { useState } from 'react'

export default function DesktopIcon({ icon, label, onClick, isActive }) {
  const [isSelected, setIsSelected] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    setIsSelected(true)
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div
      className={`desktop-icon ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onBlur={() => setIsSelected(false)}
      tabIndex={0}
    >
      <div className="desktop-icon-image">{icon}</div>
      <div className="desktop-icon-label">{label}</div>
    </div>
  )
}
