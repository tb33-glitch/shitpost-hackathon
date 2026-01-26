import { useState, useCallback, useEffect } from 'react'
import { getTemplateById } from '../config/memeTemplates'

/**
 * Hook for managing meme template state
 * Handles template selection, image loading, and text zone management
 */
export default function useTemplates() {
  // Current selected template
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Loaded template image as HTMLImageElement
  const [templateImage, setTemplateImage] = useState(null)

  // Loading state
  const [isLoading, setIsLoading] = useState(false)

  // Error state
  const [error, setError] = useState(null)

  // Text content for each zone (keyed by zone ID)
  const [textContent, setTextContent] = useState({})

  // Text styling overrides per zone
  const [textStyles, setTextStyles] = useState({})

  // Load template image when template changes
  useEffect(() => {
    if (!selectedTemplate?.image) {
      setTemplateImage(null)
      return
    }

    setIsLoading(true)
    setError(null)

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      setTemplateImage(img)
      setIsLoading(false)

      // Initialize text content with defaults
      const defaults = {}
      selectedTemplate.textZones?.forEach(zone => {
        defaults[zone.id] = zone.defaultText || ''
      })
      setTextContent(defaults)
    }

    img.onerror = () => {
      setError(`Failed to load template: ${selectedTemplate.name}`)
      setIsLoading(false)
      setTemplateImage(null)
    }

    img.src = selectedTemplate.image
  }, [selectedTemplate])

  // Select a template by ID or template object
  const selectTemplate = useCallback((templateOrId) => {
    if (typeof templateOrId === 'string') {
      const template = getTemplateById(templateOrId)
      setSelectedTemplate(template)
    } else {
      setSelectedTemplate(templateOrId)
    }
    // Reset text styles when changing template
    setTextStyles({})
  }, [])

  // Clear the current template
  const clearTemplate = useCallback(() => {
    setSelectedTemplate(null)
    setTemplateImage(null)
    setTextContent({})
    setTextStyles({})
    setError(null)
  }, [])

  // Update text content for a specific zone
  const updateTextContent = useCallback((zoneId, text) => {
    setTextContent(prev => ({
      ...prev,
      [zoneId]: text
    }))
  }, [])

  // Update text style for a specific zone
  const updateTextStyle = useCallback((zoneId, style) => {
    setTextStyles(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        ...style
      }
    }))
  }, [])

  // Get the effective style for a zone (merged defaults + overrides)
  const getZoneStyle = useCallback((zoneId) => {
    const zone = selectedTemplate?.textZones?.find(z => z.id === zoneId)
    if (!zone) return {}

    return {
      fontSize: zone.fontSize || 24,
      align: zone.align || 'center',
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
      fontFamily: 'Impact, sans-serif',
      ...textStyles[zoneId]
    }
  }, [selectedTemplate, textStyles])

  // Get all zones with their current content and styles
  const getZonesWithContent = useCallback(() => {
    if (!selectedTemplate?.textZones) return []

    return selectedTemplate.textZones.map(zone => ({
      ...zone,
      text: textContent[zone.id] || zone.defaultText || '',
      style: getZoneStyle(zone.id)
    }))
  }, [selectedTemplate, textContent, getZoneStyle])

  // Calculate actual pixel positions from percentage positions
  const calculateZonePositions = useCallback((canvasWidth, canvasHeight) => {
    return getZonesWithContent().map(zone => ({
      ...zone,
      pixelX: (zone.x / 100) * canvasWidth,
      pixelY: (zone.y / 100) * canvasHeight,
      pixelWidth: (zone.width / 100) * canvasWidth,
      pixelHeight: (zone.height / 100) * canvasHeight,
    }))
  }, [getZonesWithContent])

  return {
    // State
    selectedTemplate,
    templateImage,
    isLoading,
    error,
    textContent,

    // Actions
    selectTemplate,
    clearTemplate,
    updateTextContent,
    updateTextStyle,

    // Computed
    getZoneStyle,
    getZonesWithContent,
    calculateZonePositions,

    // Convenience
    hasTemplate: !!selectedTemplate,
    hasImage: !!templateImage,
  }
}
