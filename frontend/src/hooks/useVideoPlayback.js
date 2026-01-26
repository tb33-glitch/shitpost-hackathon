import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Hook for managing video playback state
 * Handles play/pause, seeking, current time tracking, and playback rate
 */
export default function useVideoPlayback(videoObject) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(true) // Start muted for autoplay policy
  const videoRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Get effective start and end times (accounting for trim)
  const trimStart = videoObject?.trimStart ?? 0
  const trimEnd = videoObject?.trimEnd ?? videoObject?.duration ?? 0
  const playbackRate = videoObject?.playbackRate ?? 1
  const duration = videoObject?.duration ?? 0

  // Register a video element
  const registerVideo = useCallback((videoElement) => {
    videoRef.current = videoElement
    if (videoElement) {
      videoElement.currentTime = trimStart
      videoElement.playbackRate = playbackRate
      videoElement.muted = isMuted
      setCurrentTime(trimStart)
    }
  }, [trimStart, playbackRate, isMuted])

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

  // Play video
  const play = useCallback(() => {
    if (!videoRef.current) return

    // If at or past trim end, start from trim start
    if (videoRef.current.currentTime >= trimEnd) {
      videoRef.current.currentTime = trimStart
    }

    videoRef.current.play()
    setIsPlaying(true)
  }, [trimStart, trimEnd])

  // Pause video
  const pause = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.pause()
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

  // Seek to specific time
  const seek = useCallback((time) => {
    if (!videoRef.current) return

    // Clamp time to trim bounds
    const clampedTime = Math.max(trimStart, Math.min(trimEnd, time))
    videoRef.current.currentTime = clampedTime
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

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      if (videoRef.current) {
        videoRef.current.muted = newMuted
      }
      return newMuted
    })
  }, [])

  // Reset to beginning (trim start)
  const reset = useCallback(() => {
    pause()
    seek(trimStart)
  }, [pause, seek, trimStart])

  // Update video when trim bounds or playback rate change
  useEffect(() => {
    if (!videoRef.current) return

    videoRef.current.playbackRate = playbackRate

    // If current time is outside trim bounds, clamp it
    if (currentTime < trimStart || currentTime > trimEnd) {
      videoRef.current.currentTime = trimStart
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
