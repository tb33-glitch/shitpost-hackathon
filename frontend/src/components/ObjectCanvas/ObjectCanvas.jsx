import { useRef, useEffect, useState, useCallback } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, OBJECT_TYPES } from '../../hooks/useObjectCanvas'
import { getProxiedMediaUrl } from '../../utils/api'
import { getInterpolatedProperties, hasAnimation, getMotionPathPoints } from '../../hooks/useKeyframeAnimation'
import './ObjectCanvas.css'

export default function ObjectCanvas({
  objects,
  selectedId,
  backgroundColor,
  drawingLayerRef,
  onSelectObject,
  onUpdateObject,
  onUpdateObjectWithHistory,
  onClearSelection,
  // Drawing mode props
  isDrawingMode,
  drawingColor,
  onDrawingUpdate,
  clearDrawingSignal,
  // Zoom
  zoom = 0.5,
  // Crop mode
  isCropMode = false,
  onExitCropMode,
  // Video props
  videoCurrentTime = 0,
  isPlaying = false,
  isMuted = true,
  videoRefs = null,
  onVideoElementReady,
  // Double-click to edit text
  onEditText,
  // Eyedropper mode
  isEyedropperMode = false,
  onColorPicked,
  // Motion path visualization
  showMotionPaths = true,
}) {
  // Scale factor for display
  const DISPLAY_SCALE = zoom
  const containerRef = useRef(null)
  const mainCanvasRef = useRef(null)
  const drawingCanvasRef = useRef(null)

  // Interaction state
  const [dragState, setDragState] = useState(null)
  const [resizeState, setResizeState] = useState(null)
  const [cropDragState, setCropDragState] = useState(null)
  const [rotateState, setRotateState] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastDrawPoint, setLastDrawPoint] = useState(null)
  const [hoveredHandle, setHoveredHandle] = useState(null)

  // Loaded images cache
  const imagesRef = useRef({})

  // Video loaded trigger for re-render
  const [videoLoadedTrigger, setVideoLoadedTrigger] = useState(0)

  // Image loaded trigger for re-render
  const [imageLoadedTrigger, setImageLoadedTrigger] = useState(0)

  // Animation tick for video playback re-rendering
  const [renderTick, setRenderTick] = useState(0)

  // Offscreen canvas for measuring text
  const measureCanvasRef = useRef(null)
  if (!measureCanvasRef.current) {
    measureCanvasRef.current = document.createElement('canvas')
  }

  // Padding around canvas to allow handles to be clickable outside canvas bounds
  // Smaller on mobile to maximize canvas space
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const handlePadding = isMobile ? 15 : 50

  // Get canvas coordinates from mouse or touch event
  const getCanvasCoords = useCallback((e) => {
    // Use the main canvas element directly for accurate positioning
    const canvas = mainCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()

    // Handle touch events
    let clientX, clientY
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    // Calculate position relative to canvas using actual rendered dimensions
    // This accounts for any scaling between CSS size and canvas buffer size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    return { x, y }
  }, [])

  // Check if point is inside an object (accounting for rotation)
  const hitTest = useCallback((x, y, obj) => {
    // For text objects, calculate actual rendered dimensions
    let hitX = obj.x
    let hitY = obj.y
    let hitWidth = obj.width
    let hitHeight = obj.height

    if (obj.type === OBJECT_TYPES.TEXT && measureCanvasRef.current) {
      const ctx = measureCanvasRef.current.getContext('2d')
      ctx.font = `bold ${obj.fontSize}px "${obj.fontFamily}", sans-serif`
      const metrics = ctx.measureText(obj.text)
      const actualWidth = metrics.width
      const actualHeight = obj.fontSize * 1.2 // Approximate line height

      // Text is centered, so calculate actual bounds
      const centerX = obj.x + obj.width / 2
      const centerY = obj.y + obj.height / 2
      hitX = centerX - actualWidth / 2
      hitY = centerY - actualHeight / 2
      hitWidth = actualWidth
      hitHeight = actualHeight
    }

    // Transform point relative to object center
    const cx = hitX + hitWidth / 2
    const cy = hitY + hitHeight / 2

    // Rotate point back by negative angle
    const angle = -(obj.rotation || 0) * Math.PI / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const dx = x - cx
    const dy = y - cy
    const rx = dx * cos - dy * sin + cx
    const ry = dx * sin + dy * cos + cy

    // Check if rotated point is in object bounds
    return rx >= hitX && rx <= hitX + hitWidth &&
           ry >= hitY && ry <= hitY + hitHeight
  }, [])

  // Find object at point (top to bottom)
  const findObjectAtPoint = useCallback((x, y) => {
    for (let i = objects.length - 1; i >= 0; i--) {
      if (hitTest(x, y, objects[i])) {
        return objects[i]
      }
    }
    return null
  }, [objects, hitTest])

  // Get handle at point for selected object
  const getHandleAtPoint = useCallback((x, y, obj) => {
    if (!obj) return null

    // Hit area for clicking handles (in canvas coordinates)
    const handleHitSize = 60
    const cx = obj.x + obj.width / 2
    const cy = obj.y + obj.height / 2
    const angle = (obj.rotation || 0) * Math.PI / 180

    // Helper to rotate a point around object center
    const rotatePointAroundCenter = (px, py, ang) => {
      const cos = Math.cos(ang)
      const sin = Math.sin(ang)
      const dx = px - cx
      const dy = py - cy
      return {
        x: dx * cos - dy * sin + cx,
        y: dx * sin + dy * cos + cy,
      }
    }

    // Corner positions (before rotation)
    // Offset outward to match visual handle positions (handles are 10px at -5px offset in screen coords)
    // At scale 0.5, -5px screen = -10 canvas units outward from corner
    const handleOffset = 0 // The handles are centered on corners, no offset needed
    const corners = {
      nw: { x: obj.x - handleOffset, y: obj.y - handleOffset },
      ne: { x: obj.x + obj.width + handleOffset, y: obj.y - handleOffset },
      sw: { x: obj.x - handleOffset, y: obj.y + obj.height + handleOffset },
      se: { x: obj.x + obj.width + handleOffset, y: obj.y + obj.height + handleOffset },
    }

    // Rotation handle position (above top center)
    // Visual handle is at -40px screen, at scale 0.5 that's 80 canvas units
    const rotateHandleOffset = 80 // Distance above object in canvas coords
    const rotatePos = rotatePointAroundCenter(
      obj.x + obj.width / 2,
      obj.y - rotateHandleOffset,
      angle
    )

    // Check rotation handle first (in screen space)
    const distToRotate = Math.sqrt(
      Math.pow(x - rotatePos.x, 2) + Math.pow(y - rotatePos.y, 2)
    )
    if (distToRotate < handleHitSize) {
      return 'rotate'
    }

    // For corner handles, rotate them to screen position and check distance
    for (const [name, pos] of Object.entries(corners)) {
      const rotatedCorner = rotatePointAroundCenter(pos.x, pos.y, angle)
      const dist = Math.sqrt(
        Math.pow(x - rotatedCorner.x, 2) + Math.pow(y - rotatedCorner.y, 2)
      )
      if (dist < handleHitSize) {
        return name
      }
    }

    return null
  }, [])

  // Handle mouse/touch down
  const handleMouseDown = useCallback((e) => {
    // Prevent default to stop scrolling on touch
    if (e.type === 'touchstart') {
      e.preventDefault()
    }

    const coords = getCanvasCoords(e)
    if (!coords) return

    // Eyedropper mode - pick color from canvas
    if (isEyedropperMode && onColorPicked) {
      const canvas = mainCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const pixel = ctx.getImageData(Math.round(coords.x), Math.round(coords.y), 1, 1).data
        const hex = '#' + [pixel[0], pixel[1], pixel[2]]
          .map(c => c.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
        onColorPicked(hex)
      }
      return
    }

    // Check for crop handle click first (when in crop mode)
    if (isCropMode && selectedId) {
      const cropEdge = e.target.dataset?.cropEdge
      if (cropEdge) {
        const selectedObj = objects.find(o => o.id === selectedId)
        if (selectedObj) {
          setCropDragState({
            objectId: selectedId,
            edge: cropEdge,
            startX: coords.x,
            startY: coords.y,
            startCropTop: selectedObj.cropTop ?? 0,
            startCropBottom: selectedObj.cropBottom ?? 0,
            startCropLeft: selectedObj.cropLeft ?? 0,
            startCropRight: selectedObj.cropRight ?? 0,
            objectHeight: selectedObj.height,
            objectWidth: selectedObj.width,
          })
          return
        }
      }
    }

    // Drawing mode
    if (isDrawingMode) {
      setIsDrawing(true)
      setLastDrawPoint(coords)

      // Draw a dot at starting point
      const drawingCanvas = drawingCanvasRef.current
      if (drawingCanvas) {
        const ctx = drawingCanvas.getContext('2d')
        ctx.fillStyle = drawingColor || '#000000'
        ctx.beginPath()
        ctx.arc(coords.x, coords.y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    }

    // Check for handle interaction on selected object (not in crop mode)
    if (selectedId && !isCropMode) {
      const selectedObj = objects.find(o => o.id === selectedId)
      if (selectedObj) {
        // First check if clicked directly on a handle element
        const handleElement = e.target.closest('[data-handle]')
        const handle = handleElement?.dataset?.handle || getHandleAtPoint(coords.x, coords.y, selectedObj)

        if (handle === 'rotate') {
          const cx = selectedObj.x + selectedObj.width / 2
          const cy = selectedObj.y + selectedObj.height / 2
          const startAngle = Math.atan2(coords.y - cy, coords.x - cx)
          setRotateState({
            objectId: selectedId,
            startAngle,
            startRotation: selectedObj.rotation || 0,
          })
          return
        }

        if (handle) {
          setResizeState({
            objectId: selectedId,
            handle,
            startX: coords.x,
            startY: coords.y,
            startObjX: selectedObj.x,
            startObjY: selectedObj.y,
            startWidth: selectedObj.width,
            startHeight: selectedObj.height,
            aspectRatio: selectedObj.width / selectedObj.height,
            // For text scaling
            isText: selectedObj.type === OBJECT_TYPES.TEXT,
            startFontSize: selectedObj.fontSize || 48,
          })
          return
        }
      }
    }

    // Check for object click
    const obj = findObjectAtPoint(coords.x, coords.y)
    if (obj) {
      onSelectObject(obj.id)
      if (!isCropMode) {
        setDragState({
          objectId: obj.id,
          startX: coords.x,
          startY: coords.y,
          startObjX: obj.x,
          startObjY: obj.y,
        })
      }
    } else {
      onClearSelection()
      if (isCropMode && onExitCropMode) {
        onExitCropMode()
      }
    }
  }, [
    getCanvasCoords, isDrawingMode, drawingColor, selectedId, objects,
    getHandleAtPoint, findObjectAtPoint, onSelectObject, onClearSelection,
    isCropMode, onExitCropMode
  ])

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    const coords = getCanvasCoords(e)
    if (!coords) return

    // Drawing mode
    if (isDrawingMode && isDrawing && lastDrawPoint) {
      const drawingCanvas = drawingCanvasRef.current
      if (drawingCanvas) {
        const ctx = drawingCanvas.getContext('2d')
        ctx.strokeStyle = drawingColor || '#000000'
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(lastDrawPoint.x, lastDrawPoint.y)
        ctx.lineTo(coords.x, coords.y)
        ctx.stroke()
        setLastDrawPoint(coords)
      }
      return
    }

    // Crop dragging
    if (cropDragState) {
      const { edge, startX, startY, startCropTop, startCropBottom, startCropLeft, startCropRight, objectHeight, objectWidth } = cropDragState
      const dx = coords.x - startX
      const dy = coords.y - startY

      // Convert pixel delta to crop percentage (relative to object size)
      if (edge === 'top') {
        const cropDelta = dy / objectHeight
        const newCrop = Math.max(0, Math.min(0.45, startCropTop + cropDelta))
        onUpdateObject(cropDragState.objectId, { cropTop: newCrop })
      } else if (edge === 'bottom') {
        const cropDelta = -dy / objectHeight
        const newCrop = Math.max(0, Math.min(0.45, startCropBottom + cropDelta))
        onUpdateObject(cropDragState.objectId, { cropBottom: newCrop })
      } else if (edge === 'left') {
        const cropDelta = dx / objectWidth
        const newCrop = Math.max(0, Math.min(0.45, startCropLeft + cropDelta))
        onUpdateObject(cropDragState.objectId, { cropLeft: newCrop })
      } else if (edge === 'right') {
        const cropDelta = -dx / objectWidth
        const newCrop = Math.max(0, Math.min(0.45, startCropRight + cropDelta))
        onUpdateObject(cropDragState.objectId, { cropRight: newCrop })
      }
      return
    }

    // Dragging object
    if (dragState) {
      const dx = coords.x - dragState.startX
      const dy = coords.y - dragState.startY
      onUpdateObject(dragState.objectId, {
        x: dragState.startObjX + dx,
        y: dragState.startObjY + dy,
      })
      return
    }

    // Resizing object
    if (resizeState) {
      const { handle, startX, startY, startObjX, startObjY, startWidth, startHeight, aspectRatio } = resizeState

      const dx = coords.x - startX
      const dy = coords.y - startY

      let newX = startObjX
      let newY = startObjY
      let newWidth = startWidth
      let newHeight = startHeight

      // Resize with aspect ratio locked
      if (handle.includes('e')) {
        newWidth = Math.max(50, startWidth + dx)
        newHeight = newWidth / aspectRatio
      }
      if (handle.includes('w')) {
        const widthDelta = -dx
        newWidth = Math.max(50, startWidth + widthDelta)
        newHeight = newWidth / aspectRatio
        newX = startObjX - (newWidth - startWidth)
      }
      if (handle.includes('s') && !handle.includes('e') && !handle.includes('w')) {
        newHeight = Math.max(50, startHeight + dy)
        newWidth = newHeight * aspectRatio
      }
      if (handle.includes('n') && !handle.includes('e') && !handle.includes('w')) {
        const heightDelta = -dy
        newHeight = Math.max(50, startHeight + heightDelta)
        newWidth = newHeight * aspectRatio
        newY = startObjY - (newHeight - startHeight)
      }

      // Corner handles - resize proportionally
      if (handle === 'se') {
        const delta = Math.max(dx, dy * aspectRatio)
        newWidth = Math.max(50, startWidth + delta)
        newHeight = newWidth / aspectRatio
      }
      if (handle === 'nw') {
        const delta = Math.max(-dx, -dy * aspectRatio)
        newWidth = Math.max(50, startWidth + delta)
        newHeight = newWidth / aspectRatio
        newX = startObjX - (newWidth - startWidth)
        newY = startObjY - (newHeight - startHeight)
      }
      if (handle === 'ne') {
        const delta = Math.max(dx, -dy * aspectRatio)
        newWidth = Math.max(50, startWidth + delta)
        newHeight = newWidth / aspectRatio
        newY = startObjY - (newHeight - startHeight)
      }
      if (handle === 'sw') {
        const delta = Math.max(-dx, dy * aspectRatio)
        newWidth = Math.max(50, startWidth + delta)
        newHeight = newWidth / aspectRatio
        newX = startObjX - (newWidth - startWidth)
      }

      // Build update object
      const update = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      }

      // Scale font size for text objects
      if (resizeState.isText && resizeState.startFontSize) {
        const scaleFactor = newWidth / resizeState.startWidth
        const newFontSize = Math.round(resizeState.startFontSize * scaleFactor)
        // Clamp font size between 12 and 300
        update.fontSize = Math.max(12, Math.min(300, newFontSize))
      }

      onUpdateObject(resizeState.objectId, update)
      return
    }

    // Rotating object
    if (rotateState) {
      const obj = objects.find(o => o.id === rotateState.objectId)
      if (obj) {
        const cx = obj.x + obj.width / 2
        const cy = obj.y + obj.height / 2
        const currentAngle = Math.atan2(coords.y - cy, coords.x - cx)
        const deltaAngle = (currentAngle - rotateState.startAngle) * 180 / Math.PI
        onUpdateObject(rotateState.objectId, {
          rotation: rotateState.startRotation + deltaAngle,
        })
      }
      return
    }

    // Update hovered handle for cursor feedback
    if (selectedId && !isDrawingMode) {
      const selectedObj = objects.find(o => o.id === selectedId)
      const handle = selectedObj ? getHandleAtPoint(coords.x, coords.y, selectedObj) : null
      setHoveredHandle(handle)
    } else {
      setHoveredHandle(null)
    }
  }, [
    getCanvasCoords, isDrawingMode, isDrawing, lastDrawPoint, drawingColor,
    dragState, resizeState, rotateState, cropDragState, objects, onUpdateObject, selectedId, getHandleAtPoint
  ])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      setLastDrawPoint(null)
      // Notify parent of drawing update
      if (drawingCanvasRef.current && onDrawingUpdate) {
        const ctx = drawingCanvasRef.current.getContext('2d')
        const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        onDrawingUpdate(imageData)
      }
      return
    }

    // Save to history on interaction end
    if (dragState || resizeState || rotateState || cropDragState) {
      const objectId = dragState?.objectId || resizeState?.objectId || rotateState?.objectId || cropDragState?.objectId
      const obj = objects.find(o => o.id === objectId)
      if (obj) {
        onUpdateObjectWithHistory(objectId, {})
      }
    }

    setDragState(null)
    setResizeState(null)
    setRotateState(null)
    setCropDragState(null)
  }, [isDrawing, dragState, resizeState, rotateState, cropDragState, objects, onUpdateObjectWithHistory, onDrawingUpdate])

  // Handle double-click to edit text
  const handleDoubleClick = useCallback((e) => {
    if (isDrawingMode) return

    const coords = getCanvasCoords(e)
    if (!coords) return

    // Find which object was double-clicked
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      if (hitTest(coords.x, coords.y, obj)) {
        // If it's a text object, trigger edit mode
        if (obj.type === OBJECT_TYPES.TEXT && onEditText) {
          onEditText(obj.id)
        }
        break
      }
    }
  }, [objects, isDrawingMode, getCanvasCoords, hitTest, onEditText])

  // Global mouse/touch handlers for drag/resize/rotate/crop - prevents getting stuck when pointer leaves canvas
  useEffect(() => {
    if (dragState || resizeState || rotateState || cropDragState) {
      const handleGlobalMove = (e) => {
        handleMouseMove(e)
      }
      const handleGlobalUp = () => {
        handleMouseUp()
      }
      window.addEventListener('mousemove', handleGlobalMove)
      window.addEventListener('mouseup', handleGlobalUp)
      window.addEventListener('touchmove', handleGlobalMove, { passive: false })
      window.addEventListener('touchend', handleGlobalUp)
      return () => {
        window.removeEventListener('mousemove', handleGlobalMove)
        window.removeEventListener('mouseup', handleGlobalUp)
        window.removeEventListener('touchmove', handleGlobalMove)
        window.removeEventListener('touchend', handleGlobalUp)
      }
    }
  }, [dragState, resizeState, rotateState, cropDragState, handleMouseMove, handleMouseUp])

  // Render objects to canvas
  useEffect(() => {
    const canvas = mainCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    // Clear and draw background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw each object
    objects.forEach(obj => {
      ctx.save()

      // Get animated properties if object has keyframes
      // ONLY apply keyframe interpolation during playback - when editing, use actual object values
      let animX = obj.x
      let animY = obj.y
      let animScale = obj.scale ?? 1
      let animRotation = obj.rotation ?? 0
      let animOpacity = obj.opacity ?? 1

      if (isPlaying && hasAnimation(obj)) {
        const interpolated = getInterpolatedProperties(obj, videoCurrentTime)
        animX = interpolated.x
        animY = interpolated.y
        animScale = interpolated.scale
        animRotation = interpolated.rotation
        animOpacity = interpolated.opacity
      }

      // Apply scale and rotation transforms around object center
      const cx = animX + obj.width / 2
      const cy = animY + obj.height / 2
      ctx.translate(cx, cy)
      ctx.rotate(animRotation * Math.PI / 180)
      ctx.scale(animScale, animScale)
      ctx.translate(-cx, -cy)

      // Apply animated opacity
      ctx.globalAlpha = animOpacity

      if (obj.type === OBJECT_TYPES.VIDEO) {
        // Draw video frame (now supports keyframe animation for Ken Burns effects)
        const videoEl = videoRefs?.current?.[obj.id]
        if (videoEl && videoEl.readyState >= 2) {
          ctx.drawImage(videoEl, animX, animY, obj.width, obj.height)
        } else {
          // Draw loading placeholder while video loads
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(animX, animY, obj.width, obj.height)
          ctx.fillStyle = '#666'
          ctx.font = 'bold 32px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('Loading video...', animX + obj.width / 2, animY + obj.height / 2)
        }
      } else if (obj.type === OBJECT_TYPES.IMAGE) {
        // Draw image with crop (opacity already applied via animOpacity)
        let img = imagesRef.current[obj.src]
        if (!img) {
          img = new Image()
          // Try with crossOrigin first for local/CORS-enabled images
          // External images (like DexScreener) may fail, so we'll retry without
          const isExternalImage = obj.src.startsWith('http') && !obj.src.includes(window.location.host)
          if (!isExternalImage) {
            img.crossOrigin = 'anonymous'
          }
          img.src = obj.src
          img.onload = () => {
            imagesRef.current[obj.src] = img
            // Trigger re-render
            setImageLoadedTrigger(prev => prev + 1)
          }
          imagesRef.current[obj.src] = img
        }
        if (img.complete && img.naturalWidth > 0) {
          // Calculate crop values
          const cropTop = obj.cropTop ?? 0
          const cropBottom = obj.cropBottom ?? 0
          const cropLeft = obj.cropLeft ?? 0
          const cropRight = obj.cropRight ?? 0

          // Source rectangle (from original image) - full image
          const sx = 0
          const sy = 0
          const sWidth = img.naturalWidth
          const sHeight = img.naturalHeight

          // Calculate visible area after crop (as mask)
          const visibleLeft = obj.width * cropLeft
          const visibleTop = obj.height * cropTop
          const visibleWidth = obj.width * (1 - cropLeft - cropRight)
          const visibleHeight = obj.height * (1 - cropTop - cropBottom)

          // Use clipping to mask the cropped areas
          ctx.save()
          ctx.beginPath()
          ctx.rect(animX + visibleLeft, animY + visibleTop, visibleWidth, visibleHeight)
          ctx.clip()

          // Draw full image at animated position - clipping will mask cropped parts
          ctx.drawImage(img, sx, sy, sWidth, sHeight, animX, animY, obj.width, obj.height)

          ctx.restore()
        }
      } else if (obj.type === OBJECT_TYPES.TEXT) {
        // Draw text with multiline support (opacity already applied via animOpacity)
        ctx.font = `bold ${obj.fontSize}px "${obj.fontFamily}", sans-serif`
        ctx.textAlign = obj.align || 'center'
        ctx.textBaseline = 'middle'

        const textX = obj.align === 'left' ? animX :
                     obj.align === 'right' ? animX + obj.width :
                     animX + obj.width / 2

        // Split text by newlines for multiline support
        const lines = obj.text.split('\n')
        const lineHeight = obj.fontSize * 1.2
        const totalHeight = lines.length * lineHeight
        const startY = animY + obj.height / 2 - totalHeight / 2 + lineHeight / 2

        lines.forEach((line, index) => {
          const lineY = startY + index * lineHeight

          // Stroke
          if (obj.strokeWidth > 0) {
            ctx.strokeStyle = obj.strokeColor
            ctx.lineWidth = obj.strokeWidth
            ctx.lineJoin = 'round'
            ctx.strokeText(line, textX, lineY)
          }

          // Fill
          ctx.fillStyle = obj.color
          ctx.fillText(line, textX, lineY)
        })
      } else if (obj.type === OBJECT_TYPES.STICKER) {
        // Draw sticker (emoji) - opacity already applied via animOpacity
        if (obj.sticker && obj.sticker.emoji) {
          const fontSize = Math.min(obj.width, obj.height)
          ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(obj.sticker.emoji, animX + obj.width / 2, animY + obj.height / 2)
        } else if (obj.sticker && obj.sticker.data) {
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
                ctx.fillRect(
                  animX + sx * pixelW,
                  animY + sy * pixelH,
                  Math.ceil(pixelW),
                  Math.ceil(pixelH)
                )
              }
            }
          }
        }
      } else if (obj.type === OBJECT_TYPES.SHAPE) {
        // Draw shape (rectangle or circle) - opacity already applied via animOpacity
        if (obj.shapeType === 'rectangle') {
          // Fill rectangle
          if (obj.fillColor && obj.fillColor !== 'transparent') {
            ctx.fillStyle = obj.fillColor
            ctx.fillRect(animX, animY, obj.width, obj.height)
          }
          // Stroke rectangle
          if (obj.strokeWidth > 0 && obj.strokeColor) {
            ctx.strokeStyle = obj.strokeColor
            ctx.lineWidth = obj.strokeWidth
            ctx.strokeRect(animX, animY, obj.width, obj.height)
          }
        } else if (obj.shapeType === 'circle') {
          // Draw ellipse (circle that can be stretched)
          ctx.beginPath()
          ctx.ellipse(
            animX + obj.width / 2,   // centerX
            animY + obj.height / 2,  // centerY
            obj.width / 2,           // radiusX
            obj.height / 2,          // radiusY
            0, 0, Math.PI * 2
          )
          // Fill circle
          if (obj.fillColor && obj.fillColor !== 'transparent') {
            ctx.fillStyle = obj.fillColor
            ctx.fill()
          }
          // Stroke circle
          if (obj.strokeWidth > 0 && obj.strokeColor) {
            ctx.strokeStyle = obj.strokeColor
            ctx.lineWidth = obj.strokeWidth
            ctx.stroke()
          }
        }
      }

      // Reset globalAlpha before restore
      ctx.globalAlpha = 1
      ctx.restore()
    })

    // Draw drawing layer on top
    const drawingCanvas = drawingCanvasRef.current
    if (drawingCanvas) {
      ctx.drawImage(drawingCanvas, 0, 0)
    }
  }, [objects, backgroundColor, videoRefs, videoLoadedTrigger, imageLoadedTrigger, renderTick, videoCurrentTime, isPlaying])

  // Listen for image load events
  useEffect(() => {
    const canvas = mainCanvasRef.current
    if (!canvas) return

    const handleImageLoaded = () => {
      // Force re-render by updating a dummy state or dispatching
      canvas.dispatchEvent(new Event('render'))
    }

    canvas.addEventListener('imageLoaded', handleImageLoaded)
    return () => canvas.removeEventListener('imageLoaded', handleImageLoaded)
  }, [])

  // Clear drawing canvas when signal changes
  useEffect(() => {
    if (clearDrawingSignal && drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
  }, [clearDrawingSignal])

  // Sync video elements with current time (for scrubbing/seeking)
  useEffect(() => {
    if (!videoRefs?.current) return

    // Only sync when not playing (manual scrubbing)
    if (isPlaying) return

    Object.values(videoRefs.current).forEach(videoEl => {
      if (videoEl && Math.abs(videoEl.currentTime - videoCurrentTime) > 0.1) {
        videoEl.currentTime = videoCurrentTime
      }
    })
  }, [videoCurrentTime, videoRefs, isPlaying])

  // Play/pause video elements based on isPlaying state
  useEffect(() => {
    if (!videoRefs?.current) return

    Object.values(videoRefs.current).forEach(videoEl => {
      if (!videoEl) return

      if (isPlaying) {
        videoEl.play().catch(() => {
          // Video play can fail if not loaded yet, ignore
        })
      } else {
        videoEl.pause()
      }
    })
  }, [isPlaying, videoRefs])

  // Animation frame for video playback - triggers canvas re-render
  useEffect(() => {
    if (!isPlaying) return

    let animationId
    const animate = () => {
      // Force re-render by updating tick
      setRenderTick(t => t + 1)
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [isPlaying])

  // Get selected object for rendering selection UI
  const selectedObj = objects.find(o => o.id === selectedId)

  // Determine cursor based on state
  const getCursor = () => {
    if (isEyedropperMode) return 'crosshair'
    if (isDrawingMode) return 'crosshair'
    if (dragState) return 'move'
    if (resizeState) {
      const cursors = { nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize' }
      return cursors[resizeState.handle] || 'move'
    }
    if (rotateState) return 'grabbing'
    if (hoveredHandle === 'rotate') return 'grab'
    if (hoveredHandle) {
      const cursors = { nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize' }
      return cursors[hoveredHandle] || 'move'
    }
    return 'default'
  }

  return (
    <div
      ref={containerRef}
      className="object-canvas-container"
      style={{
        width: CANVAS_WIDTH * DISPLAY_SCALE + handlePadding * 2,
        height: CANVAS_HEIGHT * DISPLAY_SCALE + handlePadding * 2,
        padding: handlePadding,
        cursor: getCursor(),
        boxSizing: 'border-box',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setHoveredHandle(null)}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Hidden video elements for video objects */}
      {objects.filter(obj => obj.type === OBJECT_TYPES.VIDEO).map(obj => (
        <video
          key={obj.id}
          ref={el => {
            if (videoRefs?.current) {
              videoRefs.current[obj.id] = el
            }
          }}
          src={getProxiedMediaUrl(obj.src)}
          crossOrigin="anonymous"
          style={{ display: 'none' }}
          muted={isMuted}
          playsInline
          preload="auto"
          onLoadedData={(e) => {
            setVideoLoadedTrigger(prev => prev + 1)
            if (onVideoElementReady) {
              onVideoElementReady(e.target, obj.id)
            }
          }}
          onCanPlay={() => {
            // Fallback trigger for re-render
            setVideoLoadedTrigger(prev => prev + 1)
          }}
          onError={(e) => {
            console.error('[ObjectCanvas] Video load error:', obj.src, e.target.error)
            // If CORS fails, video won't load - this is expected for some external sources
          }}
        />
      ))}

      {/* Main canvas */}
      <canvas
        ref={mainCanvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="object-canvas-main"
        style={{
          width: CANVAS_WIDTH * DISPLAY_SCALE,
          height: CANVAS_HEIGHT * DISPLAY_SCALE,
          position: 'absolute',
          top: handlePadding,
          left: handlePadding,
        }}
      />

      {/* Drawing canvas layer - visible when in drawing mode */}
      <canvas
        ref={drawingCanvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="drawing-canvas-layer"
        style={{
          width: CANVAS_WIDTH * DISPLAY_SCALE,
          height: CANVAS_HEIGHT * DISPLAY_SCALE,
          position: 'absolute',
          top: handlePadding,
          left: handlePadding,
          pointerEvents: 'none',
        }}
      />

      {/* Motion path overlay for animated objects */}
      {showMotionPaths && !isDrawingMode && objects.filter(obj => hasAnimation(obj)).map(obj => (
        <MotionPathOverlay
          key={`motion-${obj.id}`}
          object={obj}
          scale={DISPLAY_SCALE}
          offsetX={handlePadding}
          offsetY={handlePadding}
          isSelected={obj.id === selectedId}
        />
      ))}

      {/* Selection UI overlay */}
      {selectedObj && !isDrawingMode && (
        <SelectionOverlay
          object={selectedObj}
          scale={DISPLAY_SCALE}
          offsetX={handlePadding}
          offsetY={handlePadding}
          isCropMode={isCropMode && selectedObj.type === 'image'}
        />
      )}

      {/* Empty state prompt - hide when in drawing mode */}
      {objects.length === 0 && !isDrawingMode && (
        <div className="canvas-empty-prompt">
          <div className="empty-icon">🎨</div>
          <div className="empty-text">Click "Add Template" or "Add Text" to start creating</div>
        </div>
      )}
    </div>
  )
}

// Selection overlay component
function SelectionOverlay({ object, scale, offsetX = 0, offsetY = 0, isCropMode = false }) {
  const { x, y, width, height, rotation } = object

  const style = {
    left: x * scale + offsetX,
    top: y * scale + offsetY,
    width: width * scale,
    height: height * scale,
    transform: `rotate(${rotation || 0}deg)`,
    transformOrigin: 'center center',
  }

  const handleSize = 10

  return (
    <div className="selection-overlay" style={style}>
      {/* Border */}
      <div className="selection-border" />

      {!isCropMode && (
        <>
          {/* Corner handles */}
          <div className="selection-handle nw" data-handle="nw" style={{ width: handleSize, height: handleSize }} />
          <div className="selection-handle ne" data-handle="ne" style={{ width: handleSize, height: handleSize }} />
          <div className="selection-handle sw" data-handle="sw" style={{ width: handleSize, height: handleSize }} />
          <div className="selection-handle se" data-handle="se" style={{ width: handleSize, height: handleSize }} />

          {/* Rotation handle */}
          <div className="rotation-handle-line" />
          <div className="rotation-handle" data-handle="rotate" />
        </>
      )}

      {isCropMode && (
        <>
          {/* Crop edge handles - pill shaped */}
          <div className="crop-handle crop-handle-top" data-crop-edge="top" />
          <div className="crop-handle crop-handle-bottom" data-crop-edge="bottom" />
          <div className="crop-handle crop-handle-left" data-crop-edge="left" />
          <div className="crop-handle crop-handle-right" data-crop-edge="right" />
        </>
      )}
    </div>
  )
}

// Motion path overlay component - shows keyframe positions and path
function MotionPathOverlay({ object, scale, offsetX = 0, offsetY = 0, isSelected }) {
  const pathPoints = getMotionPathPoints(object)

  if (pathPoints.length === 0) return null

  // Calculate center offset (keyframes store position as top-left corner)
  const centerOffsetX = (object.width / 2) * scale
  const centerOffsetY = (object.height / 2) * scale

  // Convert points to screen coordinates (center of object)
  const screenPoints = pathPoints.map(pt => ({
    x: pt.x * scale + offsetX + centerOffsetX,
    y: pt.y * scale + offsetY + centerOffsetY,
    time: pt.time,
    id: pt.id,
  }))

  // Create SVG path string
  const pathD = screenPoints.length > 0
    ? `M ${screenPoints.map(pt => `${pt.x},${pt.y}`).join(' L ')}`
    : ''

  return (
    <svg
      className={`motion-path-overlay ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* Path line - dashed when not selected */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#ff6600' : '#ff660066'}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={isSelected ? 'none' : '6,4'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Keyframe dots */}
      {screenPoints.map((pt, index) => (
        <g key={pt.id}>
          {/* Outer glow/halo */}
          <circle
            cx={pt.x}
            cy={pt.y}
            r={isSelected ? 10 : 6}
            fill={isSelected ? 'rgba(255, 102, 0, 0.2)' : 'rgba(255, 102, 0, 0.1)'}
          />
          {/* Main dot */}
          <circle
            cx={pt.x}
            cy={pt.y}
            r={isSelected ? 6 : 4}
            fill={index === 0 ? '#00cc66' : index === screenPoints.length - 1 ? '#cc0033' : '#ff6600'}
            stroke="white"
            strokeWidth={1.5}
          />
          {/* Keyframe number label when selected */}
          {isSelected && (
            <text
              x={pt.x}
              y={pt.y - 14}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="white"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {index + 1}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
