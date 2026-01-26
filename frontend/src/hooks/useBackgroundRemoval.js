import { useState, useCallback } from 'react'
import { removeBackground } from '@imgly/background-removal'

/**
 * Hook for removing backgrounds from images using AI
 * Uses @imgly/background-removal which runs entirely in the browser
 */
export default function useBackgroundRemoval() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const removeImageBackground = useCallback(async (imageSrc) => {
    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Convert image source to blob if needed
      let imageBlob

      if (imageSrc instanceof Blob) {
        imageBlob = imageSrc
      } else if (imageSrc.startsWith('data:')) {
        const response = await fetch(imageSrc)
        imageBlob = await response.blob()
      } else if (imageSrc.startsWith('blob:')) {
        const response = await fetch(imageSrc)
        imageBlob = await response.blob()
      } else {
        // Fetch external URL via CORS proxy
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageSrc)}`
        const response = await fetch(proxyUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }
        imageBlob = await response.blob()
      }

      // Process the image with AI
      const resultBlob = await removeBackground(imageBlob, {
        progress: (key, current, total) => {
          if (total > 0) {
            setProgress(Math.round((current / total) * 100))
          }
        },
        output: {
          format: 'image/png',
          quality: 1,
        },
      })

      // Convert result blob to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          setIsProcessing(false)
          setProgress(100)
          resolve(reader.result)
        }
        reader.onerror = () => {
          setIsProcessing(false)
          reject(new Error('Failed to read processed image'))
        }
        reader.readAsDataURL(resultBlob)
      })
    } catch (err) {
      console.error('Background removal failed:', err)
      setError(err.message || 'Failed to remove background')
      setIsProcessing(false)
      throw err
    }
  }, [])

  return {
    removeImageBackground,
    isProcessing,
    progress,
    error,
  }
}
