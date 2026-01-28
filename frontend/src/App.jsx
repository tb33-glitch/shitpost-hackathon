import { useState, useCallback, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

// Components
import { Window, StatusBar } from './components/Windows98'
import { ConnectButton } from './components/Wallet'
import { MintModal } from './components/Mint'
import { MemeStudio } from './components/ObjectCanvas'

// Hooks
import useSounds from './hooks/useSounds'

// Styles
import '98.css'
import './styles/windows98.css'
import './styles/app.css'

export default function App({ onMinimize, onMaximize, onClose, isDesktopMode = false, onMintSuccess, coinContext = null, onCoinContextUsed = null, stickerContext = null, onStickerContextUsed = null, onConnectWallet }) {
  const { publicKey, connected } = useWallet()
  const address = publicKey?.toString()
  const [showMintModal, setShowMintModal] = useState(false)
  const [mintData, setMintData] = useState(null)

  const { playStartup, playSuccess, playMint } = useSounds()

  // Play startup sound on mount
  useEffect(() => {
    const timer = setTimeout(() => playStartup(), 500)
    return () => clearTimeout(timer)
  }, [playStartup])

  const handleMintClose = useCallback(() => {
    setShowMintModal(false)
  }, [])

  const handleMintSuccess = useCallback(() => {
    playMint()
    playSuccess()
    // Refresh NFT list on desktop after successful mint
    if (onMintSuccess) {
      // Small delay to allow blockchain to index the new NFT
      setTimeout(() => onMintSuccess(), 2000)
    }
  }, [playMint, playSuccess, onMintSuccess])

  const handleMint = useCallback((dataURL) => {
    setMintData({ dataURL })
    setShowMintModal(true)
  }, [])

  return (
    <div className={isDesktopMode ? "app-container" : "desktop"}>
      <div className="window-container">
        {/* Main Meme Studio Window */}
        <Window
          title="shitpost.pro - Meme Studio"
          className="paint-window meme-studio-window"
          onMinimize={isDesktopMode ? onMinimize : undefined}
          onMaximize={isDesktopMode ? onMaximize : undefined}
          onClose={isDesktopMode ? onClose : undefined}
          showControls={isDesktopMode}
        >
          <MemeStudio isDesktopMode={isDesktopMode} onMint={handleMint} coinContext={coinContext} onCoinContextUsed={onCoinContextUsed} stickerContext={stickerContext} onStickerContextUsed={onStickerContextUsed} onClose={onClose} />

          {/* Status Bar */}
          <StatusBar
            fields={[
              {
                content: connected
                  ? `${address?.slice(0, 4)}...${address?.slice(-4)}`
                  : 'Not connected',
                style: { flex: 1 },
              },
              { content: '1080 x 1080' },
            ]}
          >
            <ConnectButton />
          </StatusBar>
        </Window>
      </div>

      {/* Mint Modal */}
      <MintModal
        isOpen={showMintModal}
        onClose={handleMintClose}
        onSuccess={handleMintSuccess}
        imageDataURL={mintData?.dataURL}
        onConnectWallet={onConnectWallet}
      />
    </div>
  )
}
