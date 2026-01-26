import { useState, useEffect } from 'react'
import { CANVAS_SIZE } from '../config/constants'

const IMGFLIP_API = 'https://api.imgflip.com/get_memes'

export default function useImgflip() {
  const [memes, setMemes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchMemes() {
      try {
        setIsLoading(true)
        const response = await fetch(IMGFLIP_API)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          // Get top 50 memes (most popular)
          const topMemes = data.data.memes.slice(0, 50).map((meme) => ({
            id: meme.id,
            name: meme.name,
            url: meme.url,
            width: meme.width,
            height: meme.height,
            boxCount: meme.box_count,
          }))
          setMemes(topMemes)
        } else {
          setError('Failed to fetch memes')
        }
      } catch (err) {
        console.error('Error fetching memes:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemes()
  }, [])

  return { memes, isLoading, error }
}

// Convert an image URL to canvas-sized ImageData with meme text
// textItems is an array of { text, x, y } where x,y are 0-1 percentages
export async function pixelateMeme(imageUrl, textItems = []) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_SIZE
      canvas.height = CANVAS_SIZE
      const ctx = canvas.getContext('2d')

      // Draw image scaled to canvas size
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

      // Add Impact-style meme text
      if (textItems.length > 0) {
        // Classic meme font style
        const fontSize = Math.floor(CANVAS_SIZE / 12) // ~42px for 512
        ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        textItems.forEach((item) => {
          if (!item.text) return

          const lines = wrapText(ctx, item.text, CANVAS_SIZE - 20)
          const lineHeight = fontSize * 1.1
          const totalHeight = lines.length * lineHeight

          // Convert percentage position to pixels
          const centerX = item.x * CANVAS_SIZE
          const centerY = item.y * CANVAS_SIZE

          // Draw lines centered around the position
          lines.forEach((line, i) => {
            const yOffset = (i - (lines.length - 1) / 2) * lineHeight
            drawTextWithOutline(ctx, line.toUpperCase(), centerX, centerY + yOffset, fontSize)
          })
        })
      }

      const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      resolve(imageData)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Use a CORS proxy for imgflip images
    img.src = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`
  })
}

// Draw text with thick black outline (classic meme style)
function drawTextWithOutline(ctx, text, x, y, fontSize) {
  const strokeWidth = Math.max(3, fontSize / 10)

  // Black outline
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = strokeWidth * 2
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.strokeText(text, x, y)

  // White fill
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(text, x, y)
}

// Smart text wrapping based on canvas width
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine.toUpperCase())

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })

  if (currentLine) lines.push(currentLine)
  return lines
}
