import { useState, useRef, useEffect } from 'react'
import './StickyNote.css'

export default function StickyNote({
  id,
  initialText = '',
  initialPosition = { x: 100, y: 100 },
  onClose,
  onUpdate,
  zIndex = 100,
  onFocus,
}) {
  const [text, setText] = useState(initialText)
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const noteRef = useRef(null)
  const textareaRef = useRef(null)

  // Handle drag start
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.closest('.sticky-close')) return
    e.preventDefault()
    onFocus?.()
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.x))
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onUpdate?.(id, { text, position })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, id, text, position, onUpdate])

  // Save on text change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      onUpdate?.(id, { text, position })
    }, 500)
    return () => clearTimeout(timeout)
  }, [text, id, position, onUpdate])

  return (
    <div
      ref={noteRef}
      className={`sticky-note ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => onFocus?.()}
    >
      <div className="sticky-header">
        <span className="sticky-title">Sticky Note</span>
        <button
          className="sticky-close"
          onClick={(e) => {
            e.stopPropagation()
            onClose?.(id)
          }}
          title="Delete note"
        >
          ✕
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="sticky-content"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your note..."
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
