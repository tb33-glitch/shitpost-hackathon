import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Window } from '../Windows98'
import useSolanaMint from '../../hooks/useSolanaMint'
import useIPFS from '../../hooks/useIPFS'
import solanaIdl from '../../contracts/idl/shitpost_pro.json'

export default function MintModal({ isOpen, onClose, onSuccess, imageDataURL, onConnectWallet }) {
  // Solana wallet
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()

  // Solana minting
  const {
    mint,
    signature,
    isPending,
    isConfirming,
    isSuccess,
    error: mintError,
    reset: mintReset,
  } = useSolanaMint('devnet')

  // IPFS upload
  const { upload, error: ipfsError } = useIPFS()

  // UI state
  const [step, setStep] = useState('confirm') // confirm, uploading, minting, success, error
  const [txError, setTxError] = useState(null)
  const [processedHash, setProcessedHash] = useState(null)
  const [txHash, setTxHash] = useState(null)

  // Handle mint success
  useEffect(() => {
    if (isSuccess && signature && signature !== processedHash) {
      setProcessedHash(signature)
      setTxHash(signature)
      setStep('success')
      if (onSuccess) {
        onSuccess()
      }
    }
  }, [isSuccess, signature, onSuccess, processedHash])

  // Handle errors
  useEffect(() => {
    if (mintError || ipfsError) {
      setTxError(mintError?.message || ipfsError || 'Unknown error')
      setStep('error')
    }
  }, [mintError, ipfsError])

  const handleMint = async () => {
    if (!connected) {
      setTxError('Please connect your wallet first')
      setStep('error')
      return
    }

    try {
      setStep('uploading')

      // Convert data URL to blob
      const response = await fetch(imageDataURL)
      const blob = await response.blob()

      // Upload to IPFS - use a timestamp as token ID for now
      console.log('Uploading to IPFS...')
      const tokenId = Date.now()
      const { metadataUrl } = await upload(blob, tokenId)
      console.log('IPFS upload complete:', metadataUrl)

      setStep('minting')

      // Call Solana mint
      console.log('Minting on Solana...')
      await mint(metadataUrl, solanaIdl)
    } catch (err) {
      console.error('Mint error:', err)
      const errorMessage = err?.shortMessage || err?.message || 'Unknown error'
      setTxError(errorMessage)
      setStep('error')
    }
  }

  const handleClose = () => {
    setStep('confirm')
    setTxError(null)
    setTxHash(null)
    mintReset()
    onClose()
  }

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm')
      setTxError(null)
      setProcessedHash(null)
      setTxHash(null)
      mintReset()
    }
  }, [isOpen, mintReset])

  if (!isOpen) return null

  // Solana explorer URL
  const explorerUrl = txHash
    ? `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
    : null

  return (
    <div className="modal-overlay">
      <Window title="Mint NFT" className="modal-window" onClose={handleClose}>
        <div className="modal-content">
          {step === 'confirm' && (
            <>
              <p style={{ textAlign: 'center', marginBottom: '8px' }}>
                Ready to mint your masterpiece?
              </p>

              <div className="modal-preview">
                <img src={imageDataURL} alt="Your artwork" />
              </div>

              <div className="fee-notice">
                Minting on: <strong>Solana Devnet</strong>
                <br />
                Mint fee: <strong>~0.01 SOL</strong>
              </div>

              <div className="modal-buttons">
                {connected ? (
                  <button onClick={handleMint}>
                    Mint It!
                  </button>
                ) : (
                  <button onClick={onConnectWallet}>
                    Connect Wallet First
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'uploading' && (
            <div className="tx-status pending">
              <div className="status-icon">⏳</div>
              <div className="status-title">Uploading to IPFS...</div>
              <div className="status-subtitle">Please wait</div>
            </div>
          )}

          {step === 'minting' && (
            <div className="tx-status pending">
              <div className="status-icon">⏳</div>
              <div className="status-title">
                {isPending ? 'Confirm in Wallet' : 'Minting...'}
              </div>
              <div className="status-subtitle">
                {isConfirming ? 'Waiting for confirmation...' : 'Check your wallet for the transaction'}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="tx-status success">
              <div className="status-icon">🎉</div>
              <div className="status-title">Minted Successfully!</div>

              <div className="modal-preview">
                <img src={imageDataURL} alt="Your artwork" />
              </div>

              <div className="modal-actions">
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    🔗 View on Solana Explorer
                  </a>
                )}
                <button className="primary-btn" onClick={handleClose}>
                  ✨ Create Another
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="tx-status error">
              <div className="status-icon">❌</div>
              <div className="status-title">Minting Failed</div>
              <div className="error-message">{txError}</div>
              <div className="error-hint">
                Make sure you have SOL for gas fees.
              </div>

              <div className="modal-actions">
                <button className="primary-btn" onClick={() => setStep('confirm')}>
                  Try Again
                </button>
                <button className="secondary-btn" onClick={handleClose}>
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </Window>
    </div>
  )
}
