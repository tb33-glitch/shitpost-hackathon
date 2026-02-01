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
      } else if (imageSrc.startsWith('/') || imageSrc.startsWith('./') || imageSrc.startsWith('../')) {
        // Local URL - fetch directly
        const response = await fetch(imageSrc)
        if (!response.ok) {
          throw new Error(`Failed to fetch local image: ${response.status}`)
        }
        imageBlob = await response.blob()
      } else {
        // Fetch external URL via backend proxy (more reliable than public CORS proxies)
        const proxyUrl = `/api/memes/proxy-image?url=${encodeURIComponent(imageSrc)}`
        const response = await fetch(proxyUrl)
        if (!response.ok) {
          // Fallback to corsproxy.io if backend proxy fails
          console.warn('[BackgroundRemoval] Backend proxy failed, trying corsproxy.io')
          const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageSrc)}`
          const corsResponse = await fetch(corsProxyUrl)
          if (!corsResponse.ok) {
            throw new Error(`Failed to fetch image: ${corsResponse.status}`)
          }
          imageBlob = await corsResponse.blob()
        } else {
          imageBlob = await response.blob()
        }
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
