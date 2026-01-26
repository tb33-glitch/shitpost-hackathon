import { useState, useEffect } from 'react'

export default function YouveGotMail({ onOpenMail }) {
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Show "You've Got Mail" every 44 seconds (no sound)
    const interval = setInterval(() => {
      setShowNotification(true)

      // Hide after 4 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 4000)
    }, 44000)

    return () => clearInterval(interval)
  }, [])

  const handleClick = (e) => {
    // Don't trigger if clicking the close button
    if (e.target.closest('.mail-close')) return

    setShowNotification(false)
    if (onOpenMail) {
      onOpenMail()
    }
  }

  return (
    <>
      {/* Notification popup */}
      {showNotification && (
        <div
          className="youve-got-mail"
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          <div className="mail-icon">📧</div>
          <div className="mail-content">
            <div className="mail-title">You've Got Mail!</div>
            <div className="mail-subtitle">Click to open Outlook Express</div>
          </div>
          <button
            className="mail-close"
            onClick={() => setShowNotification(false)}
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
