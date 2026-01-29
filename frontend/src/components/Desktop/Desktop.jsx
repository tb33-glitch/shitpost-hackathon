import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import Taskbar from './Taskbar'
import DesktopIcon from './DesktopIcon'
import NFTDesktopIcon from './NFTDesktopIcon'
import RecycleBin from './RecycleBin'
import BurnModal from './BurnModal'
import DesktopAssistant from './DesktopAssistant'
import BootScreen from './BootScreen'
import BlueScreen from './BlueScreen'
import App from '../../App'
import useSolanaNFTs from '../../hooks/useSolanaNFTs'
import { Window } from '../Windows98'
import { CoinExplorer } from '../CoinExplorer'
import BurnTicker from '../BurnTicker'
import { ConnectModal } from '../Wallet'

// Konami code: up up down down left right left right B A
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

// Window definitions with their content
const WINDOW_CONFIGS = {
  shitpost: {
    title: 'shitpost.pro - Meme Studio',
    icon: '💩',
    component: 'shitpost',
    width: 1000, // Match MemeStudio.css
    height: 720, // Match MemeStudio.css
    minWidth: 800,
    minHeight: 600,
  },
  coinExplorer: {
    title: 'Coin Explorer',
    icon: '/images/chart-computer-icon.svg',
    component: 'coinExplorer',
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
  },
}

// Get initial window position (diagonal from top-left)
const getInitialPosition = (windowId, config) => {
  const offsetIndex = Object.keys(WINDOW_CONFIGS).indexOf(windowId)
  return {
    x: 120 + offsetIndex * 40,
    y: 40 + offsetIndex * 40,
  }
}

