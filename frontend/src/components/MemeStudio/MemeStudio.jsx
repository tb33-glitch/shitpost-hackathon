import { useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Window, StatusBar } from '../Windows98'
import { MemeEditor } from '../Editor'
import { MintModal } from '../Mint'
import { ConnectButton } from '../Wallet'
import useSounds from '../../hooks/useSounds'
import './MemeStudio.css'

/**
 * MemeStudio - Full meme creation studio window
 * This is the main shitpost.pro experience
 */
export default function MemeStudio({
  onMinimize,
  onClose,
  isDesktopMode = false,
  onConnectWallet
}) {
  const { publicKey, connected: isConnected } = useWallet()
  const address = publicKey?.toString()
  const [showMintModal, setShowMintModal] = useState(false)
  const [mintData, setMintData] = useState(null)
  const { playClick, playSuccess, playMint } = useSounds()

  const handleMint = useCallback((data) => {
    if (!isConnected) {
      alert('Please connect your wallet to mint')
      return
    }
    playClick()
    setMintData(data)
    setShowMintModal(true)
  }, [isConnected, playClick])

  const handleMintClose = useCallback(() => {
    setShowMintModal(false)
    setMintData(null)
  }, [])

  const handleMintSuccess = useCallback(() => {
    playMint()
    playSuccess()
    setShowMintModal(false)
  }, [playMint, playSuccess])

  const handleExport = useCallback((dataURL) => {
    // Download the image
    const link = document.createElement('a')
    link.download = `shitpost-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }, [])

  return (
    <div className="meme-studio-container">
      <Window
        title="shitpost.pro - Meme Studio"
        className="meme-studio-window"
        onMinimize={isDesktopMode ? onMinimize : undefined}
        onClose={isDesktopMode ? onClose : undefined}
        showControls={isDesktopMode}
      >
        <MemeEditor
          onMint={handleMint}
          onExport={handleExport}
        />

        <StatusBar
          fields={[
            {
              content: isConnected
                ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                : 'Not connected',
              style: { flex: 1 },
            },
            { content: 'Hemi Network' },
          ]}
        >
          <ConnectButton />
        </StatusBar>
      </Window>

      {/* Mint Modal */}
      <MintModal
        isOpen={showMintModal}
        onClose={handleMintClose}
        onSuccess={handleMintSuccess}
        imageDataURL={mintData?.dataURL}
        metadata={{
          template: mintData?.template?.name,
          category: mintData?.template?.category,
        }}
        onConnectWallet={onConnectWallet}
      />
    </div>
  )
}
