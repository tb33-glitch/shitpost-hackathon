import { useState, useRef, useEffect } from 'react'
import useImgflip, { pixelateMeme } from '../../hooks/useImgflip'
import useRedditMemes from '../../hooks/useRedditMemes'
import { CANVAS_SIZE } from '../../config/constants'

const DEFAULT_TEXT_ITEMS = [
  { id: 1, text: '', x: 0.5, y: 0.12 },  // Top center
  { id: 2, text: '', x: 0.5, y: 0.88 },  // Bottom center
]

export default function MemePicker({ onSelectMeme, onClose }) {
  const { memes: imgflipMemes, isLoading: imgflipLoading, error: imgflipError } = useImgflip()
  const { memes: redditMemes, isLoading: redditLoading, error: redditError, refetch: refetchReddit } = useRedditMemes()

  const [activeTab, setActiveTab] = useState('reddit') // 'reddit' or 'templates'
  const [selectedMeme, setSelectedMeme] = useState(null)
  const [textItems, setTextItems] = useState(DEFAULT_TEXT_ITEMS)
  const [activeTextId, setActiveTextId] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const previewCanvasRef = useRef(null)
  const previewContainerRef = useRef(null)

  // Get current memes based on active tab
  const currentMemes = activeTab === 'reddit' ? redditMemes : imgflipMemes
  const isLoading = activeTab === 'reddit' ? redditLoading : imgflipLoading
  const error = activeTab === 'reddit' ? redditError : imgflipError

  // Filter memes by search query
  const filteredMemes = currentMemes.filter((meme) => {
    const searchText = activeTab === 'reddit' ? meme.title : meme.name
    return searchText?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Update preview when text or positions change
  useEffect(() => {
    if (selectedMeme && previewCanvasRef.current) {
      updatePreview()
    }
  }, [selectedMeme, textItems])

  const updatePreview = async () => {
    if (!selectedMeme || !previewCanvasRef.current) return

    try {
      const imageData = await pixelateMeme(selectedMeme.url, textItems)
      const ctx = previewCanvasRef.current.getContext('2d')
      ctx.putImageData(imageData, 0, 0)
    } catch (err) {
      // Preview failed, that's ok
    }
  }

  const handleMemeClick = (meme) => {
    setSelectedMeme({
      ...meme,
      name: meme.name || meme.title // Normalize name field
    })
    setTextItems(DEFAULT_TEXT_ITEMS.map(item => ({ ...item, text: '' })))
    setActiveTextId(1)
    setCreateError(null)
  }

  const handleTextChange = (id, newText) => {
    setTextItems(items =>
      items.map(item =>
        item.id === id ? { ...item, text: newText } : item
      )
    )
  }

  // Handle click/drag on preview to position text
  const getPreviewCoords = (e) => {
    if (!previewContainerRef.current) return null
    const rect = previewContainerRef.current.getBoundingClientRect()
    const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height))
    return { x, y }
  }

  const handlePreviewMouseDown = (e) => {
    e.preventDefault()
    const coords = getPreviewCoords(e)
    if (coords) {
      setIsDragging(true)
      setTextItems(items =>
        items.map(item =>
          item.id === activeTextId ? { ...item, ...coords } : item
        )
      )
    }
  }

  const handlePreviewMouseMove = (e) => {
    if (!isDragging) return
    const coords = getPreviewCoords(e)
    if (coords) {
      setTextItems(items =>
        items.map(item =>
          item.id === activeTextId ? { ...item, ...coords } : item
        )
      )
    }
  }

  const handlePreviewMouseUp = () => {
    setIsDragging(false)
  }

  // Add a new text item
  const addTextItem = () => {
    const newId = Math.max(...textItems.map(t => t.id)) + 1
    const newItem = { id: newId, text: '', x: 0.5, y: 0.5 }
    setTextItems([...textItems, newItem])
    setActiveTextId(newId)
  }

  // Remove a text item
  const removeTextItem = (id) => {
    if (textItems.length <= 1) return
    const newItems = textItems.filter(item => item.id !== id)
    setTextItems(newItems)
    if (activeTextId === id) {
      setActiveTextId(newItems[0].id)
    }
  }

  const handleCreate = async () => {
    if (!selectedMeme) return

    setIsCreating(true)
    setCreateError(null)

    try {
      const imageData = await pixelateMeme(selectedMeme.url, textItems)
      onSelectMeme(imageData)
      onClose()
    } catch (err) {
      console.error('Error creating meme:', err)
      setCreateError('Failed to load image. Try another meme.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleBack = () => {
    setSelectedMeme(null)
    setTextItems(DEFAULT_TEXT_ITEMS.map(item => ({ ...item, text: '' })))
    setActiveTextId(1)
    setCreateError(null)
  }

  const activeItem = textItems.find(t => t.id === activeTextId)

  return (
    <div className="picker-panel meme-picker">
      <div className="picker-header">
        <span>{selectedMeme ? 'Add Caption' : 'Meme Generator'}</span>
        <button className="picker-close" onClick={onClose}>
          X
        </button>
      </div>

      {!selectedMeme ? (
        <div className="meme-content">
          {/* Tab buttons */}
          <div className="meme-tabs">
            <button
              className={`meme-tab ${activeTab === 'reddit' ? 'active' : ''}`}
              onClick={() => setActiveTab('reddit')}
            >
              🔥 Reddit Hot
            </button>
            <button
              className={`meme-tab ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              📋 Templates
            </button>
            {activeTab === 'reddit' && (
              <button
                className="meme-refresh-btn"
                onClick={refetchReddit}
                disabled={redditLoading}
                title="Refresh Reddit memes"
              >
                🔄
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="meme-search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'reddit' ? 'Search Reddit posts...' : 'Search templates...'}
              className="meme-search-input"
            />
          </div>

          {isLoading && (
            <div className="meme-loading">
              {activeTab === 'reddit' ? 'Loading hot Reddit memes...' : 'Loading templates...'}
            </div>
          )}

          {error && (
            <div className="meme-error">
              Failed to load memes. Check your connection.
            </div>
          )}

          {!isLoading && !error && (
            <div className="imgflip-grid">
              {filteredMemes.length === 0 ? (
                <div className="meme-no-results">
                  No memes found for "{searchQuery}"
                </div>
              ) : (
                filteredMemes.map((meme) => (
                  <div
                    key={meme.id}
                    className="imgflip-item"
                    onClick={() => handleMemeClick(meme)}
                    title={meme.name || meme.title}
                  >
                    <img
                      src={meme.thumbnail || meme.url}
                      alt={meme.name || meme.title}
                      className="imgflip-thumb"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <span className="imgflip-name">{meme.name || meme.title}</span>
                    {activeTab === 'reddit' && (
                      <span className="meme-score">⬆️ {meme.score?.toLocaleString()}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="meme-editor">
          {/* Live preview canvas - click to position text */}
          <div
            ref={previewContainerRef}
            className="meme-preview-large"
            onMouseDown={handlePreviewMouseDown}
            onMouseMove={handlePreviewMouseMove}
            onMouseUp={handlePreviewMouseUp}
            onMouseLeave={handlePreviewMouseUp}
          >
            <canvas
              ref={previewCanvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="meme-preview-canvas"
            />
            {/* Position indicators */}
            {textItems.map((item) => (
              <div
                key={item.id}
                className={`text-position-marker ${item.id === activeTextId ? 'active' : ''}`}
                style={{
                  left: `${item.x * 100}%`,
                  top: `${item.y * 100}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveTextId(item.id)
                }}
              >
                {item.id}
              </div>
            ))}
          </div>

          <div className="meme-position-hint">
            Click and drag on preview to position text #{activeTextId}
          </div>

          <div className="meme-name-display">{selectedMeme.name || selectedMeme.title}</div>

          {/* Text items list */}
          <div className="meme-text-list">
            {textItems.map((item, index) => (
              <div
                key={item.id}
                className={`meme-text-item ${item.id === activeTextId ? 'active' : ''}`}
                onClick={() => setActiveTextId(item.id)}
              >
                <div className="meme-text-item-header">
                  <span className="text-item-label">Text {index + 1}</span>
                  {textItems.length > 1 && (
                    <button
                      className="text-item-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTextItem(item.id)
                      }}
                      title="Remove text"
                    >
                      X
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleTextChange(item.id, e.target.value)}
                  placeholder={index === 0 ? 'Top text...' : index === 1 ? 'Bottom text...' : 'Text...'}
                  maxLength={100}
                  className="meme-text-input-field"
                />
              </div>
            ))}

            <button className="add-text-btn" onClick={addTextItem}>
              + Add Text
            </button>
          </div>

          {createError && (
            <div className="meme-create-error">{createError}</div>
          )}

          <div className="meme-buttons">
            <button onClick={handleBack} disabled={isCreating}>
              Back
            </button>
            <button
              onClick={handleCreate}
              className="create-btn"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Add to Canvas'}
            </button>
          </div>
        </div>
      )}

      <div className="meme-credit">
        {activeTab === 'reddit' ? (
          <>Memes from <a href="https://reddit.com/r/memes" target="_blank" rel="noopener noreferrer">r/memes</a> & <a href="https://reddit.com/r/MemeEconomy" target="_blank" rel="noopener noreferrer">r/MemeEconomy</a></>
        ) : (
          <>Templates from <a href="https://imgflip.com" target="_blank" rel="noopener noreferrer">Imgflip</a></>
        )}
      </div>
    </div>
  )
}
