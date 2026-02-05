import { useState, useCallback, useEffect, useRef } from 'react'
import useObjectCanvas, { CANVAS_WIDTH, CANVAS_HEIGHT, OBJECT_TYPES } from '../../hooks/useObjectCanvas'
import useVideoPlayback from '../../hooks/useVideoPlayback'
import useVideoExport from '../../hooks/useVideoExport'
import useTemplateSubmission from '../../hooks/useTemplateSubmission'
import useBackgroundRemoval from '../../hooks/useBackgroundRemoval'
import useTokenGate from '../../hooks/useTokenGate'
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
    addShape,
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
  const [isEyedropperMode, setIsEyedropperMode] = useState(false)
  const [eyedropperTarget, setEyedropperTarget] = useState(null) // 'fill', 'stroke', 'textColor', 'textStroke', 'background', 'drawing'
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const [autoFocusTextInput, setAutoFocusTextInput] = useState(0) // Increment to trigger focus

  // Template submission
  const { submitTemplate, isSubmitting } = useTemplateSubmission()
  const [capturedCanvasBlob, setCapturedCanvasBlob] = useState(null)
  const [capturedCanvasPreview, setCapturedCanvasPreview] = useState(null)
  const [isCapturingCanvas, setIsCapturingCanvas] = useState(false)

  // Video playback
  const videoObject = getVideoObject()
  const videoPlayback = useVideoPlayback(videoObject)
  const videoRefs = useRef({})

  // Ref to hold copy function for keyboard shortcut
  const copyToClipboardRef = useRef(null)

  // Video export
  const videoExport = useVideoExport()

  // Background removal
  const { removeImageBackground, isProcessing: isRemovingBackground, progress: removeBackgroundProgress } = useBackgroundRemoval()

  // Token gate for premium features (watermark removal)
  const { hasAccess: hasTokenAccess, tokenBalance, minRequired: minTokensRequired } = useTokenGate()
  const [showWatermark, setShowWatermark] = useState(true)

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

      // Ctrl+C / Cmd+C - Copy canvas with watermark
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        copyToClipboardRef.current?.()
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

  // Handle double-click on text to edit it
  const handleEditText = useCallback((textId) => {
    selectObject(textId)
    // Increment to trigger the autoFocus effect in PropertiesPanel
    setAutoFocusTextInput(prev => prev + 1)
  }, [selectObject])

  const drawWatermark = useCallback((ctx, canvasWidth, canvasHeight) => {
    // Fine signature style watermark
    const text = 'shitpost.pro'
    const fontSize = Math.round(canvasHeight * 0.022) // Smaller, more subtle
    const padding = Math.round(canvasWidth * 0.015)

    ctx.save()

    // Use a script/handwriting style font with thin weight
    ctx.font = `italic 300 ${fontSize}px "Georgia", "Times New Roman", serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'

    const x = canvasWidth - padding
    const y = canvasHeight - padding

    // Subtle thin stroke for visibility on any background
    ctx.globalAlpha = 0.4
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)

    // Semi-transparent white fill
    ctx.globalAlpha = 0.6
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
          // Always try CORS first for http images (most CDNs/IPFS gateways support it)
          // Data URLs and blob URLs don't need crossOrigin
          const isDataOrBlob = obj.src.startsWith('data:') || obj.src.startsWith('blob:')
          if (!isDataOrBlob) {
            img.crossOrigin = 'anonymous'
          }
          img.onload = () => imgResolve({ obj, img })
          img.onerror = () => {
            // If CORS fails, try loading without crossOrigin (canvas will be tainted but at least renders)
            if (img.crossOrigin) {
              const fallbackImg = new Image()
              fallbackImg.onload = () => imgResolve({ obj, img: fallbackImg, tainted: true })
              fallbackImg.onerror = () => imgResolve({ obj, img: null })
              fallbackImg.src = obj.src
            } else {
              imgResolve({ obj, img: null })
            }
          }
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
        // Draw text with multiline support
        ctx.font = `bold ${obj.fontSize}px "${obj.fontFamily}", sans-serif`
        ctx.textAlign = obj.align || 'center'
        ctx.textBaseline = 'middle'

        const textX = obj.align === 'left' ? obj.x :
                     obj.align === 'right' ? obj.x + obj.width :
                     obj.x + obj.width / 2

        // Split text by newlines for multiline support
        const lines = obj.text.split('\n')
        const lineHeight = obj.fontSize * 1.2
        const totalHeight = lines.length * lineHeight
        const startY = obj.y + obj.height / 2 - totalHeight / 2 + lineHeight / 2

        lines.forEach((line, index) => {
          const lineY = startY + index * lineHeight

          if (obj.strokeWidth > 0) {
            ctx.strokeStyle = obj.strokeColor
            ctx.lineWidth = obj.strokeWidth
            ctx.lineJoin = 'round'
            ctx.strokeText(line, textX, lineY)
          }

          ctx.fillStyle = obj.color
          ctx.fillText(line, textX, lineY)
        })
      } else if (obj.type === OBJECT_TYPES.STICKER && obj.sticker) {
        // Draw sticker (emoji)
        if (obj.sticker.emoji) {
          const fontSize = Math.min(obj.width, obj.height)
          ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(obj.sticker.emoji, obj.x + obj.width / 2, obj.y + obj.height / 2)
        } else if (obj.sticker.data) {
          // Legacy pixel data support
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
      } else if (obj.type === OBJECT_TYPES.SHAPE) {
        // Draw shape (rectangle or circle)
        ctx.globalAlpha = obj.opacity ?? 1

        if (obj.shapeType === 'rectangle') {
          if (obj.fillColor && obj.fillColor !== 'transparent') {
            ctx.fillStyle = obj.fillColor
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
          }
          if (obj.strokeWidth > 0 && obj.strokeColor) {
            ctx.strokeStyle = obj.strokeColor
            ctx.lineWidth = obj.strokeWidth
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
          }
        } else if (obj.shapeType === 'circle') {
          ctx.beginPath()
          ctx.ellipse(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width / 2,
            obj.height / 2,
            0, 0, Math.PI * 2
          )
          if (obj.fillColor && obj.fillColor !== 'transparent') {
            ctx.fillStyle = obj.fillColor
            ctx.fill()
          }
          if (obj.strokeWidth > 0 && obj.strokeColor) {
            ctx.strokeStyle = obj.strokeColor
            ctx.lineWidth = obj.strokeWidth
            ctx.stroke()
          }
        }

        ctx.globalAlpha = 1
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
    try {
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
      const ctx = canvas.getContext('2d')

      const videoEl = videoObject ? videoRefs.current[videoObject.id] : null
      // Respect watermark toggle (only if user has token access can they remove it)
      const includeWatermark = showWatermark || !hasTokenAccess
      await renderObjectsToCanvas(ctx, videoEl, videoPlayback.currentTime, includeWatermark)

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `shitpost-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('[Export] Failed:', err)
    }
  }, [renderObjectsToCanvas, videoObject, videoPlayback.currentTime, showWatermark, hasTokenAccess])

  const handleExportVideo = useCallback(async (options) => {
    if (!videoObject) return

    const videoEl = videoRefs.current[videoObject.id]
    if (!videoEl) return

    const trimStart = videoObject.trimStart
    const trimEnd = videoObject.trimEnd

    videoPlayback.pause()

    // Pre-cache all images before export to avoid async loading during render
    console.log('[VideoExport] Pre-caching images...')
    const imageCache = new Map()
    const imageObjects = objects.filter(obj => obj.type === OBJECT_TYPES.IMAGE)

    await Promise.all(imageObjects.map(obj => {
      return new Promise((resolve) => {
        const img = new Image()
        const isDataOrBlob = obj.src.startsWith('data:') || obj.src.startsWith('blob:')
        if (!isDataOrBlob) {
          img.crossOrigin = 'anonymous'
        }
        img.onload = () => {
          imageCache.set(obj.id, img)
          resolve()
        }
        img.onerror = () => {
          console.warn('[VideoExport] Failed to pre-cache image:', obj.src.substring(0, 50))
          resolve()
        }
        img.src = obj.src
      })
    }))
    console.log('[VideoExport] Pre-cached', imageCache.size, 'images')

    // Respect watermark toggle for video export
    const includeWatermark = showWatermark || !hasTokenAccess

    // Synchronous render function using pre-cached images
    const renderFrame = (ctx, time) => {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      for (const obj of objects) {
        ctx.save()

        // Check visibility for video overlays
        if (obj.type === OBJECT_TYPES.TEXT || obj.type === OBJECT_TYPES.STICKER) {
          const showFrom = obj.showFrom ?? 0
          const showUntil = obj.showUntil ?? (videoObject?.duration ?? Infinity)
          if (time < showFrom || time > showUntil) {
            ctx.restore()
            continue
          }
        }

        const cx = obj.x + obj.width / 2
        const cy = obj.y + obj.height / 2
        ctx.translate(cx, cy)
        ctx.rotate((obj.rotation || 0) * Math.PI / 180)
        ctx.translate(-cx, -cy)

        if (obj.type === OBJECT_TYPES.VIDEO && videoEl) {
          ctx.globalAlpha = obj.opacity ?? 1
          ctx.drawImage(videoEl, obj.x, obj.y, obj.width, obj.height)
          ctx.globalAlpha = 1
        } else if (obj.type === OBJECT_TYPES.IMAGE) {
          const img = imageCache.get(obj.id)
          if (img) {
            ctx.globalAlpha = obj.opacity ?? 1
            ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height)
            ctx.globalAlpha = 1
          }
        } else if (obj.type === OBJECT_TYPES.TEXT) {
          ctx.font = `bold ${obj.fontSize}px "${obj.fontFamily}", sans-serif`
          ctx.textAlign = obj.align || 'center'
          ctx.textBaseline = 'middle'
          const textX = obj.align === 'left' ? obj.x : obj.align === 'right' ? obj.x + obj.width : obj.x + obj.width / 2
          const lines = obj.text.split('\n')
          const lineHeight = obj.fontSize * 1.2
          const totalHeight = lines.length * lineHeight
          const startY = obj.y + obj.height / 2 - totalHeight / 2 + lineHeight / 2
          lines.forEach((line, index) => {
            const lineY = startY + index * lineHeight
            if (obj.strokeWidth > 0) {
              ctx.strokeStyle = obj.strokeColor
              ctx.lineWidth = obj.strokeWidth
              ctx.lineJoin = 'round'
              ctx.strokeText(line, textX, lineY)
            }
            ctx.fillStyle = obj.color
            ctx.fillText(line, textX, lineY)
          })
        } else if (obj.type === OBJECT_TYPES.STICKER && obj.sticker?.emoji) {
          const fontSize = Math.min(obj.width, obj.height)
          ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(obj.sticker.emoji, obj.x + obj.width / 2, obj.y + obj.height / 2)
        }

        ctx.restore()
      }

      // Draw watermark if needed
      if (includeWatermark) {
        ctx.save()
        ctx.globalAlpha = 0.7
        ctx.font = 'bold 24px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.textAlign = 'right'
        ctx.textBaseline = 'bottom'
        const text = 'shitpost.tv'
        ctx.strokeText(text, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20)
        ctx.fillText(text, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20)
        ctx.restore()
      }
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
        videoExport.download(blob, `shitpost-${Date.now()}.mp4`)
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
    try {
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
      const ctx = canvas.getContext('2d')

      const videoEl = videoObject ? videoRefs.current[videoObject.id] : null

      // If there's a video, make sure we're at the right frame
      if (videoEl && videoObject) {
        // Seek to current playback time if needed
        const targetTime = videoPlayback.currentTime
        if (Math.abs(videoEl.currentTime - targetTime) > 0.1) {
          videoEl.currentTime = targetTime
          // Wait for seek to complete
          await new Promise((resolve) => {
            const onSeeked = () => {
              videoEl.removeEventListener('seeked', onSeeked)
              resolve()
            }
            videoEl.addEventListener('seeked', onSeeked)
            // Timeout fallback
            setTimeout(resolve, 500)
          })
        }
      }

      // Always include watermark for copy
      await renderObjectsToCanvas(ctx, videoEl, videoPlayback.currentTime, true)

      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('[Copy] Failed to create blob from canvas')
          return
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          console.log('[Copy] Copied to clipboard successfully')
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
    } catch (err) {
      console.error('[Copy] Failed to render canvas:', err)
    }
  }, [renderObjectsToCanvas, videoObject, videoPlayback.currentTime])

  // Keep ref updated for keyboard shortcut
  useEffect(() => {
    copyToClipboardRef.current = handleCopyToClipboard
  }, [handleCopyToClipboard])

  const handleOpenSubmitModal = useCallback(async () => {
    if (isCapturingCanvas || showSubmitModal) return // Prevent double-clicks

    setIsCapturingCanvas(true)
    try {
      // Capture current canvas state
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
      const ctx = canvas.getContext('2d')

      const videoEl = videoObject ? videoRefs.current[videoObject.id] : null
      await renderObjectsToCanvas(ctx, videoEl, videoPlayback.currentTime, false) // No watermark for templates

      // Convert to blob with promise wrapper for reliability
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png')
      })

      setCapturedCanvasBlob(blob)
      setCapturedCanvasPreview(canvas.toDataURL('image/png'))
      setShowSubmitModal(true)
    } catch (err) {
      console.error('[Submit] Failed to capture canvas:', err)
    } finally {
      setIsCapturingCanvas(false)
    }
  }, [renderObjectsToCanvas, videoObject, videoPlayback.currentTime, isCapturingCanvas, showSubmitModal])

  const handleSubmitTemplate = async (data) => {
    try {
      const result = await submitTemplate(data)
      await reloadCustomTemplates()
      return result
    } finally {
      // Always clear captured data after submission attempt
      setCapturedCanvasBlob(null)
      setCapturedCanvasPreview(null)
    }
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

  // Handle color picked from eyedropper
  const handleColorPicked = useCallback((color) => {
    if (!eyedropperTarget) return

    if (eyedropperTarget === 'fill' && selectedId) {
      updateObject(selectedId, { fillColor: color })
    } else if (eyedropperTarget === 'stroke' && selectedId) {
      updateObject(selectedId, { strokeColor: color })
    } else if (eyedropperTarget === 'textColor' && selectedId) {
      updateObject(selectedId, { color: color })
    } else if (eyedropperTarget === 'textStroke' && selectedId) {
      updateObject(selectedId, { strokeColor: color })
    } else if (eyedropperTarget === 'background') {
      setBackgroundColor(color)
    } else if (eyedropperTarget === 'drawing') {
      setDrawingColor(color)
    }

    // Exit eyedropper mode after picking
    setIsEyedropperMode(false)
    setEyedropperTarget(null)
  }, [eyedropperTarget, selectedId, updateObject, setBackgroundColor])

  // Start eyedropper mode for a specific target
  const startEyedropper = useCallback((target) => {
    setEyedropperTarget(target)
    setIsEyedropperMode(true)
  }, [])

  // Cancel eyedropper mode
  const cancelEyedropper = useCallback(() => {
    setIsEyedropperMode(false)
    setEyedropperTarget(null)
  }, [])

  const selectedObject = getSelectedObject()

  // All non-video objects are overlays (shown on timeline)
  const overlayObjects = objects.filter(obj =>
    obj.type !== OBJECT_TYPES.VIDEO
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
          {/* Watermark toggle - token gated */}
          <button
            className={`top-btn watermark ${!showWatermark && hasTokenAccess ? 'active' : ''} ${!hasTokenAccess ? 'locked' : ''}`}
            onClick={() => {
              if (hasTokenAccess) {
                setShowWatermark(!showWatermark)
              } else {
                alert(`Hold ${minTokensRequired?.toLocaleString() || '1,000'}+ $SHITPOST tokens to remove watermark.\n\nYour balance: ${tokenBalance?.toLocaleString() || 0}`)
              }
            }}
            title={hasTokenAccess ? (showWatermark ? "Remove Watermark" : "Add Watermark") : `Hold ${minTokensRequired?.toLocaleString() || '1,000'} $SHITPOST to unlock`}
          >
            © Watermark
          </button>
          <button
            className="top-btn submit"
            onClick={handleOpenSubmitModal}
            disabled={isCapturingCanvas || isSubmitting}
            title="Submit canvas as template"
          >
            {isCapturingCanvas ? '...' : '⬆️ Submit'}
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
          onAddShape={addShape}
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
          showWatermark={showWatermark}
          onToggleWatermark={() => setShowWatermark(!showWatermark)}
          hasTokenAccess={hasTokenAccess}
          tokenBalance={tokenBalance}
          minTokensRequired={minTokensRequired}
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
              onEditText={handleEditText}
              isEyedropperMode={isEyedropperMode}
              onColorPicked={handleColorPicked}
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
          currentTime={videoPlayback.currentTime}
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
          autoFocusTextInput={autoFocusTextInput}
          isEyedropperMode={isEyedropperMode}
          eyedropperTarget={eyedropperTarget}
          onStartEyedropper={startEyedropper}
          onCancelEyedropper={cancelEyedropper}
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
        currentTime={videoPlayback.currentTime}
        onRemoveBackground={handleRemoveBackground}
        isRemovingBackground={isRemovingBackground}
        removeBackgroundProgress={removeBackgroundProgress}
      />
    </div>
  )
}
