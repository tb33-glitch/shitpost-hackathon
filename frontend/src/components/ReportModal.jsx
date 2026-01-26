import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Window } from './Windows98'
import './ReportModal.css'

const REPORT_REASONS = [
  { value: 'nsfw', label: 'NSFW / Inappropriate Content' },
  { value: 'copyright', label: 'Copyright Violation' },
  { value: 'spam', label: 'Spam / Low Quality' },
  { value: 'offensive', label: 'Offensive / Hateful' },
  { value: 'other', label: 'Other' },
]

export default function ReportModal({ isOpen, onClose, template, onSubmit }) {
  const { publicKey, connected: isConnected } = useWallet()
  const address = publicKey?.toString()
  const [selectedReason, setSelectedReason] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [step, setStep] = useState('form') // form, submitting, success, error
  const [error, setError] = useState(null)

  const resetForm = () => {
    setSelectedReason('')
    setAdditionalInfo('')
    setStep('form')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason for reporting')
      return
    }

    setStep('submitting')
    setError(null)

    try {
      const report = {
        templateCid: template?.cid,
        templateName: template?.name,
        templateSubmitter: template?.submittedBy,
        reason: selectedReason,
        additionalInfo: additionalInfo.trim() || null,
        reportedBy: address || 'anonymous',
        reportedAt: new Date().toISOString(),
      }

      // Store report in localStorage for admin review
      const reports = JSON.parse(localStorage.getItem('shitpost-reports') || '[]')
      reports.push(report)
      localStorage.setItem('shitpost-reports', JSON.stringify(reports))

      // If onSubmit callback provided, call it
      if (onSubmit) {
        await onSubmit(report)
      }

      setStep('success')
    } catch (err) {
      console.error('Report submission error:', err)
      setError(err.message || 'Failed to submit report')
      setStep('error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <Window title="Report Template" className="report-modal" onClose={handleClose}>
        <div className="report-modal-content">
          {step === 'form' && (
            <>
              {/* Template Info */}
              {template && (
                <div className="report-template-info">
                  <span className="template-label">Reporting:</span>
                  <span className="template-name">{template.name}</span>
                </div>
              )}

              {/* Reason Selection */}
              <div className="form-group">
                <label>Why are you reporting this template? *</label>
                <div className="reason-options">
                  {REPORT_REASONS.map(reason => (
                    <label key={reason.value} className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                      />
                      <span className="reason-label">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="form-group">
                <label>Additional Details (optional)</label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Provide any additional context..."
                  maxLength={500}
                  rows={3}
                />
              </div>

              {/* Warning */}
              <div className="report-warning">
                False reports may result in your account being flagged.
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">{error}</div>
              )}

              {/* Buttons */}
              <div className="modal-buttons">
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={!selectedReason}
                >
                  Submit Report
                </button>
                <button className="cancel-btn" onClick={handleClose}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'submitting' && (
            <div className="status-container">
              <div className="status-icon spinning">*</div>
              <div className="status-title">Submitting Report...</div>
            </div>
          )}

          {step === 'success' && (
            <div className="status-container success">
              <div className="status-icon">OK</div>
              <div className="status-title">Report Submitted</div>
              <div className="status-subtitle">
                Thank you for helping keep the community safe.
                <br />
                Our team will review this report.
              </div>
              <div className="modal-buttons">
                <button className="submit-btn" onClick={handleClose}>
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
                <button className="cancel-btn" onClick={handleClose}>
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
