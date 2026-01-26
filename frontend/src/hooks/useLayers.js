import { useState, useCallback, useRef } from 'react'
import { CANVAS_SIZE } from '../config/constants'

const MAX_LAYERS = 5

export default function useLayers() {
  const [layers, setLayers] = useState([
    { id: 1, name: 'Layer 1', visible: true, opacity: 1 }
  ])
  const [activeLayerId, setActiveLayerId] = useState(1)
  const layerCanvasRefs = useRef({})
  const nextIdRef = useRef(2)

  // Register a canvas ref for a layer
  const registerLayerCanvas = useCallback((layerId, canvasRef) => {
    layerCanvasRefs.current[layerId] = canvasRef
  }, [])

  // Get canvas ref for a layer
  const getLayerCanvas = useCallback((layerId) => {
    return layerCanvasRefs.current[layerId]
  }, [])

  // Get active layer's canvas
  const getActiveCanvas = useCallback(() => {
    return layerCanvasRefs.current[activeLayerId]
  }, [activeLayerId])

  // Add a new layer
  const addLayer = useCallback(() => {
    if (layers.length >= MAX_LAYERS) return null

    const newId = nextIdRef.current++
    const newLayer = {
      id: newId,
      name: `Layer ${newId}`,
      visible: true,
      opacity: 1
    }

    setLayers(prev => [...prev, newLayer])
    setActiveLayerId(newId)
    return newId
  }, [layers.length])

  // Remove a layer
  const removeLayer = useCallback((layerId) => {
    if (layers.length <= 1) return // Keep at least one layer

    setLayers(prev => prev.filter(l => l.id !== layerId))

    // If removing active layer, switch to another
    if (activeLayerId === layerId) {
      const remaining = layers.filter(l => l.id !== layerId)
      if (remaining.length > 0) {
        setActiveLayerId(remaining[remaining.length - 1].id)
      }
    }

    // Clean up canvas ref
    delete layerCanvasRefs.current[layerId]
  }, [layers, activeLayerId])

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId) => {
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ))
  }, [])

  // Set layer opacity
  const setLayerOpacity = useCallback((layerId, opacity) => {
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
    ))
  }, [])

  // Rename layer
  const renameLayer = useCallback((layerId, name) => {
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, name } : l
    ))
  }, [])

  // Move layer up (towards front)
  const moveLayerUp = useCallback((layerId) => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId)
      if (index < prev.length - 1) {
        const newLayers = [...prev]
        ;[newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]]
        return newLayers
      }
      return prev
    })
  }, [])

  // Move layer down (towards back)
  const moveLayerDown = useCallback((layerId) => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId)
      if (index > 0) {
        const newLayers = [...prev]
        ;[newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]]
        return newLayers
      }
      return prev
    })
  }, [])

  // Flatten all layers into a single canvas
  const flattenLayers = useCallback(() => {
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = CANVAS_SIZE
    outputCanvas.height = CANVAS_SIZE
    const outputCtx = outputCanvas.getContext('2d')

    // Fill with white background
    outputCtx.fillStyle = '#FFFFFF'
    outputCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw each visible layer from bottom to top
    layers.forEach(layer => {
      if (!layer.visible) return

      const layerCanvas = layerCanvasRefs.current[layer.id]
      if (layerCanvas) {
        outputCtx.globalAlpha = layer.opacity
        outputCtx.drawImage(layerCanvas, 0, 0)
      }
    })

    outputCtx.globalAlpha = 1
    return outputCanvas
  }, [layers])

  // Get flattened image data
  const getFlattenedImageData = useCallback(() => {
    const canvas = flattenLayers()
    const ctx = canvas.getContext('2d')
    return ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }, [flattenLayers])

  // Export flattened canvas
  const exportFlattened = useCallback(async () => {
    const canvas = flattenLayers()

    return {
      blob: await new Promise(resolve => canvas.toBlob(resolve, 'image/png')),
      dataURL: canvas.toDataURL('image/png'),
    }
  }, [flattenLayers])

  // Clear active layer
  const clearActiveLayer = useCallback(() => {
    const canvas = layerCanvasRefs.current[activeLayerId]
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }
  }, [activeLayerId])

  // Clear all layers
  const clearAllLayers = useCallback(() => {
    Object.values(layerCanvasRefs.current).forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }
    })
  }, [])

  return {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    renameLayer,
    moveLayerUp,
    moveLayerDown,
    registerLayerCanvas,
    getLayerCanvas,
    getActiveCanvas,
    flattenLayers,
    getFlattenedImageData,
    exportFlattened,
    clearActiveLayer,
    clearAllLayers,
    canAddLayer: layers.length < MAX_LAYERS,
    canRemoveLayer: layers.length > 1,
  }
}
