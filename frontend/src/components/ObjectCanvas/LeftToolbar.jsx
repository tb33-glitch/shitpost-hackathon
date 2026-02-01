import { useState, useRef, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { MemeTemplatePicker } from '../Editor'
import StickerPicker from '../Canvas/StickerPicker'
import VideoLibrary from './VideoLibrary'
import { ConnectModal } from '../Wallet'
import './LeftToolbar.css'

const BACKGROUND_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#FFA500',
]

export default function LeftToolbar({
  onAddImage,
  onAddText,
  onAddSticker,
  onAddVideo,
  isDrawingMode,
  onToggleDrawingMode,
  drawingColor,
  onDrawingColorChange,
  backgroundColor,
  onBackgroundColorChange,
  onExport,
  onExportVideo,
  onMint,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  hasVideo,
  selectedId,
  onDeleteSelected,
  // Undo/Redo for mobile
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  // Close/minimize for mobile
  onClose,
  // Submit template
  onSubmit,
  // Watermark control
  showWatermark,
  onToggleWatermark,
  hasTokenAccess,
  tokenBalance,
  minTokensRequired,
}) {
  const [showTemplates, setShowTemplates] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showBgColors, setShowBgColors] = useState(false)
  const [showDrawColors, setShowDrawColors] = useState(false)
  const [showVideoLibrary, setShowVideoLibrary] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)

  // Wallet state
  const { publicKey, connected } = useWallet()
  const address = publicKey?.toString()
  const isWalletConnected = connected
  const walletDisplayAddress = connected
    ? `${address?.slice(0, 4)}..`
    : null

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target.result

      // Load image to get dimensions
      const img = new Image()
      img.onload = () => {
        const aspectRatio = img.width / img.height
        onAddImage({
          image: dataUrl,
          aspectRatio,
          name: file.name,
        })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be uploaded again
    e.target.value = ''
  }

  // Handle video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's a video
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file')
      return
    }

    const url = URL.createObjectURL(file)

    // Load video to get duration and dimensions
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = video.duration
      const aspectRatio = video.videoWidth / video.videoHeight
      onAddVideo(url, duration, aspectRatio)
    }
    video.onerror = () => {
      alert('Failed to load video')
      URL.revokeObjectURL(url)
    }
    video.src = url

    // Reset input
    e.target.value = ''
  }

  const closeAllPickers = () => {
    setShowTemplates(false)
    setShowStickers(false)
    setShowBgColors(false)
    setShowDrawColors(false)
    setShowVideoLibrary(false)
  }

  // Handle video selection from library
  const handleVideoFromLibrary = useCallback((url, videoData) => {
    // Load video to get duration and dimensions
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = video.duration
      const aspectRatio = video.videoWidth / video.videoHeight
      onAddVideo(url, duration, aspectRatio, videoData.name)
    }
    video.onerror = () => {
      alert('Failed to load video from library')
      URL.revokeObjectURL(url)
    }
    video.src = url
  }, [onAddVideo])

  const handleTemplateSelect = (template) => {
    // Check if template is a video
    if (template.isVideo || template.mediaType === 'video') {
      // Load video to get duration and dimensions
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.crossOrigin = 'anonymous'
      video.onloadedmetadata = () => {
        const duration = video.duration
        const aspectRatio = video.videoWidth / video.videoHeight
        onAddVideo(template.image, duration, aspectRatio, template.name)
      }
      video.onerror = () => {
        alert('Failed to load video template')
      }
      video.src = template.image
    } else {
      onAddImage(template)
    }
    setShowTemplates(false)
  }

  const handleStickerSelect = (sticker) => {
    onAddSticker(sticker)
    setShowStickers(false)
  }

  return (
    <div className="left-toolbar">
      {/* Mobile close button */}
      {onClose && (
        <button
          className="tool-btn mobile-close-btn"
          onClick={onClose}
          data-tooltip="Close"
        >
          <span className="tool-icon">✕</span>
        </button>
      )}

      <div className="toolbar-section section-add" data-onboarding="template-picker">
        <div className="section-label">Add</div>

        {/* Upload Image */}
        <button
          className="tool-btn"
          onClick={() => {
            closeAllPickers()
            fileInputRef.current?.click()
          }}
          data-tooltip="Upload"
        >
          <span className="tool-icon">📤</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Add Template */}
        <button
          className="tool-btn"
          onClick={() => {
            closeAllPickers()
            setShowTemplates(!showTemplates)
          }}
          data-tooltip="Template"
        >
          <span className="tool-icon">🖼️</span>
        </button>

        {/* Add Text */}
        <button
          className="tool-btn"
          onClick={() => {
            closeAllPickers()
            onAddText()
          }}
          data-tooltip="Text"
        >
          <span className="tool-icon">T</span>
        </button>

        {/* Add Sticker */}
        <button
          className="tool-btn"
          onClick={() => {
            closeAllPickers()
            setShowStickers(!showStickers)
          }}
          data-tooltip="Sticker"
        >
          <span className="tool-icon">⭐</span>
        </button>

        {/* Upload Video - hidden on mobile */}
        {onAddVideo && (
          <>
            <button
              className="tool-btn video-btn"
              onClick={() => {
                closeAllPickers()
                videoInputRef.current?.click()
              }}
              data-tooltip="Upload Video"
            >
              <span className="tool-icon">🎥</span>
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
            />
            {/* Video Library - hidden on mobile */}
            <button
              className="tool-btn video-btn"
              onClick={() => {
                closeAllPickers()
                setShowVideoLibrary(!showVideoLibrary)
              }}
              data-tooltip="Video Library"
            >
              <span className="tool-icon">📚</span>
            </button>
          </>
        )}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section section-tools" data-onboarding="toolbar">
        <div className="section-label">Tools</div>

        {/* Draw Mode */}
        <button
          className={`tool-btn ${isDrawingMode ? 'active' : ''}`}
          onClick={() => {
            closeAllPickers()
            if (!isDrawingMode) {
              setShowDrawColors(true)
            } else {
              setShowDrawColors(false)
            }
            onToggleDrawingMode()
          }}
          data-tooltip="Draw"
        >
          <span className="tool-icon">✏️</span>
        </button>

        {/* Drawing color indicator */}
        {isDrawingMode && (
          <button
            className="color-indicator-btn"
            onClick={() => setShowDrawColors(!showDrawColors)}
            title="Drawing Color"
          >
            <span
              className="color-indicator"
              style={{ backgroundColor: drawingColor }}
            />
          </button>
        )}

        {/* Delete Selected */}
        <button
          className={`tool-btn ${!selectedId ? 'disabled' : ''}`}
          onClick={() => {
            closeAllPickers()
            if (selectedId && onDeleteSelected) {
              onDeleteSelected()
            }
          }}
          disabled={!selectedId}
          data-tooltip="Delete"
        >
          <span className="tool-icon">🗑️</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section section-canvas">
        <div className="section-label">Canvas</div>

        {/* Background Color */}
        <button
          className="tool-btn"
          onClick={() => {
            closeAllPickers()
            setShowBgColors(!showBgColors)
          }}
          data-tooltip="Background"
        >
          <span
            className="tool-icon color-preview"
            style={{ backgroundColor: backgroundColor }}
          />
        </button>

        {/* Zoom Controls */}
        <button
          className="tool-btn"
          onClick={onZoomIn}
          data-tooltip="Zoom In"
        >
          <span className="tool-icon">🔍+</span>
        </button>
        <button
          className="tool-btn"
          onClick={onZoomOut}
          data-tooltip="Zoom Out"
        >
          <span className="tool-icon">🔍−</span>
        </button>
        <button
          className="tool-btn"
          onClick={onZoomFit}
          data-tooltip="Fit"
        >
          <span className="tool-icon">⊡</span>
        </button>
      </div>

      {/* Popups */}
      {showTemplates && (
        <div className="toolbar-popup">
          <MemeTemplatePicker
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}

      {showStickers && (
        <div className="toolbar-popup sticker-popup">
          <StickerPicker
            onSelectSticker={handleStickerSelect}
            onClose={() => setShowStickers(false)}
          />
        </div>
      )}

      {showVideoLibrary && (
        <div className="toolbar-popup video-library-popup">
          <VideoLibrary
            onSelectVideo={handleVideoFromLibrary}
            onClose={() => setShowVideoLibrary(false)}
          />
        </div>
      )}

      {showBgColors && (
        <div className="color-picker-popup">
          <div className="color-picker-header">Background Color</div>
          <div className="color-grid">
            {BACKGROUND_COLORS.map(color => (
              <button
                key={color}
                className={`color-option ${backgroundColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onBackgroundColorChange(color)
                  setShowBgColors(false)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showDrawColors && isDrawingMode && (
        <div className="color-picker-popup draw-colors">
          <div className="color-picker-header">Drawing Color</div>
          <div className="color-grid">
            {BACKGROUND_COLORS.map(color => (
              <button
                key={color}
                className={`color-option ${drawingColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onDrawingColorChange(color)
                  setShowDrawColors(false)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mobile action buttons */}
      <div className="mobile-actions">
        {/* Undo/Redo for mobile */}
        {onUndo && (
          <button
            className={`tool-btn undo-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={() => {
              closeAllPickers()
              onUndo()
            }}
            disabled={!canUndo}
            data-tooltip="Undo"
          >
            <span className="tool-icon">↩️</span>
          </button>
        )}
        {onRedo && (
          <button
            className={`tool-btn redo-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={() => {
              closeAllPickers()
              onRedo()
            }}
            disabled={!canRedo}
            data-tooltip="Redo"
          >
            <span className="tool-icon">↪️</span>
          </button>
        )}
        <div className="mobile-divider" />
        {onSubmit && (
          <button
            className="tool-btn submit-btn"
            onClick={() => {
              closeAllPickers()
              onSubmit()
            }}
            data-tooltip="Submit"
          >
            <span className="tool-icon">⬆️</span>
          </button>
        )}
        {/* Watermark toggle - only shown if token gating is available */}
        {onToggleWatermark && (
          <button
            className={`tool-btn watermark-btn ${!showWatermark && hasTokenAccess ? 'active' : ''} ${!hasTokenAccess ? 'locked' : ''}`}
            onClick={() => {
              closeAllPickers()
              if (hasTokenAccess) {
                onToggleWatermark()
              } else {
                alert(`Hold ${minTokensRequired?.toLocaleString() || '1,000'}+ $SHITPOST tokens to remove watermark.\n\nYour balance: ${tokenBalance?.toLocaleString() || 0}`)
              }
            }}
            data-tooltip={hasTokenAccess ? (showWatermark ? "Remove Mark" : "Add Mark") : `Hold ${minTokensRequired?.toLocaleString() || '1K'} $SHITPOST`}
          >
            <span className="tool-icon">{showWatermark ? '©' : '✓'}</span>
          </button>
        )}
        {onExport && (
          <button
            className="tool-btn export-btn"
            onClick={() => {
              closeAllPickers()
              onExport()
            }}
            data-tooltip="Save"
          >
            <span className="tool-icon">💾</span>
          </button>
        )}
        {onExportVideo && hasVideo && (
          <button
            className="tool-btn export-btn"
            onClick={() => {
              closeAllPickers()
              onExportVideo()
            }}
            data-tooltip="Video"
          >
            <span className="tool-icon">🎥</span>
          </button>
        )}
        {onMint && (
          <button
            className="tool-btn mint-btn"
            onClick={() => {
              closeAllPickers()
              onMint()
            }}
            data-tooltip="Mint"
          >
            <span className="tool-icon">💎</span>
          </button>
        )}
        {/* Wallet connect button for mobile */}
        <button
          className={`tool-btn wallet-btn ${isWalletConnected ? 'connected' : ''}`}
          onClick={() => {
            closeAllPickers()
            setShowWalletModal(true)
          }}
          data-tooltip={isWalletConnected ? walletDisplayAddress : "Connect"}
        >
          <span className="tool-icon">{isWalletConnected ? '✅' : '💼'}</span>
        </button>
      </div>

      {/* Wallet Connect Modal */}
      <ConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}
