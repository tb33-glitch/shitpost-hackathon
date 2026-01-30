import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Window } from '../Windows98'
import './SubmitTemplateModal.css'

export default function SubmitTemplateModal({ isOpen, onClose, onSubmit, capturedImage, capturedPreview }) {
  const { publicKey } = useWallet()
  const address = publicKey?.toString()

  const [templateName, setTemplateName] = useState('')
  const [step, setStep] = useState('form') // form, uploading, success, error
  const [error, setError] = useState(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTemplateName('')
      setStep('form')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!capturedImage) {
      setError('No image captured')
      return
    }

    setStep('uploading')
    setError(null)

    try {
      // Convert blob to File object
      const file = new File([capturedImage], `template-${Date.now()}.png`, { type: 'image/png' })

      await onSubmit({
        file,
        name: templateName.trim() || `Template ${Date.now()}`,
        category: 'templates',
        tags: [],
        displayName: null,
        submittedBy: address || 'anonymous',
      })

      setStep('success')
    } catch (err) {
      console.error('[SubmitModal] Submit error:', err)
      setError(err.message || 'Failed to submit template')
      setStep('error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <Window title="Submit Template" className="submit-template-modal" onClose={onClose}>
        <div className="submit-modal-content">
          {step === 'form' && (
            <>
              {/* Canvas Preview */}
              <div className="canvas-preview-area">
                {capturedPreview ? (
                  <img src={capturedPreview} alt="Canvas Preview" className="canvas-preview" />
                ) : (
                  <div className="no-preview">No canvas content captured</div>
                )}
              </div>

              {/* Template Name */}
              <div className="form-group">
                <label>Template Name (optional)</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Distracted Boyfriend"
                  maxLength={50}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">{error}</div>
              )}

              {/* XP Notice */}
              <div className="xp-notice">
                Earn +10 XP for each template!
              </div>

              {/* Submit Button */}
              <div className="modal-buttons">
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={!capturedImage}
                >
                  Submit Template
                </button>
                <button className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'uploading' && (
            <div className="status-container">
              <div className="status-icon spinning">⏳</div>
              <div className="status-title">Saving template...</div>
              <div className="status-subtitle">This may take a moment</div>
            </div>
          )}

          {step === 'success' && (
            <div className="status-container success">
              <div className="status-icon">+10 XP</div>
              <div className="status-title">Template Submitted!</div>
              <div className="status-subtitle">
                Your template is now in the Community tab!
              </div>
              <div className="modal-buttons">
                <button className="submit-btn" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="status-container error">
              <div className="status-icon">X</div>
              <div className="status-title">Submission Failed</div>
              <div className="error-message">{error}</div>
              <div className="modal-buttons">
                <button className="submit-btn" onClick={() => setStep('form')}>
                  Try Again
                </button>
                <button className="cancel-btn" onClick={onClose}>
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
