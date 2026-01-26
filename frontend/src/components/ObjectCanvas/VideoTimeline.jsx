import { useRef, useCallback, useState, useEffect } from 'react'
import './VideoTimeline.css'

/**
 * Video Timeline component
 * Shows playback controls, timeline scrubber, trim handles, and overlay timing tracks
 */
export default function VideoTimeline({
  // Playback state
  isPlaying,
  currentTime,
  duration,
  trimStart,
  trimEnd,
  playbackRate,
  isMuted,
  // Playback actions
  onPlay,
  onPause,
  onSeek,
  onPlaybackRateChange,
  onToggleMute,
  // Trim actions
  onTrimStartChange,
  onTrimEndChange,
  // Overlay objects (for timing visualization)
  overlayObjects = [],
  onOverlayTimingChange,
  // Selection
  selectedOverlayId,
  onSelectOverlay,
}) {
  const timelineRef = useRef(null)
  const [isDragging, setIsDragging] = useState(null) // 'scrubber' | 'trimStart' | 'trimEnd' | null
  const [overlayDrag, setOverlayDrag] = useState(null) // { id, edge: 'start' | 'end' | 'move', initialShowFrom, initialShowUntil, startX }

  // Convert time to percentage position
  const timeToPercent = useCallback((time) => {
    return duration > 0 ? (time / duration) * 100 : 0
  }, [duration])

  // Convert percentage to time
  const percentToTime = useCallback((percent) => {
    return (percent / 100) * duration
  }, [duration])

  // Get position from mouse/touch event
  const getPositionFromEvent = useCallback((e) => {
    if (!timelineRef.current) return 0
    const rect = timelineRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const percent = ((clientX - rect.left) / rect.width) * 100
    return Math.max(0, Math.min(100, percent))
  }, [])

  // Handle timeline click (seek)
  const handleTimelineClick = useCallback((e) => {
    if (isDragging) return
    const percent = getPositionFromEvent(e)
    const time = percentToTime(percent)
    // Clamp to trim bounds
    const clampedTime = Math.max(trimStart, Math.min(trimEnd, time))
    onSeek(clampedTime)
  }, [isDragging, getPositionFromEvent, percentToTime, trimStart, trimEnd, onSeek])

  // Handle scrubber drag start
  const handleScrubberMouseDown = useCallback((e) => {
    e.stopPropagation()
    setIsDragging('scrubber')
  }, [])

  // Handle trim handle drag start
  const handleTrimStartMouseDown = useCallback((e) => {
    e.stopPropagation()
    setIsDragging('trimStart')
  }, [])

  const handleTrimEndMouseDown = useCallback((e) => {
    e.stopPropagation()
    setIsDragging('trimEnd')
  }, [])

  // Handle overlay bar drag start
  const handleOverlayDragStart = useCallback((e, obj, edge) => {
    e.stopPropagation()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    setOverlayDrag({
      id: obj.id,
      edge, // 'start' | 'end' | 'move'
      initialShowFrom: obj.showFrom ?? 0,
      initialShowUntil: obj.showUntil ?? duration,
      startX: clientX,
      startPercent: getPositionFromEvent(e),
    })
  }, [duration, getPositionFromEvent])

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging && !overlayDrag) return

    const handleMouseMove = (e) => {
      const percent = getPositionFromEvent(e)
      const time = percentToTime(percent)

      if (isDragging === 'scrubber') {
        const clampedTime = Math.max(trimStart, Math.min(trimEnd, time))
        onSeek(clampedTime)
      } else if (isDragging === 'trimStart') {
        // Don't let trim start go past trim end - 0.1s minimum
        const newTrimStart = Math.max(0, Math.min(trimEnd - 0.1, time))
        onTrimStartChange(newTrimStart)
        // If current time is before new trim start, move it
        if (currentTime < newTrimStart) {
          onSeek(newTrimStart)
        }
      } else if (isDragging === 'trimEnd') {
        // Don't let trim end go before trim start + 0.1s minimum
        const newTrimEnd = Math.max(trimStart + 0.1, Math.min(duration, time))
        onTrimEndChange(newTrimEnd)
        // If current time is after new trim end, move it
        if (currentTime > newTrimEnd) {
          onSeek(newTrimEnd)
        }
      } else if (overlayDrag) {
        // Handle overlay bar dragging
        const { id, edge, initialShowFrom, initialShowUntil, startPercent } = overlayDrag
        const deltaPercent = percent - startPercent
        const deltaTime = (deltaPercent / 100) * duration
        const overlayDuration = initialShowUntil - initialShowFrom
        const minDuration = 0.1 // Minimum overlay duration

        let newShowFrom = initialShowFrom
        let newShowUntil = initialShowUntil

        if (edge === 'start') {
          // Dragging left edge - adjust showFrom
          newShowFrom = Math.max(0, Math.min(initialShowUntil - minDuration, initialShowFrom + deltaTime))
        } else if (edge === 'end') {
          // Dragging right edge - adjust showUntil
          newShowUntil = Math.max(initialShowFrom + minDuration, Math.min(duration, initialShowUntil + deltaTime))
        } else if (edge === 'move') {
          // Moving the entire bar
          const newFrom = initialShowFrom + deltaTime
          const newUntil = initialShowUntil + deltaTime

          // Clamp to valid range
          if (newFrom < 0) {
            newShowFrom = 0
            newShowUntil = overlayDuration
          } else if (newUntil > duration) {
            newShowUntil = duration
            newShowFrom = duration - overlayDuration
          } else {
            newShowFrom = newFrom
            newShowUntil = newUntil
          }
        }

        // Call the callback to update overlay timing
        onOverlayTimingChange?.(id, { showFrom: newShowFrom, showUntil: newShowUntil })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
      setOverlayDrag(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleMouseMove)
    window.addEventListener('touchend', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, overlayDrag, getPositionFromEvent, percentToTime, trimStart, trimEnd, currentTime, duration, onSeek, onTrimStartChange, onTrimEndChange, onOverlayTimingChange])

  // Format time as MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Playback rate options
  const playbackRates = [0.5, 1, 1.5, 2]

  return (
    <div className="video-timeline">
      {/* Playback controls */}
      <div className="timeline-controls">
        {/* Skip backward */}
        <button
          className="timeline-btn"
          onClick={() => onSeek(Math.max(trimStart, currentTime - 5))}
          title="Skip back 5s"
        >
          ⏪
        </button>

        {/* Play/Pause */}
        <button
          className="timeline-btn play-btn"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        {/* Skip forward */}
        <button
          className="timeline-btn"
          onClick={() => onSeek(Math.min(trimEnd, currentTime + 5))}
          title="Skip forward 5s"
        >
          ⏩
        </button>

        {/* Time display */}
        <div className="timeline-time">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="time-separator">/</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>

        {/* Mute/unmute button */}
        <button
          className="timeline-btn mute-btn"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Playback rate selector */}
        <div className="playback-rate">
          {playbackRates.map(rate => (
            <button
              key={rate}
              className={`rate-btn ${playbackRate === rate ? 'active' : ''}`}
              onClick={() => onPlaybackRateChange(rate)}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Timeline track */}
      <div
        className="timeline-track"
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        {/* Trimmed-out regions (grayed out) */}
        <div
          className="trim-region trim-before"
          style={{ width: `${timeToPercent(trimStart)}%` }}
        />
        <div
          className="trim-region trim-after"
          style={{
            left: `${timeToPercent(trimEnd)}%`,
            width: `${100 - timeToPercent(trimEnd)}%`
          }}
        />

        {/* Active region */}
        <div
          className="active-region"
          style={{
            left: `${timeToPercent(trimStart)}%`,
            width: `${timeToPercent(trimEnd) - timeToPercent(trimStart)}%`
          }}
        />

        {/* Trim handles */}
        <div
          className="trim-handle trim-start"
          style={{ left: `${timeToPercent(trimStart)}%` }}
          onMouseDown={handleTrimStartMouseDown}
          onTouchStart={handleTrimStartMouseDown}
        >
          <div className="trim-handle-bar" />
        </div>
        <div
          className="trim-handle trim-end"
          style={{ left: `${timeToPercent(trimEnd)}%` }}
          onMouseDown={handleTrimEndMouseDown}
          onTouchStart={handleTrimEndMouseDown}
        >
          <div className="trim-handle-bar" />
        </div>

        {/* Scrubber (playhead) */}
        <div
          className="scrubber"
          style={{ left: `${timeToPercent(currentTime)}%` }}
          onMouseDown={handleScrubberMouseDown}
          onTouchStart={handleScrubberMouseDown}
        >
          <div className="scrubber-head" />
          <div className="scrubber-line" />
        </div>
      </div>

      {/* Overlay timing tracks */}
      {overlayObjects.length > 0 && (
        <div className="overlay-tracks">
          <div className="overlay-tracks-label">Overlays</div>
          {overlayObjects.map(obj => {
            const showFrom = obj.showFrom ?? 0
            const showUntil = obj.showUntil ?? duration
            const left = timeToPercent(showFrom)
            const width = timeToPercent(showUntil) - left
            const isBeingDragged = overlayDrag?.id === obj.id

            return (
              <div
                key={obj.id}
                className={`overlay-track ${selectedOverlayId === obj.id ? 'selected' : ''}`}
                onClick={() => onSelectOverlay?.(obj.id)}
              >
                <div
                  className={`overlay-bar ${isBeingDragged ? 'dragging' : ''}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${obj.type}: ${formatTime(showFrom)} - ${formatTime(showUntil)}`}
                >
                  {/* Left drag handle (adjust start time) */}
                  <div
                    className="overlay-drag-handle overlay-drag-left"
                    onMouseDown={(e) => handleOverlayDragStart(e, obj, 'start')}
                    onTouchStart={(e) => handleOverlayDragStart(e, obj, 'start')}
                  />

                  {/* Center area (move entire bar) */}
                  <div
                    className="overlay-bar-center"
                    onMouseDown={(e) => handleOverlayDragStart(e, obj, 'move')}
                    onTouchStart={(e) => handleOverlayDragStart(e, obj, 'move')}
                  >
                    <span className="overlay-label">
                      {obj.type === 'text' ? obj.text?.substring(0, 10) : obj.type}
                    </span>
                  </div>

                  {/* Right drag handle (adjust end time) */}
                  <div
                    className="overlay-drag-handle overlay-drag-right"
                    onMouseDown={(e) => handleOverlayDragStart(e, obj, 'end')}
                    onTouchStart={(e) => handleOverlayDragStart(e, obj, 'end')}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
