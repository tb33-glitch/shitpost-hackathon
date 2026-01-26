import { useState, useEffect, useRef } from 'react'

export default function Taskbar({
  windows,
  windowConfigs,
  activeWindow,
  onWindowClick,
  onWindowDoubleClick,
  onOpenWindow,
}) {
  const [time, setTime] = useState(new Date())
  const [showStartMenu, setShowStartMenu] = useState(false)
  const startMenuRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close start menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showStartMenu && startMenuRef.current && !startMenuRef.current.contains(e.target)) {
        if (!e.target.closest('.start-button')) {
          setShowStartMenu(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showStartMenu])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleStartItemClick = (windowId) => {
    setShowStartMenu(false)
    onOpenWindow(windowId)
  }

  return (
    <div className="xp-taskbar">
      {/* Start Menu */}
      {showStartMenu && (
        <div className="start-menu" ref={startMenuRef}>
          {/* User banner */}
          <div className="start-menu-banner">
            <div className="start-menu-avatar">💩</div>
            <div className="start-menu-username">shitpost.pro</div>
          </div>

          {/* Programs */}
          <div className="start-menu-content">
            <div className="start-menu-left">
              <div className="start-menu-pinned">
                <button className="start-menu-item" onClick={() => handleStartItemClick('shitpost')}>
                  <span className="start-menu-icon">💩</span>
                  <div className="start-menu-item-text">
                    <span className="start-menu-item-name">shitpost.pro</span>
                    <span className="start-menu-item-desc">Meme Studio</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="start-menu-footer">
            <button className="start-menu-footer-btn">
              <span className="footer-icon">🔒</span>
              Log Off
            </button>
            <button className="start-menu-footer-btn shutdown">
              <span className="footer-icon">⏻</span>
              Turn Off Computer
            </button>
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        className={`start-button ${showStartMenu ? 'active' : ''}`}
        onClick={() => setShowStartMenu(!showStartMenu)}
      >
        <span className="start-logo">🪟</span>
        <span className="start-text">start</span>
      </button>

      {/* Quick launch */}
      <div className="quick-launch">
        <button className="quick-launch-btn" title="shitpost.pro" onClick={() => onOpenWindow('shitpost')}>💩</button>
      </div>

      <div className="taskbar-divider" />

      {/* Open windows */}
      <div className="taskbar-windows">
        {Object.entries(windows).map(([id, win]) => {
          if (!win.isOpen) return null
          const config = windowConfigs?.[id]
          return (
            <button
              key={id}
              className={`taskbar-window-btn ${activeWindow === id && !win.isMinimized ? 'active' : ''}`}
              onClick={() => onWindowClick(id)}
              onDoubleClick={() => onWindowDoubleClick?.(id)}
              title="Double-click to center window"
            >
              <span className="taskbar-window-icon">
                {config?.icon?.startsWith?.('/') ? (
                  <img src={config.icon} alt="" style={{ width: 16, height: 16 }} />
                ) : (
                  config?.icon || '📄'
                )}
              </span>
              <span className="taskbar-window-title">
                {config?.title?.split(' - ')[0] || id}
              </span>
            </button>
          )
        })}
      </div>

      {/* System tray */}
      <div className="system-tray">
        <span className="tray-icon" title="Volume">🔊</span>
        <span className="tray-icon" title="Network">📶</span>
        <span className="taskbar-clock">
          {formatTime(time)}
        </span>
      </div>
    </div>
  )
}
