import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Window } from '../Windows98'
import useSolanaBurn from '../../hooks/useSolanaBurn'
import solanaIdl from '../../contracts/idl/shitpost_pro.json'
import { DEFAULT_SOLANA_NETWORK, getExplorerCluster } from '../../config/solana'

export default function BurnModal({ isOpen, onClose, onSuccess, nft }) {
  const { connected } = useWallet()

  // Solana burn hook - uses network from config (VITE_SOLANA_NETWORK env var)
  const {
    burn: solanaBurn,
    signature,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset
  } = useSolanaBurn(DEFAULT_SOLANA_NETWORK)

  const [step, setStep] = useState('confirm') // confirm, burning, success, error
  const [txError, setTxError] = useState(null)

  useEffect(() => {
    if (isSuccess && signature) {
      setStep('success')
      if (onSuccess) {
        onSuccess()
      }
    }
  }, [isSuccess, signature, onSuccess])

  useEffect(() => {
    if (error) {
      setTxError(error?.shortMessage || error?.message || 'Transaction failed')
      setStep('error')
    }
  }, [error])

  const handleBurn = async () => {
    console.log('[BurnModal] Attempting burn with NFT:', nft)

    if (!nft?.tokenId) {
      console.error('[BurnModal] Invalid NFT data:', { tokenId: nft?.tokenId })
      setTxError('Invalid NFT data - missing mint address')
      setStep('error')
      return
    }

    if (!connected) {
      setTxError('Solana wallet not connected')
      setStep('error')
      return
    }

    try {
      setStep('burning')
      console.log('[BurnModal] Calling Solana burn:', { mintAddress: nft.tokenId })
      await solanaBurn(nft.tokenId, solanaIdl)
    } catch (err) {
      console.error('[BurnModal] Solana burn error:', err)
      setTxError(err?.message || 'Failed to burn NFT')
      setStep('error')
    }
  }

  const handleClose = () => {
    setStep('confirm')
    setTxError(null)
    reset()
    onClose()
  }

  if (!isOpen || !nft) return null

  return (
    <div className="modal-overlay">
      <Window title="Confirm Delete" className="modal-window burn-modal" onClose={handleClose}>
        <div className="modal-content">
          {step === 'confirm' && (
            <>
              <div className="burn-warning-header">
                <span className="burn-warning-icon">⚠️</span>
                <p>Are you sure you want to permanently delete this NFT?</p>
              </div>

              <div className="burn-preview">
                {nft.image ? (
                  <img src={nft.image} alt={nft.name} />
                ) : (
                  <div className="burn-placeholder">🖼️</div>
                )}
              </div>

              <div className="burn-info">
                <p className="burn-nft-name">{nft.name}</p>
                <p className="burn-nft-id">Token ID: {nft.tokenId}</p>
              </div>

              <div className="burn-warning-text">
                <p>🔥 This action is <strong>PERMANENT</strong> and cannot be undone.</p>
                <p>The NFT will be sent to the burn address.</p>
              </div>

              <div className="modal-buttons burn-buttons">
                <button className="burn-cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button className="burn-confirm" onClick={handleBurn}>
                  🔥 Burn Forever
                </button>
              </div>
            </>
          )}

          {step === 'burning' && (
            <div className="tx-status pending">
              <div className="status-icon">🔥</div>
              <div className="status-title">
                {isPending ? 'Confirm in Wallet' : 'Burning...'}
              </div>
              <div className="status-subtitle">
                {isConfirming ? 'Waiting for confirmation...' : 'Check your wallet for the transaction'}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="tx-status success burn-success">
              <div className="status-icon">💀</div>
              <div className="status-title">NFT Burned!</div>
              <div className="burn-rip">{nft.name} is gone forever.</div>

              <div className="modal-actions">
                {signature && (
                  <a
                    href={`https://explorer.solana.com/tx/${signature}${getExplorerCluster()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    🔗 View on Solana Explorer
                  </a>
                )}
                <button className="primary-btn" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="tx-status error">
              <div className="status-icon">❌</div>
              <div className="status-title">Burn Failed</div>
              <div className="error-message">{txError}</div>

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
