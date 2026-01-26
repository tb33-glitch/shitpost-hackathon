import { useState, useEffect } from 'react'
import './BootScreen.css'

const BootScreen = ({ onComplete, duration = 3000 }) => {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Temporarily disabled for testing - uncomment when done
    // const hasBooted = sessionStorage.getItem('shitpost-booted')
    // if (hasBooted) {
    //   setVisible(false)
    //   onComplete?.()
    //   return
    // }
    const hasBooted = false

    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, duration - 500)

    const completeTimer = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('shitpost-booted', 'true')
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  if (!visible) return null

  return (
    <div className={`boot-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="boot-content">
        {/* Logo image */}
        <img
          src="/images/boot-logo.png"
          alt="shitpost.pro"
          className="boot-logo-image"
        />

        {/* XP-style progress bar */}
        <div className="boot-progress-container">
          <div className="boot-progress-bar">
            <div className="boot-progress-blocks">
              <div className="boot-block" />
              <div className="boot-block" />
              <div className="boot-block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BootScreen
