import { useState, useCallback, useEffect, useRef } from 'react'
import useObjectCanvas, { CANVAS_WIDTH, CANVAS_HEIGHT, OBJECT_TYPES } from '../../hooks/useObjectCanvas'
import useVideoPlayback from '../../hooks/useVideoPlayback'
import useVideoExport from '../../hooks/useVideoExport'
import useTemplateSubmission from '../../hooks/useTemplateSubmission'
import useBackgroundRemoval from '../../hooks/useBackgroundRemoval'
import { reloadCustomTemplates } from '../../config/memeTemplates'
import ObjectCanvas from './ObjectCanvas'
import LeftToolbar from './LeftToolbar'
import PropertiesPanel from './PropertiesPanel'
import MobilePropertiesSheet from './MobilePropertiesSheet'
import VideoTimeline from './VideoTimeline'
import VideoExportModal from './VideoExportModal'
import SubmitTemplateModal from '../Editor/SubmitTemplateModal'
import './MemeStudio.css'

export default function MemeStudio({ onMint, isDesktopMode, coinContext = null, onCoinContextUsed = null, stickerContext = null, onStickerContextUsed = null, onClose = null }) {
  const {
    objects,
    selectedId,
    backgroundColor,
    canUndo,
    canRedo,
    hasVideo,
    addImage,
    addText,
    addSticker,
    addVideo,
    updateObject,
    updateObjectWithHistory,
    deleteSelected,
    duplicateSelected,
    nudgeSelected,
    bringForward,
    sendBackward,
    selectObject,
    clearSelection,
    getSelectedObject,
    getVideoObject,
    clearAll,
    setBackgroundColor,
    drawingLayerRef,
    undo,
    redo,
  } = useObjectCanvas()

  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingColor, setDrawingColor] = useState('#000000')
  const [clearDrawingSignal, setClearDrawingSignal] = useState(0)
  const [isCropMode, setIsCropMode] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showMobileSheet, setShowMobileSheet] = useState(false)

  // Template submission
  const { submitTemplate } = useTemplateSubmission()
  const [capturedCanvasBlob, setCapturedCanvasBlob] = useState(null)
  const [capturedCanvasPreview, setCapturedCanvasPreview] = useState(null)

  // Video playback
  const videoObject = getVideoObject()
  const videoPlayback = useVideoPlayback(videoObject)
  const videoRefs = useRef({})

  // Video export
  const videoExport = useVideoExport()

  // Background removal
  const { removeImageBackground, isProcessing: isRemovingBackground, progress: removeBackgroundProgress } = useBackgroundRemoval()

  // Callback for when video element is ready
  const handleVideoElementReady = useCallback((videoEl) => {
    videoPlayback.registerVideo(videoEl)
  }, [videoPlayback])

  // Calculate initial zoom based on screen size
  const getInitialZoom = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Mobile: fit canvas with 10px margin on each side
      // Canvas container width = CANVAS_WIDTH * zoom + 30 (handlePadding 15px * 2)
      // Available width = screenWidth - 20 (10px margin each side)
      // So: CANVAS_WIDTH * zoom + 30 = screenWidth - 20
      // zoom = (screenWidth - 50) / CANVAS_WIDTH
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const sideMargin = 20 // 10px each side
      const canvasHandlePadding = 30 // ObjectCanvas adds 15px padding each side
      const toolbarHeight = 70 // Bottom toolbar + safe area
      const topMargin = 10

      const maxWidth = screenWidth - sideMargin - canvasHandlePadding
      const maxHeight = screenHeight - toolbarHeight - topMargin - canvasHandlePadding

      const widthZoom = maxWidth / CANVAS_WIDTH
      const heightZoom = maxHeight / CANVAS_HEIGHT
      return Math.min(widthZoom, heightZoom)
    }
    return 0.48
  }

  const [zoom, setZoom] = useState(getInitialZoom)

  // Exit crop mode when selection changes
  useEffect(() => {
    setIsCropMode(false)
  }, [selectedId])

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(1.5, z + 0.1))
  const zoomOut = () => setZoom(z => Math.max(0.25, z - 0.1))
  const zoomFit = () => setZoom(getInitialZoom())

  // Update zoom on orientation change / resize for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setZoom(getInitialZoom())
      }
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // Pre-load coin image when coinContext is provided
  useEffect(() => {
    if (coinContext?.image_uri) {
      // Load the coin image (without crossOrigin to avoid CORS issues with DexScreener CDN)
      const img = new Image()
      img.onload = () => {
        const aspectRatio = img.width / img.height
        // If image is high-res (512px+), let it fill canvas; otherwise cap at 450px for usable meme size
        const isHighRes = img.width >= 512 && img.height >= 512
        addImage({
          image: coinContext.image_uri,
          aspectRatio,
          name: `${coinContext.symbol || 'Coin'} coin`,
          maxSize: isHighRes ? undefined : 450,
        })
        // Clear the coin context after use
        onCoinContextUsed?.()
      }
      img.onerror = () => {
        console.error('Failed to load coin image:', coinContext.image_uri)
        // Still try to add the image with a default aspect ratio
        addImage({
          image: coinContext.image_uri,
          aspectRatio: 1,
          name: `${coinContext.symbol || 'Coin'} coin`,
          maxSize: 450,
        })
        onCoinContextUsed?.()
      }
      img.src = coinContext.image_uri
    }
  }, [coinContext, addImage, onCoinContextUsed])

  // Add sticker when stickerContext is provided (from CoinExplorer "Use as Sticker")
  useEffect(() => {
    if (stickerContext?.image) {
      addSticker({
        image: stickerContext.image,
        aspectRatio: stickerContext.aspectRatio || 1,
        name: stickerContext.name || 'Token sticker',
      })
      onStickerContextUsed?.()
    }
  }, [stickerContext, addSticker, onStickerContextUsed])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Spacebar for play/pause video
      if (e.key === ' ' && hasVideo) {
        e.preventDefault()
        videoPlayback.togglePlayPause()
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        deleteSelected()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        duplicateSelected()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedId) {
        e.preventDefault()
        const amount = e.shiftKey ? 10 : 1
        switch (e.key) {
          case 'ArrowUp': nudgeSelected(0, -amount); break
          case 'ArrowDown': nudgeSelected(0, amount); break
          case 'ArrowLeft': nudgeSelected(-amount, 0); break
          case 'ArrowRight': nudgeSelected(amount, 0); break
        }
      }

      if (e.key === 'Escape') {
        if (isDrawingMode) {
          setIsDrawingMode(false)
        } else {
          clearSelection()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, deleteSelected, duplicateSelected, nudgeSelected, undo, redo, isDrawingMode, clearSelection, hasVideo, videoPlayback])

  const handleDrawingUpdate = useCallback((imageData) => {
    drawingLayerRef.current = imageData
  }, [drawingLayerRef])

  const drawWatermark = useCallback((ctx, canvasWidth, canvasHeight) => {
    const text = 'shitpost.pro'
    const fontSize = Math.round(canvasHeight * 0.03)
    const padding = Math.round(canvasWidth * 0.02)

    ctx.save()
    ctx.font = `italic bold ${fontSize}px "Inter", sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'

    const x = canvasWidth - padding
    const y = canvasHeight - padding

    ctx.globalAlpha = 0.5
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)

    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(text, x, y)

    ctx.restore()
  }, [])

  const handleClearDrawing = useCallback(() => {
    drawingLayerRef.current = null
    setClearDrawingSignal(prev => prev + 1)
  }, [drawingLayerRef])

  // Helper to render all objects to a canvas context
  const renderObjectsToCanvas = useCallback(async (ctx, videoElement = null, currentTime = 0, includeWatermark = true) => {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const imagePromises = objects
      .filter(obj => obj.type === OBJECT_TYPES.IMAGE)
      .map(obj => {
        return new Promise((imgResolve) => {
          const img = new Image()
          // Only use crossOrigin for local/data URLs to avoid CORS issues with external images
          const isExternalImage = obj.src.startsWith('http') && !obj.src.includes(window.location.host)
          if (!isExternalImage) {
            img.crossOrigin = 'anonymous'
          }
          img.onload = () => imgResolve({ obj, img })
          img.onerror = () => imgResolve({ obj, img: null })
          img.src = obj.src
        })
      })

    const loadedImages = await Promise.all(imagePromises)

    for (const obj of objects) {
      ctx.save()

      // Check visibility for video overlays
      if (hasVideo && (obj.type === OBJECT_TYPES.TEXT || obj.type === OBJECT_TYPES.STICKER)) {
        const showFrom = obj.showFrom ?? 0
        const showUntil = obj.showUntil ?? (videoObject?.duration ?? Infinity)
        if (currentTime < showFrom || currentTime > showUntil) {
          ctx.restore()
          continue
        }
      }

      const cx = obj.x + obj.width / 2
      const cy = obj.y + obj.height / 2
      ctx.translate(cx, cy)
      ctx.rotate((obj.rotation || 0) * Math.PI / 180)
      ctx.translate(-cx, -cy)

      if (obj.type === OBJECT_TYPES.VIDEO && videoElement) {
        ctx.globalAlpha = obj.opacity ?? 1
        ctx.drawImage(videoElement, obj.x, obj.y, obj.width, obj.height)
        ctx.globalAlpha = 1
      } else if (obj.type === OBJECT_TYPES.IMAGE) {
        const loaded = loadedImages.find(l => l.obj.id === obj.id)
        if (loaded?.img) {
          ctx.globalAlpha = obj.opacity ?? 1

          const cropTop = obj.cropTop ?? 0
          const cropBottom = obj.cropBottom ?? 0
          const cropLeft = obj.cropLeft ?? 0
          const cropRight = obj.cropRight ?? 0

          const visibleLeft = obj.width * cropLeft
          const visibleTop = obj.height * cropTop
          const visibleWidth = obj.width * (1 - cropLeft - cropRight)
          const visibleHeight = obj.height * (1 - cropTop - cropBottom)

          if (visibleWidth > 0 && visibleHeight > 0) {
            ctx.save()
            ctx.beginPath()
            ctx.rect(obj.x + visibleLeft, obj.y + visibleTop, visibleWidth, visibleHeight)
            ctx.clip()
            ctx.drawImage(loaded.img, 0, 0, loaded.img.naturalWidth, loaded.img.naturalHeight, obj.x, obj.y, obj.width, obj.height)
            ctx.restore()
          }

          ctx.globalAlpha = 1
        }
      } else if (obj.type === OBJECT_TYPES.TEXT) {
        ctx.font = `bold ${obj.fontSize}px ${obj.fontFamily}`
        ctx.textAlign = obj.align || 'center'
        ctx.textBaseline = 'middle'

        const textX = obj.x + obj.width / 2
        const textY = obj.y + obj.height / 2

        if (obj.strokeWidth > 0) {
          ctx.strokeStyle = obj.strokeColor
          ctx.lineWidth = obj.strokeWidth
          ctx.lineJoin = 'round'
          ctx.strokeText(obj.text, textX, textY)
        }

        ctx.fillStyle = obj.color
        ctx.fillText(obj.text, textX, textY)
      } else if (obj.type === OBJECT_TYPES.STICKER && obj.sticker?.data) {
        const stickerData = obj.sticker.data
        const stickerSize = stickerData.length
        const pixelW = obj.width / stickerSize
        const pixelH = obj.height / stickerSize

        for (let sy = 0; sy < stickerSize; sy++) {
          for (let sx = 0; sx < stickerSize; sx++) {
            const color = stickerData[sy][sx]
            if (color) {
              ctx.fillStyle = color
              ctx.fillRect(obj.x + sx * pixelW, obj.y + sy * pixelH, Math.ceil(pixelW), Math.ceil(pixelH))
            }
          }
        }
      }

      ctx.restore()
    }

    if (drawingLayerRef.current) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = CANVAS_WIDTH
      tempCanvas.height = CANVAS_HEIGHT
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.putImageData(drawingLayerRef.current, 0, 0)
      ctx.drawImage(tempCanvas, 0, 0)
    }

    if (includeWatermark) {
      drawWatermark(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
  }, [objects, backgroundColor, drawingLayerRef, drawWatermark, hasVideo, videoObject])

  const handleExport = useCallback(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')

    const videoEl = videoObject ? videoRefs.current[videoObject.id] : null
    await renderObjectsToCanvas(ctx, videoEl, videoPlayback.currentTime)

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `shitpost-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [renderObjectsToCanvas, videoObject, videoPlayback.currentTime])

  const handleExportVideo = useCallback(async (options) => {
    if (!videoObject) return

    const videoEl = videoRefs.current[videoObject.id]
    if (!videoEl) return

    const trimStart = videoObject.trimStart
    const trimEnd = videoObject.trimEnd

    videoPlayback.pause()

    const renderFrame = async (ctx, time) => {
      await renderObjectsToCanvas(ctx, videoEl, time)
    }

    try {
      let blob
      if (options.format === 'gif') {
        blob = await videoExport.exportGIF({
          videoElement: videoEl,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          trimStart,
          trimEnd,
          fps: options.fps,
          renderFrame,
          scale: options.scale,
        })
        videoExport.download(blob, `shitpost-${Date.now()}.gif`)
      } else {
        blob = await videoExport.exportMP4({
          videoElement: videoEl,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          trimStart,
          trimEnd,
          fps: options.fps,
          renderFrame,
          includeAudio: options.includeAudio !== false,
        })
        videoExport.download(blob, `shitpost-${Date.now()}.webm`)
      }

      setShowExportModal(false)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [videoObject, videoPlayback, renderObjectsToCanvas, videoExport])

  const handleMint = useCallback(async () => {
    if (!onMint) return

    try {
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
      const ctx = canvas.getContext('2d')

      const videoEl = videoObject ? videoRefs.current[videoObject.id] : null
      await renderObjectsToCanvas(ctx, videoEl, videoPlayback.currentTime, false)

      const dataUrl = canvas.toDataURL('image/png')
      onMint(dataUrl)
    } catch (err) {
      console.error('[MemeStudio] Mint error:', err)
    }
  }, [renderObjectsToCanvas, videoObject, videoPlayback.currentTime, onMint])

  const handleCopyToClipboard = useCallback(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')

    const videoEl = videoObject ? videoRefs.current[videoObject.id] : null
    await renderObjectsToCanvas(ctx, videoEl, videoPlayback.currentTime)

    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        // Brief visual feedback could be added here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
        // Fallback: download instead
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `shitpost-${Date.now()}.png`
        link.href = dataUrl
        link.click()
      }
    }, 'image/png')
  }, [renderObjectsToCanvas, videoObject, videoPlayback.currentTime])

  const handleOpenSubmitModal = useCallback(async () => {
    // Capture current canvas state
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')

    const videoEl = videoObject ? videoRefs.current[videoObject.id] : null
    await renderObjectsToCanvas(ctx, videoEl, videoPlayback.currentTime, false) // No watermark for templates

    // Convert to blob
    canvas.toBlob((blob) => {
      setCapturedCanvasBlob(blob)
      setCapturedCanvasPreview(canvas.toDataURL('image/png'))
      setShowSubmitModal(true)
    }, 'image/png')
  }, [renderObjectsToCanvas, videoObject, videoPlayback.currentTime])

  const handleSubmitTemplate = async (data) => {
    const result = await submitTemplate(data)
    await reloadCustomTemplates()
    setCapturedCanvasBlob(null)
    setCapturedCanvasPreview(null)
    return result
  }

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false)
    setCapturedCanvasBlob(null)
    setCapturedCanvasPreview(null)
  }

  // Handle background removal for an image
  const handleRemoveBackground = useCallback(async (imageObject) => {
    if (!imageObject || imageObject.type !== 'image') return

    try {
      const resultDataUrl = await removeImageBackground(imageObject.src)
      updateObject(imageObject.id, { src: resultDataUrl })
    } catch (err) {
      console.error('Background removal failed:', err)
    }
  }, [removeImageBackground, updateObject])

  const selectedObject = getSelectedObject()

  const overlayObjects = objects.filter(obj =>
    obj.type === OBJECT_TYPES.TEXT || obj.type === OBJECT_TYPES.STICKER
  )

  return (
    <div className={`meme-studio ${isDesktopMode ? 'desktop-mode' : ''} ${hasVideo ? 'has-video' : ''}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <button className="top-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            ↩️ Undo
          </button>
          <button className="top-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
            ↪️ Redo
          </button>
          <div className="top-divider" />
          <button
            className="top-btn danger"
            onClick={() => {
              if (window.confirm('Clear everything?')) {
                clearAll()
                handleClearDrawing()
              }
            }}
            title="Clear All"
          >
            🗑️ Clear All
          </button>
        </div>
        <div className="top-bar-right" data-onboarding="export-buttons">
          <button className="top-btn submit" onClick={handleOpenSubmitModal} title="Submit canvas as template">
            ⬆️ Submit
          </button>
          <button className="top-btn submit" onClick={handleCopyToClipboard} title="Copy to clipboard">
            📋 Copy
          </button>
          <button
            className="top-btn export"
            onClick={hasVideo ? () => setShowExportModal(true) : handleExport}
            title={hasVideo ? "Export Video" : "Export as PNG"}
          >
            💾 Export
          </button>
          {onMint && (
            <button className="top-btn mint" onClick={handleMint} title="Mint as NFT">
              💎 Mint NFT
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="studio-main">
        <LeftToolbar
          onAddImage={addImage}
          onAddText={addText}
          onAddSticker={addSticker}
          onAddVideo={addVideo}
          isDrawingMode={isDrawingMode}
          onToggleDrawingMode={() => setIsDrawingMode(!isDrawingMode)}
          drawingColor={drawingColor}
          onDrawingColorChange={setDrawingColor}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={setBackgroundColor}
          onExport={handleExport}
          onExportVideo={hasVideo ? () => setShowExportModal(true) : null}
          onMint={onMint ? handleMint : null}
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomFit={zoomFit}
          hasVideo={hasVideo}
          selectedId={selectedId}
          onDeleteSelected={deleteSelected}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onClose={onClose}
          onSubmit={handleOpenSubmitModal}
        />

        <div className="canvas-area-container" data-onboarding="canvas-area">
          <div className="canvas-wrapper" onClick={(e) => {
            if (e.target === e.currentTarget) {
              clearSelection()
            }
          }}>
            <ObjectCanvas
              objects={objects}
              selectedId={selectedId}
              backgroundColor={backgroundColor}
              drawingLayerRef={drawingLayerRef}
              onSelectObject={selectObject}
              onUpdateObject={updateObject}
              onUpdateObjectWithHistory={updateObjectWithHistory}
              onClearSelection={clearSelection}
              isDrawingMode={isDrawingMode}
              drawingColor={drawingColor}
              onDrawingUpdate={handleDrawingUpdate}
              clearDrawingSignal={clearDrawingSignal}
              zoom={zoom}
              isCropMode={isCropMode}
              onExitCropMode={() => setIsCropMode(false)}
              videoCurrentTime={videoPlayback.currentTime}
              isPlaying={videoPlayback.isPlaying}
              isMuted={videoPlayback.isMuted}
              videoRefs={videoRefs}
              onVideoElementReady={handleVideoElementReady}
            />
          </div>

          {hasVideo && videoObject && (
            <VideoTimeline
              isPlaying={videoPlayback.isPlaying}
              currentTime={videoPlayback.currentTime}
              duration={videoObject.duration}
              trimStart={videoObject.trimStart}
              trimEnd={videoObject.trimEnd}
              playbackRate={videoObject.playbackRate}
              isMuted={videoPlayback.isMuted}
              onPlay={videoPlayback.play}
              onPause={videoPlayback.pause}
              onSeek={videoPlayback.seek}
              onPlaybackRateChange={(rate) => updateObject(videoObject.id, { playbackRate: rate })}
              onToggleMute={videoPlayback.toggleMute}
              onTrimStartChange={(time) => updateObject(videoObject.id, { trimStart: time })}
              onTrimEndChange={(time) => updateObject(videoObject.id, { trimEnd: time })}
              overlayObjects={overlayObjects}
              selectedOverlayId={selectedId}
              onSelectOverlay={selectObject}
              onOverlayTimingChange={(id, updates) => updateObject(id, updates)}
            />
          )}
        </div>

        <PropertiesPanel
          selectedObject={selectedObject}
          onUpdateObject={updateObject}
          onDeleteObject={deleteSelected}
          onDuplicate={duplicateSelected}
          onBringForward={() => selectedId && bringForward(selectedId)}
          onSendBackward={() => selectedId && sendBackward(selectedId)}
          onClearDrawing={handleClearDrawing}
          isDrawingMode={isDrawingMode}
          isCropMode={isCropMode}
          onToggleCropMode={() => setIsCropMode(!isCropMode)}
          hasVideo={hasVideo}
          videoDuration={videoObject?.duration}
          onRemoveBackground={handleRemoveBackground}
          isRemovingBackground={isRemovingBackground}
          removeBackgroundProgress={removeBackgroundProgress}
        />
      </div>

      <VideoExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportVideo}
        isLoading={videoExport.isLoading}
        isExporting={videoExport.isExporting}
        progress={videoExport.progress}
        error={videoExport.error}
        duration={videoObject ? videoObject.trimEnd - videoObject.trimStart : 0}
      />

      <SubmitTemplateModal
        isOpen={showSubmitModal}
        onClose={handleCloseSubmitModal}
        onSubmit={handleSubmitTemplate}
        capturedImage={capturedCanvasBlob}
        capturedPreview={capturedCanvasPreview}
      />

      {/* Mobile floating edit button */}
      {selectedObject && (
        <button
          className="mobile-edit-fab"
          onClick={() => setShowMobileSheet(true)}
        >
          Edit
        </button>
      )}

      {/* Mobile properties sheet */}
      <MobilePropertiesSheet
        isOpen={showMobileSheet}
        onClose={() => setShowMobileSheet(false)}
        selectedObject={selectedObject}
        onUpdateObject={updateObject}
        onDeleteObject={deleteSelected}
        onDuplicate={duplicateSelected}
        onBringForward={() => selectedId && bringForward(selectedId)}
        onSendBackward={() => selectedId && sendBackward(selectedId)}
        hasVideo={hasVideo}
        videoDuration={videoObject?.duration}
        onRemoveBackground={handleRemoveBackground}
        isRemovingBackground={isRemovingBackground}
        removeBackgroundProgress={removeBackgroundProgress}
      />
    </div>
  )
}
