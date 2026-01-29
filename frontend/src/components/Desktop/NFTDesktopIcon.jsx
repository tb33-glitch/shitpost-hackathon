import { useState, memo } from 'react'

const NFTDesktopIcon = memo(function NFTDesktopIcon({ nft, onClick, isActive }) {
  const [isSelected, setIsSelected] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    setIsSelected(true)
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    onClick(nft)
  }

  const handleDragStart = (e) => {
    setIsDragging(true)
    // Store NFT data in the drag event
    e.dataTransfer.setData('application/json', JSON.stringify(nft))
    e.dataTransfer.effectAllowed = 'move'

    // Create a custom drag image (optional - uses default if not set)
    if (e.target) {
      e.dataTransfer.setDragImage(e.target, 35, 35)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      className={`desktop-icon nft-icon ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onBlur={() => setIsSelected(false)}
      tabIndex={0}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="desktop-icon-image nft-image">
        {nft.image && !imageError ? (
          <>
            {!imageLoaded && <span className="nft-placeholder">⏳</span>}
            <img
              src={nft.image}
              alt={nft.name}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
              draggable={false}
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />
          </>
        ) : (
          <span className="nft-placeholder">🖼️</span>
        )}
      </div>
      <div className="desktop-icon-label">{nft.name}</div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return prevProps.nft.tokenId === nextProps.nft.tokenId &&
         prevProps.nft.image === nextProps.nft.image &&
         prevProps.nft.name === nextProps.nft.name &&
         prevProps.isActive === nextProps.isActive
})

export default NFTDesktopIcon
