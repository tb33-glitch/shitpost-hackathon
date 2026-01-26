import { useState, useEffect } from 'react'

export default function VisitorCounter() {
  const [digits, setDigits] = useState(['4', '4', '4', '4', '4'])
  const [isAnimating, setIsAnimating] = useState(true)

  // Animate the counter on load to land on 44,444
  useEffect(() => {
    const startDigits = ['0', '0', '0', '0', '0']
    const targetDigits = ['4', '4', '4', '4', '4']

    let frame = 0
    const totalFrames = 20

    const animate = () => {
      if (frame < totalFrames) {
        setDigits(prev =>
          prev.map((_, i) => {
            // Gradually approach target
            if (frame >= totalFrames - 5) {
              return targetDigits[i]
            }
            return String(Math.floor(Math.random() * 10))
          })
        )
        frame++
        setTimeout(animate, 50)
      } else {
        setDigits(targetDigits)
        setIsAnimating(false)
      }
    }

    setTimeout(animate, 500)
  }, [])

  return (
    <div className="visitor-counter">
      <div className="counter-label">
        <span className="counter-icon">👁️</span>
        You are visitor #
      </div>
      <div className={`counter-digits ${isAnimating ? 'animating' : ''}`}>
        {digits.map((digit, i) => (
          <span key={i} className="counter-digit">{digit}</span>
        ))}
      </div>
      <div className="counter-badge">
        <img
          src="data:image/gif;base64,R0lGODlhEAAQAIAAAP///8zMzCH5BAAAAAAALAAAAAAQABAAAAIjjI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jRcAOw=="
          alt=""
          className="counter-gif"
        />
        <span>FREE COUNTER</span>
      </div>
    </div>
  )
}
