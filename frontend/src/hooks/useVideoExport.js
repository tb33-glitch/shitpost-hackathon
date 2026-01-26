import { useState, useCallback, useRef } from 'react'

/**
 * Hook for video export using canvas recording
 * Uses MediaRecorder for WebM export and frame-by-frame for GIF
 */
export default function useVideoExport() {
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const cancelRef = useRef(false)

  /**
   * Export video as WebM using MediaRecorder with real-time playback
   * This approach plays the video in real-time to capture audio properly
   */
  const exportMP4 = useCallback(async ({
    videoElement,
    width,
    height,
    trimStart,
    trimEnd,
    fps = 30,
    renderFrame,
    includeAudio = true,
  }) => {
    setIsExporting(true)
    setProgress(0)
    setError(null)
    cancelRef.current = false

    try {
      const duration = trimEnd - trimStart

      // Create canvas for recording
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      // Try to get a stream from the canvas
      let canvasStream
      try {
        canvasStream = canvas.captureStream(fps)
      } catch (err) {
        throw new Error('Your browser does not support video recording')
      }

      // Unmute video for audio capture
      const wasMuted = videoElement.muted
      if (includeAudio) {
        videoElement.muted = false
      }

      // Create combined stream with audio from video element
      let stream = canvasStream
      let hasAudio = false
      if (includeAudio && videoElement.captureStream) {
        try {
          const videoStream = videoElement.captureStream()
          const audioTracks = videoStream.getAudioTracks()

          if (audioTracks.length > 0) {
            stream = new MediaStream([
              ...canvasStream.getVideoTracks(),
              ...audioTracks,
            ])
            hasAudio = true
            console.log('[VideoExport] Audio track added to export')
          } else {
            console.log('[VideoExport] No audio tracks in video')
          }
        } catch (err) {
          console.log('[VideoExport] Could not capture audio:', err.message)
        }
      }

      // Set up MediaRecorder with best available codec (with audio support)
      let mimeType = 'video/webm;codecs=vp9,opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Your browser does not support WebM video recording')
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
        audioBitsPerSecond: 128000,
      })

      const chunks = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      // Seek to start position
      videoElement.currentTime = trimStart
      await new Promise(resolve => {
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked)
          resolve()
        }
        videoElement.addEventListener('seeked', onSeeked)
      })

      // Start recording and playback together
      recorder.start(100) // Collect data every 100ms
      videoElement.play()

      const startTime = Date.now()

      // Real-time render loop
      await new Promise((resolve, reject) => {
        let animFrameId = null

        const renderLoop = () => {
          if (cancelRef.current) {
            videoElement.pause()
            recorder.stop()
            cancelAnimationFrame(animFrameId)
            reject(new Error('Export cancelled'))
            return
          }

          const currentTime = videoElement.currentTime
          const elapsed = currentTime - trimStart
          const progressPercent = Math.min(90, (elapsed / duration) * 90)
          setProgress(progressPercent)

          // Render current frame with overlays
          renderFrame(ctx, currentTime)

          // Check if we've reached the end
          if (currentTime >= trimEnd - 0.05 || videoElement.ended) {
            videoElement.pause()
            cancelAnimationFrame(animFrameId)
            resolve()
            return
          }

          animFrameId = requestAnimationFrame(renderLoop)
        }

        // Handle video ending naturally
        const onEnded = () => {
          videoElement.removeEventListener('ended', onEnded)
          cancelAnimationFrame(animFrameId)
          resolve()
        }
        videoElement.addEventListener('ended', onEnded)

        // Handle time updates to stop at trim end
        const onTimeUpdate = () => {
          if (videoElement.currentTime >= trimEnd) {
            videoElement.removeEventListener('timeupdate', onTimeUpdate)
            videoElement.pause()
            cancelAnimationFrame(animFrameId)
            resolve()
          }
        }
        videoElement.addEventListener('timeupdate', onTimeUpdate)

        // Start the render loop
        renderLoop()
      })

      // Stop recording and wait for data
      setProgress(95)

      const blob = await new Promise((resolve, reject) => {
        recorder.onstop = () => {
          // Restore muted state
          videoElement.muted = wasMuted

          if (chunks.length === 0) {
            reject(new Error('No video data recorded'))
            return
          }
          resolve(new Blob(chunks, { type: mimeType }))
        }
        recorder.onerror = (e) => {
          videoElement.muted = wasMuted
          reject(e)
        }
        recorder.stop()
      })

      setProgress(100)
      setIsExporting(false)

      console.log('[VideoExport] Export complete:', blob.size, 'bytes, hasAudio:', hasAudio)
      return blob
    } catch (err) {
      console.error('Video export failed:', err)
      setError(err.message || 'Video export failed. Please try again.')
      setIsExporting(false)
      throw err
    }
  }, [])

  /**
   * Export as GIF using frame capture and gif.js-style encoding
   */
  const exportGIF = useCallback(async ({
    videoElement,
    width,
    height,
    trimStart,
    trimEnd,
    fps = 10,
    renderFrame,
    scale = 0.5,
  }) => {
    setIsExporting(true)
    setProgress(0)
    setError(null)
    cancelRef.current = false

    try {
      const outputWidth = Math.round(width * scale)
      const outputHeight = Math.round(height * scale)
      const duration = trimEnd - trimStart
      const totalFrames = Math.ceil(duration * fps)

      // Create canvas for frame capture
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      // Scaled canvas for output
      const scaledCanvas = document.createElement('canvas')
      scaledCanvas.width = outputWidth
      scaledCanvas.height = outputHeight
      const scaledCtx = scaledCanvas.getContext('2d')

      // Capture frames as data URLs
      const frames = []

      for (let i = 0; i < totalFrames; i++) {
        if (cancelRef.current) {
          throw new Error('Export cancelled')
        }

        const time = trimStart + (i / fps)
        setProgress((i / totalFrames) * 80)

        // Seek video
        videoElement.currentTime = time
        await new Promise(resolve => {
          const onSeeked = () => {
            videoElement.removeEventListener('seeked', onSeeked)
            resolve()
          }
          videoElement.addEventListener('seeked', onSeeked)
        })

        await new Promise(r => setTimeout(r, 10))

        // Render frame
        await renderFrame(ctx, time)

        // Scale down
        scaledCtx.drawImage(canvas, 0, 0, outputWidth, outputHeight)

        // Get frame data
        const imageData = scaledCtx.getImageData(0, 0, outputWidth, outputHeight)
        frames.push(imageData)
      }

      // Create GIF using simple encoder
      setProgress(85)
      const gif = await createGIF(frames, outputWidth, outputHeight, Math.round(1000 / fps))

      setProgress(100)
      setIsExporting(false)

      return gif
    } catch (err) {
      console.error('GIF export failed:', err)
      setError(err.message || 'GIF export failed. Please try again.')
      setIsExporting(false)
      throw err
    }
  }, [])

  // Cancel export
  const cancel = useCallback(() => {
    cancelRef.current = true
  }, [])

  // Download helper
  const download = useCallback((blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return {
    isLoading,
    isExporting,
    progress,
    error,
    exportMP4,
    exportGIF,
    download,
    cancel,
  }
}

/**
 * Simple GIF encoder
 * Creates an animated GIF from frames
 */
async function createGIF(frames, width, height, delay) {
  // GIF header
  const gif = []

  // GIF89a header
  gif.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61) // GIF89a

  // Logical screen descriptor
  gif.push(width & 0xFF, width >> 8)  // Width
  gif.push(height & 0xFF, height >> 8) // Height
  gif.push(0xF7) // Global color table flag, 256 colors
  gif.push(0x00) // Background color index
  gif.push(0x00) // Pixel aspect ratio

  // Global color table (256 colors)
  // Use a simple 6-6-6 RGB color cube (216 colors) + grayscale
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        gif.push(Math.round(r * 51), Math.round(g * 51), Math.round(b * 51))
      }
    }
  }
  // Fill remaining with grayscale
  for (let i = 216; i < 256; i++) {
    const gray = Math.round((i - 216) * 6.375)
    gif.push(gray, gray, gray)
  }

  // Netscape extension for looping
  gif.push(0x21, 0xFF, 0x0B) // Application extension
  gif.push(0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45) // NETSCAPE
  gif.push(0x32, 0x2E, 0x30) // 2.0
  gif.push(0x03, 0x01, 0x00, 0x00, 0x00) // Loop forever

  // Add each frame
  for (const frame of frames) {
    // Graphic control extension
    gif.push(0x21, 0xF9, 0x04)
    gif.push(0x04) // Dispose: restore to background
    gif.push(delay & 0xFF, delay >> 8) // Delay (in hundredths of second)
    gif.push(0x00) // No transparent color
    gif.push(0x00) // Block terminator

    // Image descriptor
    gif.push(0x2C)
    gif.push(0x00, 0x00) // Left
    gif.push(0x00, 0x00) // Top
    gif.push(width & 0xFF, width >> 8)
    gif.push(height & 0xFF, height >> 8)
    gif.push(0x00) // No local color table

    // Image data (LZW encoded)
    const indexed = quantizeFrame(frame)
    const lzw = lzwEncode(indexed, 8)
    gif.push(8) // LZW minimum code size

    // Write LZW data in sub-blocks
    let pos = 0
    while (pos < lzw.length) {
      const blockSize = Math.min(255, lzw.length - pos)
      gif.push(blockSize)
      for (let i = 0; i < blockSize; i++) {
        gif.push(lzw[pos++])
      }
    }
    gif.push(0x00) // Block terminator
  }

  // GIF trailer
  gif.push(0x3B)

  return new Blob([new Uint8Array(gif)], { type: 'image/gif' })
}

