import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Hook for managing video playback state
 * Handles play/pause, seeking, current time tracking, and playback rate
 * Supports multiple video objects on the canvas
 */
export default function useVideoPlayback(videoObject, allVideoObjects = []) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(true) // Start muted for autoplay policy
  const videoRef = useRef(null) // Primary video reference
  const videoRefsMap = useRef({}) // All video references keyed by object ID
  const animationFrameRef = useRef(null)

  // Get effective start and end times (accounting for trim) - from primary video
  const trimStart = videoObject?.trimStart ?? 0
  const trimEnd = videoObject?.trimEnd ?? videoObject?.duration ?? 0
  const playbackRate = videoObject?.playbackRate ?? 1
  const duration = videoObject?.duration ?? 0

  // Register a video element (called for each video on canvas)
  const registerVideo = useCallback((videoElement, objectId) => {
    if (!videoElement) return

    // Store in refs map
    if (objectId) {
      videoRefsMap.current[objectId] = videoElement
    }

    // Set as primary if it's the primary video object
    if (videoObject && objectId === videoObject.id) {
      videoRef.current = videoElement
      videoElement.currentTime = trimStart
      setCurrentTime(trimStart)
    }

    // All videos start muted and at their respective positions
    videoElement.muted = isMuted
    videoElement.playbackRate = playbackRate
  }, [videoObject, trimStart, playbackRate, isMuted])

  // Update time display during playback
  const updateTimeDisplay = useCallback(() => {
    if (!videoRef.current) return

    const time = videoRef.current.currentTime
    setCurrentTime(time)

    // Loop back to trim start if we've reached trim end
    if (time >= trimEnd) {
      videoRef.current.currentTime = trimStart
      setCurrentTime(trimStart)
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTimeDisplay)
    }
  }, [isPlaying, trimStart, trimEnd])

  // Start time updates when playing
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTimeDisplay)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, updateTimeDisplay])

  // Play all videos
  const play = useCallback(() => {
    if (!videoRef.current) return

    // If at or past trim end, start from trim start
    if (videoRef.current.currentTime >= trimEnd) {
      videoRef.current.currentTime = trimStart
      // Sync all other videos to current time
      Object.values(videoRefsMap.current).forEach(videoEl => {
        if (videoEl && videoEl !== videoRef.current) {
          videoEl.currentTime = trimStart
        }
      })
    }

    // Play all videos
    Object.values(videoRefsMap.current).forEach(videoEl => {
      if (videoEl) {
        videoEl.play().catch(() => {
          // Ignore autoplay errors
        })
      }
    })
    setIsPlaying(true)
  }, [trimStart, trimEnd])

  // Pause all videos
  const pause = useCallback(() => {
    Object.values(videoRefsMap.current).forEach(videoEl => {
      if (videoEl) {
        videoEl.pause()
      }
    })
    setIsPlaying(false)
  }, [])

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // Seek all videos to specific time
  const seek = useCallback((time) => {
    // Clamp time to trim bounds of primary video
    const clampedTime = Math.max(trimStart, Math.min(trimEnd, time))

    // Seek all videos
    Object.values(videoRefsMap.current).forEach(videoEl => {
      if (videoEl) {
        videoEl.currentTime = clampedTime
      }
    })
    setCurrentTime(clampedTime)
  }, [trimStart, trimEnd])

  // Seek by delta (for skip forward/backward)
  const seekBy = useCallback((delta) => {
    if (!videoRef.current) return
    const newTime = currentTime + delta
    seek(newTime)
  }, [currentTime, seek])

  // Set playback rate
  const setPlaybackRate = useCallback((rate) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
  }, [])

  // Toggle mute/unmute for all videos
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      Object.values(videoRefsMap.current).forEach(videoEl => {
        if (videoEl) {
          videoEl.muted = newMuted
        }
      })
      return newMuted
    })
  }, [])

  // Reset to beginning (trim start)
  const reset = useCallback(() => {
    pause()
    seek(trimStart)
  }, [pause, seek, trimStart])

  // Update all videos when trim bounds or playback rate change
  useEffect(() => {
    // Update playback rate for all videos
    Object.values(videoRefsMap.current).forEach(videoEl => {
      if (videoEl) {
        videoEl.playbackRate = playbackRate
      }
    })

    // If current time is outside trim bounds, clamp it
    if (currentTime < trimStart || currentTime > trimEnd) {
      Object.values(videoRefsMap.current).forEach(videoEl => {
        if (videoEl) {
          videoEl.currentTime = trimStart
        }
      })
      setCurrentTime(trimStart)
    }
  }, [playbackRate, trimStart, trimEnd, currentTime])

  // Format time as MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    trimStart,
    trimEnd,
    playbackRate,
    isMuted,

    // Formatted values
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
    formattedTrimStart: formatTime(trimStart),
    formattedTrimEnd: formatTime(trimEnd),

    // Progress as percentage (within trim bounds)
    progress: trimEnd > trimStart
      ? ((currentTime - trimStart) / (trimEnd - trimStart)) * 100
      : 0,

    // Actions
    play,
    pause,
    togglePlayPause,
    seek,
    seekBy,
    setPlaybackRate,
    toggleMute,
    reset,
    registerVideo,

    // Ref for direct access
    videoRef,
  }
}
