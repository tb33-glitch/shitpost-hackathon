import { useState, useCallback, useRef } from 'react'

// Object types
export const OBJECT_TYPES = {
  IMAGE: 'image',
  TEXT: 'text',
  STICKER: 'sticker',
  VIDEO: 'video',
  SHAPE: 'shape',
}

// Convert external image URL to data URL to avoid CORS/tainted canvas issues
const imageToDataURL = async (url) => {
  // If already a data URL, return as-is
  if (url.startsWith('data:')) {
    return url
  }

  // If it's a local/relative URL, return as-is
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return url
  }

  // If it's a blob URL, return as-is
  if (url.startsWith('blob:')) {
    return url
  }

  // Check if it's a Supabase URL (has CORS enabled, no proxy needed)
  const isSupabaseUrl = url.includes('.supabase.co/')

  try {
    let response

    if (isSupabaseUrl) {
      // Supabase has CORS enabled, fetch directly
      console.log('[imageToDataURL] Fetching Supabase image directly:', url.substring(0, 60))
      response = await fetch(url)
    } else {
      // Use a CORS proxy for other external images
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
      response = await fetch(proxyUrl)

      if (!response.ok) {
        console.warn('[imageToDataURL] Proxy fetch failed, trying direct:', url)
        // Try direct fetch as fallback
        response = await fetch(url)
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('[imageToDataURL] Failed to convert image:', err)
    // Return original URL as fallback - export might fail but at least display works
    return url
  }
}

// Canvas size
export const CANVAS_WIDTH = 1080
export const CANVAS_HEIGHT = 1080

// Generate unique IDs
let objectIdCounter = 0
const generateId = () => `obj_${++objectIdCounter}_${Date.now()}`

// Create a new image object from a template
const createImageObject = (template, x = 0, y = 0) => {
  // Default to filling the canvas, maintaining aspect ratio
  let width = CANVAS_WIDTH
  let height = CANVAS_HEIGHT

  // If maxSize is specified (e.g., for small icons like coin images), use that instead
  if (template.maxSize) {
    const maxSize = template.maxSize
    if (template.aspectRatio && template.aspectRatio > 1) {
      width = maxSize
      height = maxSize / template.aspectRatio
    } else if (template.aspectRatio) {
      height = maxSize
      width = maxSize * template.aspectRatio
    } else {
      width = maxSize
      height = maxSize
    }
    // Center on canvas
    x = (CANVAS_WIDTH - width) / 2
    y = (CANVAS_HEIGHT - height) / 2
  } else if (template.aspectRatio) {
    // FIT mode: scale to fit inside canvas maintaining aspect ratio
    // Image is fully visible, background color shows on sides if needed
    if (template.aspectRatio > 1) {
      // Wider than tall - fit to width
      width = CANVAS_WIDTH
      height = CANVAS_WIDTH / template.aspectRatio
      y = (CANVAS_HEIGHT - height) / 2
    } else {
      // Taller than wide - fit to height
      height = CANVAS_HEIGHT
      width = CANVAS_HEIGHT * template.aspectRatio
      x = (CANVAS_WIDTH - width) / 2
    }
  }

  return {
    id: generateId(),
    type: OBJECT_TYPES.IMAGE,
    x,
    y,
    width,
    height,
    rotation: 0,
    src: template.image,
    template: template,
    locked: false,
    opacity: 1,
    // Crop bounds (relative to image: 0-1 range)
    cropTop: 0,
    cropBottom: 0,
    cropLeft: 0,
    cropRight: 0,
  }
}

// Measure text dimensions using offscreen canvas
const measureTextCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null

const measureText = (text, fontSize, fontFamily) => {
  if (!measureTextCanvas) return { width: 300, height: fontSize * 1.2 }
  const ctx = measureTextCanvas.getContext('2d')
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  const metrics = ctx.measureText(text)
  // Add some padding for stroke
  return {
    width: Math.max(100, metrics.width + 20),
    height: fontSize * 1.3,
  }
}

// Create a new text object
const createTextObject = (text = 'YOUR TEXT HERE', x = 100, y = 100) => {
  const fontSize = 48
  const fontFamily = 'Impact'
  const { width, height } = measureText(text, fontSize, fontFamily)

  return {
    id: generateId(),
    type: OBJECT_TYPES.TEXT,
    x,
    y,
    width,
    height,
    rotation: 0,
    text,
    fontSize,
    fontFamily,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 3,
    align: 'center',
    locked: false,
  }
}

// Create a new sticker object
const createStickerObject = (sticker, x = 100, y = 100) => {
  return {
    id: generateId(),
    type: OBJECT_TYPES.STICKER,
    x,
    y,
    width: 100,
    height: 100,
    rotation: 0,
    sticker: sticker,
    locked: false,
  }
}

// Create a new video object
const createVideoObject = (src, duration, aspectRatio = 16/9, x = 0, y = 0) => {
  // Default to filling the canvas, maintaining aspect ratio
  let width = CANVAS_WIDTH
  let height = CANVAS_HEIGHT

  if (aspectRatio) {
    if (aspectRatio > 1) {
      // Wider than tall - fit to width
      width = CANVAS_WIDTH
      height = CANVAS_WIDTH / aspectRatio
      y = (CANVAS_HEIGHT - height) / 2
    } else {
      // Taller than wide - fit to height
      height = CANVAS_HEIGHT
      width = CANVAS_HEIGHT * aspectRatio
      x = (CANVAS_WIDTH - width) / 2
    }
  }

  return {
    id: generateId(),
    type: OBJECT_TYPES.VIDEO,
    x,
    y,
    width,
    height,
    rotation: 0,
    src,
    duration,
    trimStart: 0,
    trimEnd: duration,
    playbackRate: 1,
    opacity: 1,
    locked: false,
  }
}

// Create a new shape object
const createShapeObject = (shapeType = 'rectangle', x = 0, y = 0, size = 300) => {
  return {
    id: generateId(),
    type: OBJECT_TYPES.SHAPE,
    x,
    y,
    width: size,
    height: size,
    rotation: 0,
    locked: false,
    // Shape-specific properties
    shapeType, // 'rectangle' or 'circle'
    fillColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 3,
    opacity: 1,
  }
}

export default function useObjectCanvas() {
  // All objects on the canvas (ordered by z-index, first = bottom)
  const [objects, setObjects] = useState([])

  // Currently selected object ID
  const [selectedId, setSelectedId] = useState(null)

  // Background color
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')

  // Drawing layer data (ImageData)
  const drawingLayerRef = useRef(null)

  // Undo/Redo history
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const state = {
      objects: JSON.parse(JSON.stringify(objects)),
      backgroundColor,
    }

    // Remove redo states
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)

    // Add new state
    historyRef.current.push(state)

    // Limit history
    if (historyRef.current.length > 50) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }

    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [objects, backgroundColor])

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return

    historyIndexRef.current--
    const state = historyRef.current[historyIndexRef.current]
    if (state) {
      setObjects(state.objects)
      setBackgroundColor(state.backgroundColor)
    }

    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(true)
  }, [])

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return

    historyIndexRef.current++
    const state = historyRef.current[historyIndexRef.current]
    if (state) {
      setObjects(state.objects)
      setBackgroundColor(state.backgroundColor)
    }

    setCanUndo(true)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
  }, [])

  // Add an image from template (async to handle external images)
  const addImage = useCallback(async (template) => {
    saveToHistory()

    // Convert external images to data URLs to avoid CORS issues when exporting
    let imageSrc = template.image
    const isExternalUrl = imageSrc.startsWith('http') && !imageSrc.startsWith(window.location.origin)

    if (isExternalUrl) {
      console.log('[useObjectCanvas] Converting external image to data URL:', imageSrc.substring(0, 50) + '...')
      imageSrc = await imageToDataURL(imageSrc)
    }

    const processedTemplate = { ...template, image: imageSrc }
    const obj = createImageObject(processedTemplate) // Position calculated based on aspect ratio
    setObjects(prev => [...prev, obj])
    setSelectedId(obj.id)
  }, [saveToHistory])

  // Add a text object
  const addText = useCallback((text = 'YOUR TEXT HERE') => {
    saveToHistory()
    // Create text object first to get measured dimensions
    const obj = createTextObject(text, 0, 0)
    // Center it on canvas
    obj.x = (CANVAS_WIDTH - obj.width) / 2
    obj.y = (CANVAS_HEIGHT - obj.height) / 2
    setObjects(prev => [...prev, obj])
    setSelectedId(obj.id)
  }, [saveToHistory])

  // Add a sticker
  const addSticker = useCallback((sticker) => {
    saveToHistory()
    const obj = createStickerObject(sticker, CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT / 2 - 50)
    setObjects(prev => [...prev, obj])
    setSelectedId(obj.id)
  }, [saveToHistory])

  // Add a video (replaces existing video)
  // Note: Videos from external sources will taint the canvas for export
  // We proxy them through corsproxy to allow canvas export
  const addVideo = useCallback(async (src, duration, aspectRatio) => {
    saveToHistory()

    // Check if external URL and proxy it (but not Supabase URLs - they have CORS enabled)
    let videoSrc = src
    const isExternalUrl = src.startsWith('http') && !src.startsWith(window.location.origin)
    const isSupabaseUrl = src.includes('.supabase.co/')

    if (isExternalUrl && !isSupabaseUrl) {
      console.log('[useObjectCanvas] Proxying external video:', src.substring(0, 50) + '...')
      // Use CORS proxy for video
      videoSrc = `https://corsproxy.io/?${encodeURIComponent(src)}`
    }

    // Remove any existing video
    setObjects(prev => prev.filter(obj => obj.type !== OBJECT_TYPES.VIDEO))
    const obj = createVideoObject(videoSrc, duration, aspectRatio)
    // Store original src for reference
    obj.originalSrc = src
    // Insert video at the beginning so it's behind other objects
    setObjects(prev => [obj, ...prev])
    setSelectedId(obj.id)
  }, [saveToHistory])

  // Add a shape
  const addShape = useCallback((shapeType = 'rectangle') => {
    saveToHistory()
    const size = 300
    const obj = createShapeObject(
      shapeType,
      (CANVAS_WIDTH - size) / 2,
      (CANVAS_HEIGHT - size) / 2,
      size
    )
    setObjects(prev => [...prev, obj])
    setSelectedId(obj.id)
  }, [saveToHistory])

  // Check if canvas has a video
  const hasVideo = objects.some(obj => obj.type === OBJECT_TYPES.VIDEO)

  // Get the video object
  const getVideoObject = useCallback(() => {
    return objects.find(obj => obj.type === OBJECT_TYPES.VIDEO) || null
  }, [objects])

  // Update an object's properties
  const updateObject = useCallback((id, updates) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id !== id) return obj

      const updatedObj = { ...obj, ...updates }

      // Auto-resize text objects when text content, font size, or font family changes
      if (obj.type === OBJECT_TYPES.TEXT &&
          (updates.text !== undefined || updates.fontSize !== undefined || updates.fontFamily !== undefined)) {
        const { width, height } = measureText(
          updatedObj.text,
          updatedObj.fontSize,
          updatedObj.fontFamily
        )
        // Recenter text if width changed
        const oldCenterX = obj.x + obj.width / 2
        const oldCenterY = obj.y + obj.height / 2
        updatedObj.width = width
        updatedObj.height = height
        updatedObj.x = oldCenterX - width / 2
        updatedObj.y = oldCenterY - height / 2
      }

      return updatedObj
    }))
  }, [])

  // Update object with history save (for drag end, resize end, etc.)
  const updateObjectWithHistory = useCallback((id, updates) => {
    saveToHistory()
    updateObject(id, updates)
  }, [saveToHistory, updateObject])

  // Delete an object
  const deleteObject = useCallback((id) => {
    saveToHistory()
    setObjects(prev => prev.filter(obj => obj.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
  }, [selectedId, saveToHistory])

  // Delete selected object
  const deleteSelected = useCallback(() => {
    if (selectedId) {
      deleteObject(selectedId)
    }
  }, [selectedId, deleteObject])

  // Duplicate an object
  const duplicateObject = useCallback((id) => {
    const obj = objects.find(o => o.id === id)
    if (!obj) return null

    saveToHistory()
    const newObj = {
      ...JSON.parse(JSON.stringify(obj)),
      id: generateId(),
      x: obj.x + 20,
      y: obj.y + 20,
    }
    setObjects(prev => [...prev, newObj])
    setSelectedId(newObj.id)
    return newObj.id
  }, [objects, saveToHistory])

  // Duplicate selected object
  const duplicateSelected = useCallback(() => {
    if (selectedId) {
      return duplicateObject(selectedId)
    }
    return null
  }, [selectedId, duplicateObject])

  // Nudge selected object by delta
  const nudgeSelected = useCallback((dx, dy) => {
    if (!selectedId) return
    const obj = objects.find(o => o.id === selectedId)
    if (!obj) return

    updateObject(selectedId, {
      x: obj.x + dx,
      y: obj.y + dy,
    })
  }, [selectedId, objects, updateObject])

  // Bring object forward (increase z-index)
  const bringForward = useCallback((id) => {
    saveToHistory()
    setObjects(prev => {
      const index = prev.findIndex(obj => obj.id === id)
      if (index === -1 || index === prev.length - 1) return prev
      const newObjects = [...prev]
      const [obj] = newObjects.splice(index, 1)
      newObjects.splice(index + 1, 0, obj)
      return newObjects
    })
  }, [saveToHistory])

  // Send object backward (decrease z-index)
  const sendBackward = useCallback((id) => {
    saveToHistory()
    setObjects(prev => {
      const index = prev.findIndex(obj => obj.id === id)
      if (index <= 0) return prev
      const newObjects = [...prev]
      const [obj] = newObjects.splice(index, 1)
      newObjects.splice(index - 1, 0, obj)
      return newObjects
    })
  }, [saveToHistory])

  // Bring to front
  const bringToFront = useCallback((id) => {
    saveToHistory()
    setObjects(prev => {
      const index = prev.findIndex(obj => obj.id === id)
      if (index === -1 || index === prev.length - 1) return prev
      const newObjects = [...prev]
      const [obj] = newObjects.splice(index, 1)
      newObjects.push(obj)
      return newObjects
    })
  }, [saveToHistory])

  // Send to back
  const sendToBack = useCallback((id) => {
    saveToHistory()
    setObjects(prev => {
      const index = prev.findIndex(obj => obj.id === id)
      if (index <= 0) return prev
      const newObjects = [...prev]
      const [obj] = newObjects.splice(index, 1)
      newObjects.unshift(obj)
      return newObjects
    })
  }, [saveToHistory])

  // Select an object
  const selectObject = useCallback((id) => {
    setSelectedId(id)
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedId(null)
  }, [])

  // Get selected object
  const getSelectedObject = useCallback(() => {
    return objects.find(obj => obj.id === selectedId) || null
  }, [objects, selectedId])

  // Clear all objects
  const clearAll = useCallback(() => {
    saveToHistory()
    setObjects([])
    setSelectedId(null)
  }, [saveToHistory])

  // Clear drawing layer
  const clearDrawingLayer = useCallback(() => {
    drawingLayerRef.current = null
  }, [])

  // Set drawing layer data
  const setDrawingLayerData = useCallback((imageData) => {
    drawingLayerRef.current = imageData
  }, [])

  // Get drawing layer data
  const getDrawingLayerData = useCallback(() => {
    return drawingLayerRef.current
  }, [])

  // Update background color with history
  const updateBackgroundColor = useCallback((color) => {
    saveToHistory()
    setBackgroundColor(color)
  }, [saveToHistory])

  return {
    // State
    objects,
    selectedId,
    backgroundColor,
    canUndo,
    canRedo,
    hasVideo,

    // Object operations
    addImage,
    addText,
    addSticker,
    addVideo,
    addShape,
    getVideoObject,
    updateObject,
    updateObjectWithHistory,
    deleteObject,
    deleteSelected,
    duplicateObject,
    duplicateSelected,
    nudgeSelected,

    // Z-order
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,

    // Selection
    selectObject,
    clearSelection,
    getSelectedObject,

    // Canvas operations
    clearAll,
    setBackgroundColor: updateBackgroundColor,

    // Drawing layer
    drawingLayerRef,
    clearDrawingLayer,
    setDrawingLayerData,
    getDrawingLayerData,

    // History
    undo,
    redo,
    saveToHistory,
  }
}