// Quantize RGBA frame to 256-color palette index
function quantizeFrame(imageData) {
  const pixels = imageData.data
  const indexed = new Uint8Array(imageData.width * imageData.height)

  for (let i = 0; i < indexed.length; i++) {
    const r = pixels[i * 4]
    const g = pixels[i * 4 + 1]
    const b = pixels[i * 4 + 2]

    // Map to 6x6x6 color cube
    const ri = Math.round(r / 51)
    const gi = Math.round(g / 51)
    const bi = Math.round(b / 51)

    indexed[i] = ri * 36 + gi * 6 + bi
  }

  return indexed
}

// Simple LZW encoder for GIF
function lzwEncode(data, minCodeSize) {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1

  let codeSize = minCodeSize + 1
  let nextCode = eoiCode + 1
  const maxCode = 4095

  const dictionary = new Map()
  // Initialize dictionary with single-character strings
  for (let i = 0; i < clearCode; i++) {
    dictionary.set(String.fromCharCode(i), i)
  }

  const output = []
  let bits = 0
  let bitCount = 0

  const writeBits = (code, size) => {
    bits |= code << bitCount
    bitCount += size
    while (bitCount >= 8) {
      output.push(bits & 0xFF)
      bits >>= 8
      bitCount -= 8
    }
  }

  writeBits(clearCode, codeSize)

  let current = ''

  for (let i = 0; i < data.length; i++) {
    const char = String.fromCharCode(data[i])
    const combined = current + char

    if (dictionary.has(combined)) {
      current = combined
    } else {
      writeBits(dictionary.get(current), codeSize)

      if (nextCode <= maxCode) {
        dictionary.set(combined, nextCode++)

        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++
        }
      }

      current = char
    }

    // Reset dictionary if it gets too large
    if (nextCode > maxCode) {
      writeBits(clearCode, codeSize)
      codeSize = minCodeSize + 1
      nextCode = eoiCode + 1
      dictionary.clear()
      for (let j = 0; j < clearCode; j++) {
        dictionary.set(String.fromCharCode(j), j)
      }
    }
  }

  if (current) {
    writeBits(dictionary.get(current), codeSize)
  }

  writeBits(eoiCode, codeSize)

  // Flush remaining bits
  if (bitCount > 0) {
    output.push(bits & 0xFF)
  }

  return output
}
