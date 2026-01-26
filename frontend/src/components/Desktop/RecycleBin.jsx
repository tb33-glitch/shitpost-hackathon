import { useState } from 'react'

export default function RecycleBin({ onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    // Get the NFT data from the drag event
    const nftData = e.dataTransfer.getData('application/json')
    if (nftData) {
      try {
        const nft = JSON.parse(nftData)
        onDrop(nft)
      } catch (err) {
        console.error('Failed to parse dropped NFT data:', err)
      }
    }
  }

  return (
    <div
      className={`desktop-icon recycle-bin ${isDragOver ? 'drag-over' : ''}`}
      data-onboarding="recycle-bin"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="desktop-icon-image recycle-bin-icon">
        {isDragOver ? '🔥' : '🗑️'}
      </div>
      <div className="desktop-icon-label">
        {isDragOver ? 'Drop to Burn' : 'Recycle Bin'}
      </div>
    </div>
  )
}
