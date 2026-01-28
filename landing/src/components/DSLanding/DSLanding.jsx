import { useState, useEffect, useCallback, useRef } from 'react'
import DSShell from './DSShell'
import DinoGame from './DinoGame'
import './ds-landing.css'

// Boot sequence states
const STATES = {
  OFF: 'OFF',
  BOOT_LOGO: 'BOOT_LOGO',
  WARNING_SCREEN: 'WARNING_SCREEN',
  HOME_MENU: 'HOME_MENU',
  GAME: 'GAME',
}

// Timing constants (ms)
const BOOT_LOGO_DURATION = 2500
const WARNING_DURATION = 4000

export default function DSLanding() {
  const [state, setState] = useState(STATES.OFF)
  const [isPowerOn, setIsPowerOn] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const gameJumpRef = useRef(null)

  // Power on handler
  const handlePowerOn = useCallback(() => {
    if (state === STATES.OFF) {
      setIsPowerOn(true)
      setState(STATES.BOOT_LOGO)
    }
  }, [state])

  // Skip warning screen
  const handleSkipWarning = useCallback(() => {
    if (state === STATES.WARNING_SCREEN) {
      setState(STATES.HOME_MENU)
    }
  }, [state])

  // Boot sequence auto-advance
  useEffect(() => {
    if (state === STATES.BOOT_LOGO) {
      const timer = setTimeout(() => {
        setState(STATES.WARNING_SCREEN)
      }, BOOT_LOGO_DURATION)
      return () => clearTimeout(timer)
    }

    if (state === STATES.WARNING_SCREEN) {
      const timer = setTimeout(() => {
        setState(STATES.HOME_MENU)
      }, WARNING_DURATION)
      return () => clearTimeout(timer)
    }
  }, [state])

  // Menu items for pre-launch
  const menuItems = [
    {
      icon: '💬',
      label: 'Join Telegram',
      description: 'Join the community.\nGet alpha.\nBe early.',
      action: () => window.open('https://t.me/+8iOD_GrF-OFiYTJh', '_blank', 'noopener,noreferrer'),
    },
    {
      icon: '𝕏',
      label: 'Follow X',
      description: 'Follow for updates.\nMemes daily.\n@0xwasteland',
      action: () => window.open('https://x.com/0xwasteland', '_blank', 'noopener,noreferrer'),
    },
    {
      icon: '💩',
      label: 'WTF is this?',
      description: 'Meme creation studio.\nMint NFTs on Solana.\nLaunching soon.',
      action: null, // Just shows info
    },
    {
      icon: '💰',
      label: '$SHITPOST',
      description: 'Fees fund perpetual buybacks.\nHolders unlock premium tools.\nGateway to sacred waste.',
      action: null, // Just shows info
    },
    {
      icon: '🎮',
      label: 'Play Game',
      description: 'Poop Runner!\nPress B or SPACE to jump.\nAvoid the obstacles!',
      action: () => setState(STATES.GAME),
    },
  ]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (state === STATES.OFF) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handlePowerOn()
        }
        return
      }

      if (state === STATES.WARNING_SCREEN) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSkipWarning()
        }
        return
      }

      if (state === STATES.HOME_MENU) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault()
            setSelectedIndex((i) => (i <= 1 ? i : i - 2))
            break
          case 'ArrowDown':
            e.preventDefault()
            setSelectedIndex((i) => (i >= 2 ? i : i + 2))
            break
          case 'ArrowLeft':
            e.preventDefault()
            setSelectedIndex((i) => (i % 2 === 0 ? i : i - 1))
            break
          case 'ArrowRight':
            e.preventDefault()
            setSelectedIndex((i) => (i % 2 === 1 ? i : i + 1))
            break
          case 'Enter':
          case ' ':
            e.preventDefault()
            handleMenuSelect(selectedIndex)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, selectedIndex, handlePowerOn, handleSkipWarning])

  // Menu selection handler
  const handleMenuSelect = (index) => {
    const item = menuItems[index]
    if (item.action) {
      item.action()
    }
  }

  // Render top screen content based on state
  const renderTopScreen = () => {
    switch (state) {
      case STATES.OFF:
        return <div className="ds-screen-off" />

      case STATES.BOOT_LOGO:
        return <div className="ds-screen-off" />

      case STATES.WARNING_SCREEN:
        return (
          <div className="ds-warning-top">
            <div className="warning-icon">⚠️</div>
          </div>
        )

      case STATES.HOME_MENU:
        return (
          <HomeMenuTopScreen
            item={menuItems[hoveredIndex !== null ? hoveredIndex : selectedIndex]}
          />
        )

      case STATES.GAME:
        return (
          <DinoGame
            isActive={state === STATES.GAME}
            onJump={gameJumpRef}
          />
        )

      default:
        return null
    }
  }

  // Render bottom screen content based on state
  const renderBottomScreen = () => {
    switch (state) {
      case STATES.OFF:
        return (
          <div className="ds-off-prompt" onClick={handlePowerOn}>
            <div className="ds-power-text">tap to power on</div>
            <div className="ds-power-hint">or press START</div>
          </div>
        )

      case STATES.BOOT_LOGO:
        return (
          <div className="ds-boot-logo">
            <img src="/logo.png" alt="shitpost.pro" className="boot-logo-img" />
            <div className="boot-tagline">coming soon</div>
          </div>
        )

      case STATES.WARNING_SCREEN:
        return (
          <div className="ds-warning" onClick={handleSkipWarning}>
            <h3 className="warning-title">HEALTH & SAFETY WARNING</h3>
            <div className="warning-content">
              <p>Excessive shitposting may cause:</p>
              <ul>
                <li>• Mass accumulation of internet points</li>
                <li>• Involuntary bag-holding</li>
                <li>• Terminal brain rot</li>
              </ul>
            </div>
            <div className="warning-continue">Touch the screen to continue</div>
          </div>
        )

      case STATES.HOME_MENU:
        return (
          <HomeMenu
            items={menuItems}
            selectedIndex={selectedIndex}
            onSelect={handleMenuSelect}
            onHover={setHoveredIndex}
          />
        )

      case STATES.GAME:
        return (
          <div className="ds-game-controls">
            <div className="game-instructions">
              <div className="game-title">💩 Poop Runner</div>
              <div className="game-hint">Press B or SPACE to jump!</div>
              <div className="game-back" onClick={() => setState(STATES.HOME_MENU)}>
                ← SELECT to go back
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // D-pad handler
  const handleDpad = (direction) => {
    if (state === STATES.HOME_MENU) {
      switch (direction) {
        case 'up':
          setSelectedIndex((i) => (i <= 1 ? i : i - 2))
          break
        case 'down':
          setSelectedIndex((i) => (i >= 2 ? i : i + 2))
          break
        case 'left':
          setSelectedIndex((i) => (i % 2 === 0 ? i : i - 1))
          break
        case 'right':
          setSelectedIndex((i) => (i % 2 === 1 ? i : i + 1))
          break
      }
    }
  }

  // Button handler
  const handleButton = (button) => {
    if (state === STATES.OFF && (button === 'A' || button === 'START')) {
      handlePowerOn()
    } else if (state === STATES.WARNING_SCREEN && (button === 'A' || button === 'START')) {
      handleSkipWarning()
    } else if (state === STATES.HOME_MENU && button === 'A') {
      handleMenuSelect(selectedIndex)
    } else if (state === STATES.GAME) {
      if (button === 'B' || button === 'A') {
        // Jump in game
        if (gameJumpRef.current) {
          gameJumpRef.current()
        }
      } else if (button === 'SELECT') {
        setState(STATES.HOME_MENU)
      }
    }
  }

  return (
    <div className="ds-landing-container">
      <div className="ds-landing-bg" />
      <DSShell
        isPowerOn={isPowerOn}
        topScreen={renderTopScreen()}
        bottomScreen={renderBottomScreen()}
        onDpad={handleDpad}
        onButton={handleButton}
      />
    </div>
  )
}

// Top screen content for home menu
function HomeMenuTopScreen({ item }) {
  return (
    <div className="ds-home-top">
      <div className="ds-home-top-header">
        <span className="ds-home-top-icon">{item.icon}</span>
        <span className="ds-home-top-title">{item.label}</span>
      </div>
      <div className="ds-home-top-desc">
        {item.description.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  )
}

// Home Menu grid
function HomeMenu({ items, selectedIndex, onSelect, onHover }) {
  return (
    <div className="ds-home-menu">
      <div className="ds-menu-grid">
        {items.map((item, index) => (
          <div
            key={index}
            className={`ds-menu-item ${selectedIndex === index ? 'selected' : ''} ${item.action ? 'clickable' : ''}`}
            onClick={() => onSelect(index)}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
          >
            <div className="ds-menu-icon">{item.icon}</div>
            <div className="ds-menu-label">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="ds-menu-hint">
        Touch to select
      </div>
    </div>
  )
}