export default function Desktop() {
  const { publicKey, connected } = useWallet()
  const address = publicKey?.toString()
  const isConnected = connected
  const { nfts, isLoading: nftsLoading, refetch: refetchNFTs } = useSolanaNFTs()

  // Calculate centered position for initial window placement
  const getCenteredPosition = () => {
    const width = 1000 // actual meme studio width from MemeStudio.css
    const height = 720 // actual meme studio height from MemeStudio.css
    return {
      x: Math.max(0, (window.innerWidth - width) / 2),
      y: Math.max(0, (window.innerHeight - 40 - height) / 2 - window.innerHeight * 0.05 - 20), // -40 for taskbar, shifted up 5% + 20px
    }
  }

  const [windows, setWindows] = useState({
    shitpost: {
      isOpen: true,
      isMinimized: true, // Start minimized - user clicks icon to open
      zIndex: 1,
      position: getCenteredPosition(), // Centered by default
      size: { width: null, height: null },
    },
    coinExplorer: {
      isOpen: false,
      isMinimized: false,
      zIndex: 0,
      position: { x: 80, y: 60 },
      size: { width: null, height: null },
    },
  })

  // NFT viewer state
  const [viewingNFT, setViewingNFT] = useState(null)

  // Burn state
  const [burningNFT, setBurningNFT] = useState(null)

  // Wallet connect modal
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Burn ticker (buyback feed)
  const [showBurnTicker, setShowBurnTicker] = useState(false)

  // Drag state
  const [dragState, setDragState] = useState(null) // { windowId, startX, startY, startPosX, startPosY }
  const [resizeState, setResizeState] = useState(null) // { windowId, direction, startX, startY, startWidth, startHeight }

  const [activeWindow, setActiveWindow] = useState('shitpost')
  const [highestZIndex, setHighestZIndex] = useState(1)
  const [bootComplete, setBootComplete] = useState(false)
  const restartOnboardingRef = useRef(null)

  // Blue Screen of Death easter egg
  const [showBSOD, setShowBSOD] = useState(false)
  const konamiIndexRef = useRef(0)

  // Konami code detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input or if any window is open (to avoid conflicts with editor shortcuts)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Ignore if the meme studio or other app windows are open and not minimized
      // (arrow keys are used for nudging objects)
      const hasActiveWindow = Object.entries(windows).some(
        ([, win]) => win.isOpen && !win.isMinimized
      )
      if (hasActiveWindow) return

      // Use e.code for consistent key detection
      const key = e.code
      const expected = KONAMI_CODE[konamiIndexRef.current]

      if (key === expected) {
        konamiIndexRef.current++
        if (konamiIndexRef.current === KONAMI_CODE.length) {
          setShowBSOD(true)
          konamiIndexRef.current = 0
        }
      } else {
        konamiIndexRef.current = 0
        // Check if this key starts the sequence
        if (key === KONAMI_CODE[0]) {
          konamiIndexRef.current = 1
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [windows])

  // Coin context for meme studio integration
  const [coinContextForEditor, setCoinContextForEditor] = useState(null)

  // Sticker context for adding token logos as stickers
  const [stickerContextForEditor, setStickerContextForEditor] = useState(null)

  const openWindow = useCallback((windowId) => {
    const config = WINDOW_CONFIGS[windowId]
    setHighestZIndex(prev => prev + 1)
    setWindows(prev => {
      const existing = prev[windowId]
      const position = existing?.position || getInitialPosition(windowId, config)
      return {
        ...prev,
        [windowId]: {
          ...existing,
          isOpen: true,
          isMinimized: false,
          zIndex: highestZIndex + 1,
          position,
          size: existing?.size || { width: null, height: null },
        }
      }
    })
    setActiveWindow(windowId)
  }, [highestZIndex])

  const closeWindow = useCallback((windowId) => {
    setWindows(prev => ({
      ...prev,
      [windowId]: { ...prev[windowId], isOpen: false }
    }))
  }, [])

  const minimizeWindow = useCallback((windowId) => {
    setWindows(prev => ({
      ...prev,
      [windowId]: { ...prev[windowId], isMinimized: true }
    }))
  }, [])

  const maximizeWindow = useCallback((windowId) => {
    setWindows(prev => {
      const win = prev[windowId]
      const config = WINDOW_CONFIGS[windowId]

      if (win.isMaximized) {
        // Restore to previous size
        return {
          ...prev,
          [windowId]: {
            ...win,
            isMaximized: false,
            position: win.prevPosition || { x: 80, y: 20 },
            size: win.prevSize || { width: null, height: null },
          }
        }
      } else {
        // Maximize
        return {
          ...prev,
          [windowId]: {
            ...win,
            isMaximized: true,
            prevPosition: win.position,
            prevSize: win.size,
            position: { x: 0, y: 0 },
            size: { width: window.innerWidth, height: window.innerHeight - 40 }, // -40 for taskbar
          }
        }
      }
    })
  }, [])

  const focusWindow = useCallback((windowId) => {
    setHighestZIndex(prev => prev + 1)
    setWindows(prev => ({
      ...prev,
      [windowId]: { ...prev[windowId], zIndex: highestZIndex + 1 }
    }))
    setActiveWindow(windowId)
  }, [highestZIndex])

  // Drag handlers
  const handleDragStart = useCallback((windowId, e) => {
    if (e.target.closest('.title-bar-controls')) return // Don't drag from buttons
    e.preventDefault()
    const win = windows[windowId]
    setDragState({
      windowId,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: win.position?.x || 100,
      startPosY: win.position?.y || 50,
    })
    focusWindow(windowId)
  }, [windows, focusWindow])

  const handleDragMove = useCallback((e) => {
    if (!dragState) return
    const { windowId, startX, startY, startPosX, startPosY } = dragState
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    // Keep window accessible on screen
    const minVisible = 100
    const maxX = window.innerWidth - minVisible
    const maxY = window.innerHeight - 40 - 50 // Keep title bar above taskbar (40px taskbar + 50px buffer)

    setWindows(prev => ({
      ...prev,
      [windowId]: {
        ...prev[windowId],
        position: {
          x: Math.max(-200, Math.min(maxX, startPosX + deltaX)),
          y: Math.max(-10, Math.min(maxY, startPosY + deltaY)), // Allow slight negative for edge
        }
      }
    }))
  }, [dragState])

  // Center a window on screen
  const centerWindow = useCallback((windowId) => {
    const config = WINDOW_CONFIGS[windowId]
    setWindows(prev => {
      const win = prev[windowId]
      const width = win.size?.width || config?.width || 900
      const height = win.size?.height || config?.height || 650
      return {
        ...prev,
        [windowId]: {
          ...win,
          isMinimized: false,
          position: {
            x: Math.max(0, (window.innerWidth - width) / 2),
            y: Math.max(0, (window.innerHeight - 40 - height) / 2), // -40 for taskbar
          }
        }
      }
    })
    focusWindow(windowId)
  }, [focusWindow])

  const handleDragEnd = useCallback(() => {
    setDragState(null)
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback((windowId, direction, e) => {
    e.preventDefault()
    e.stopPropagation()
    const win = windows[windowId]
    const config = WINDOW_CONFIGS[windowId]
    const currentWidth = win.size?.width || config.width
    const currentHeight = win.size?.height || config.height
    setResizeState({
      windowId,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentWidth,
      startHeight: currentHeight,
      startPosX: win.position?.x || 100,
      startPosY: win.position?.y || 50,
    })
    focusWindow(windowId)
  }, [windows, focusWindow])

  const handleResizeMove = useCallback((e) => {
    if (!resizeState) return
    const { windowId, direction, startX, startY, startWidth, startHeight, startPosX, startPosY } = resizeState
    const config = WINDOW_CONFIGS[windowId]
    const minWidth = config?.minWidth || 300
    const minHeight = config?.minHeight || 200

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    let newWidth = startWidth
    let newHeight = startHeight
    let newX = startPosX
    let newY = startPosY

    if (direction.includes('e')) newWidth = Math.max(minWidth, startWidth + deltaX)
    if (direction.includes('w')) {
      newWidth = Math.max(minWidth, startWidth - deltaX)
      newX = startPosX + (startWidth - newWidth)
    }
    if (direction.includes('s')) newHeight = Math.max(minHeight, startHeight + deltaY)
    if (direction.includes('n')) {
      newHeight = Math.max(minHeight, startHeight - deltaY)
      newY = startPosY + (startHeight - newHeight)
    }

    setWindows(prev => ({
      ...prev,
      [windowId]: {
        ...prev[windowId],
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY },
      }
    }))
  }, [resizeState])

  const handleResizeEnd = useCallback(() => {
    setResizeState(null)
  }, [])

  // Global mouse handlers for drag/resize
  useEffect(() => {
    if (dragState || resizeState) {
      const handleMove = (e) => {
        if (dragState) handleDragMove(e)
        if (resizeState) handleResizeMove(e)
      }
      const handleUp = () => {
        handleDragEnd()
        handleResizeEnd()
      }
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }
    }
  }, [dragState, resizeState, handleDragMove, handleResizeMove, handleDragEnd, handleResizeEnd])

  const handleTaskbarClick = useCallback((windowId) => {
    const win = windows[windowId]
    if (!win) return
    if (win.isMinimized) {
      openWindow(windowId)
    } else if (activeWindow === windowId) {
      minimizeWindow(windowId)
    } else {
      focusWindow(windowId)
    }
  }, [windows, activeWindow, openWindow, minimizeWindow, focusWindow])

  // Open meme studio with coin context pre-loaded
  const openMemeStudioWithCoin = useCallback((coin) => {
    setCoinContextForEditor(coin)
    openWindow('shitpost')
  }, [openWindow])

  // Clear coin context after it's been used
  const clearCoinContext = useCallback(() => {
    setCoinContextForEditor(null)
  }, [])

  // Open meme studio with sticker context pre-loaded
  const openMemeStudioWithSticker = useCallback((sticker) => {
    setStickerContextForEditor(sticker)
    openWindow('shitpost')
  }, [openWindow])

  // Clear sticker context after it's been used
  const clearStickerContext = useCallback(() => {
    setStickerContextForEditor(null)
  }, [])


  // Render window content based on type
  const renderWindowContent = (windowId) => {
    const config = WINDOW_CONFIGS[windowId]
    if (!config) return null

    switch (config.component) {
      case 'shitpost':
        return (
          <App
            onMinimize={() => minimizeWindow(windowId)}
            onMaximize={() => maximizeWindow(windowId)}
            onClose={() => closeWindow(windowId)}
            isDesktopMode={true}
            onMintSuccess={refetchNFTs}
            coinContext={coinContextForEditor}
            onCoinContextUsed={clearCoinContext}
            stickerContext={stickerContextForEditor}
            onStickerContextUsed={clearStickerContext}
            onConnectWallet={() => setShowWalletModal(true)}
          />
        )
      case 'coinExplorer':
        return (
          <CoinExplorer
            onMakeMeme={openMemeStudioWithCoin}
            onAddSticker={openMemeStudioWithSticker}
            onClose={() => closeWindow(windowId)}
            onMinimize={() => minimizeWindow(windowId)}
            onMaximize={() => maximizeWindow(windowId)}
            isDesktopMode={true}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="xp-desktop">
      {/* Boot Screen */}
      <BootScreen onComplete={() => setBootComplete(true)} />

      {/* Desktop wallpaper */}
      <div className="desktop-wallpaper" />

      {/* Desktop Icons */}
      <div className="desktop-icons" data-onboarding="desktop-icons">
        <DesktopIcon
          icon="💩"
          label="shitpost.pro"
          onClick={() => openWindow('shitpost')}
          isActive={windows.shitpost?.isOpen && !windows.shitpost?.isMinimized}
        />

        <DesktopIcon
          icon={<img src="/images/chart-computer-icon.svg" alt="Coin Explorer" style={{ width: '100%', height: '100%' }} />}
          label="Coin Explorer"
          onClick={() => openWindow('coinExplorer')}
          isActive={windows.coinExplorer?.isOpen && !windows.coinExplorer?.isMinimized}
        />

        <DesktopIcon
          icon="❓"
          label="Help"
          onClick={() => restartOnboardingRef.current?.()}
        />

        <DesktopIcon
          icon={isConnected ? "✅" : "💼"}
          label={
            isConnected ? `SOL: ${address?.slice(0, 4)}...` :
            "Connect Wallet"
          }
          onClick={() => setShowWalletModal(true)}
          isActive={showWalletModal}
        />


        {/* NFT Icons */}
        {isConnected && nfts && nfts.length > 0 && nfts.map((nft) => (
          <NFTDesktopIcon
            key={nft.tokenId}
            nft={nft}
            onClick={(nft) => setViewingNFT(nft)}
            isActive={viewingNFT?.tokenId === nft.tokenId}
          />
        ))}

        {/* Loading indicator for NFTs - only show on initial load */}
        {isConnected && nftsLoading && nfts.length === 0 && (
          <div className="desktop-icon loading">
            <div className="desktop-icon-image">⏳</div>
            <div className="desktop-icon-label">Loading...</div>
          </div>
        )}

        {/* Recycle Bin - always visible for onboarding, functional when connected */}
        <RecycleBin onDrop={isConnected ? (nft) => setBurningNFT(nft) : null} />
      </div>

      {/* Render all open windows */}
      {Object.entries(windows).map(([windowId, win]) => {
        if (!win.isOpen || win.isMinimized) return null
        const config = WINDOW_CONFIGS[windowId]
        if (!config) return null

        const position = win.position || { x: 120, y: 40 }
        const hasCustomSize = win.size?.width || win.size?.height
        const width = win.size?.width || config.width
        const height = win.size?.height || config.height

        return (
          <div
            key={windowId}
            className={`desktop-window ${activeWindow === windowId ? 'active' : ''} ${dragState?.windowId === windowId ? 'dragging' : ''} ${hasCustomSize ? 'resized' : ''}`}
            data-onboarding={windowId === 'shitpost' ? 'meme-studio-window' : undefined}
            style={{
              zIndex: win.zIndex,
              position: 'absolute',
              left: position.x,
              top: position.y,
              width: width ? `${width}px` : 'auto',
              height: height ? `${height}px` : 'auto',
            }}
            onClick={() => focusWindow(windowId)}
          >
            {/* Mobile close button - skip for shitpost as it has its own in LeftToolbar */}
            {windowId !== 'shitpost' && (
              <button
                className="mobile-window-close"
                onClick={(e) => {
                  e.stopPropagation()
                  closeWindow(windowId)
                }}
                aria-label="Close window"
              >
                ✕
              </button>
            )}

            {/* Draggable title bar overlay */}
            <div
              className="window-drag-handle"
              onMouseDown={(e) => handleDragStart(windowId, e)}
            />

            {renderWindowContent(windowId)}

            {/* Resize handles */}
            <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeStart(windowId, 'n', e)} />
            <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(windowId, 's', e)} />
            <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(windowId, 'e', e)} />
            <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeStart(windowId, 'w', e)} />
            <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(windowId, 'ne', e)} />
            <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(windowId, 'nw', e)} />
            <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(windowId, 'se', e)} />
            <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(windowId, 'sw', e)} />
          </div>
        )
      })}

      {/* NFT Viewer Window */}
      {viewingNFT && (
        <div
          className="desktop-window active"
          style={{
            zIndex: highestZIndex + 10,
            position: 'absolute',
            left: 200,
            top: 100,
            width: 320,
          }}
        >
          {/* Mobile close button */}
          <button
            className="mobile-window-close"
            onClick={() => setViewingNFT(null)}
            aria-label="Close window"
          >
            ✕
          </button>
          <Window
            title={viewingNFT.name}
            className="nft-viewer-window"
            onClose={() => setViewingNFT(null)}
            showControls={true}
          >
            <div className="nft-viewer-content">
              <div className="nft-viewer-image">
                {viewingNFT.image ? (
                  <img src={viewingNFT.image} alt={viewingNFT.name} />
                ) : (
                  <div className="nft-placeholder">🖼️</div>
                )}
              </div>
              <div className="nft-viewer-info">
                <p className="nft-description">
                  {viewingNFT.description || 'A shitpost.pro NFT'}
                </p>
                <p className="nft-token-id">Token ID: {viewingNFT.tokenId}</p>
              </div>
            </div>
          </Window>
        </div>
      )}

      {/* Burn Modal */}
      <BurnModal
        isOpen={!!burningNFT}
        onClose={() => setBurningNFT(null)}
        onSuccess={() => {
          setBurningNFT(null)
          // Delay refetch to allow blockchain to update
          setTimeout(() => refetchNFTs(), 2000)
        }}
        nft={burningNFT}
      />

      {/* Burn Ticker (Buyback Feed) */}
      {showBurnTicker && (
        <div
          className="desktop-window active"
          style={{
            zIndex: highestZIndex + 22,
            position: 'absolute',
            right: 20,
            top: 60,
            width: 360,
            height: 450,
          }}
        >
          <div className="title-bar">
            <div className="title-bar-text">🔥 Burn Feed - shitpost.pro</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize" />
              <button aria-label="Maximize" />
              <button aria-label="Close" onClick={() => setShowBurnTicker(false)} />
            </div>
          </div>
          <div className="window-body" style={{ padding: 0, height: 'calc(100% - 28px)' }}>
            <BurnTicker />
          </div>
        </div>
      )}

      {/* Desktop Assistant (rotating characters) */}
      <DesktopAssistant
        onOpenMemeStudio={() => openWindow('shitpost')}
        onMinimizeMemeStudio={() => minimizeWindow('shitpost')}
        bootComplete={bootComplete}
        onRegisterRestart={(fn) => { restartOnboardingRef.current = fn }}
      />

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        windowConfigs={WINDOW_CONFIGS}
        activeWindow={activeWindow}
        onWindowClick={handleTaskbarClick}
        onWindowDoubleClick={centerWindow}
        onOpenWindow={openWindow}
        onConnectWallet={() => setShowWalletModal(true)}
        onShowHelp={() => restartOnboardingRef.current?.()}
        isWalletConnected={isConnected}
        walletAddress={address}
      />

      {/* Blue Screen of Death easter egg */}
      {showBSOD && <BlueScreen onClose={() => setShowBSOD(false)} />}

      {/* Wallet Connect Modal */}
      <ConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}
