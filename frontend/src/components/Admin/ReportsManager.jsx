import { useState, useEffect, useCallback } from 'react'
import { removeFromRegistry } from '../../utils/templateRegistry'

const REPORTS_KEY = 'shitpost-reports'

export function ReportsManager() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('all') // all, pending, resolved

  // Load reports from localStorage
  useEffect(() => {
    const loadReports = () => {
      try {
        const stored = localStorage.getItem(REPORTS_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Add status field if not present
          const withStatus = parsed.map(r => ({
            ...r,
            status: r.status || 'pending'
          }))
          setReports(withStatus)
        }
      } catch (e) {
        console.error('Failed to load reports:', e)
      }
    }
    loadReports()
  }, [])

  // Save reports to localStorage
  const saveReports = useCallback((newReports) => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(newReports))
    setReports(newReports)
  }, [])

  // Dismiss a report (mark as resolved, keep template)
  const handleDismiss = useCallback((reportIndex) => {
    const newReports = [...reports]
    newReports[reportIndex] = { ...newReports[reportIndex], status: 'dismissed' }
    saveReports(newReports)
  }, [reports, saveReports])

  // Uphold a report (remove template, mark resolved)
  const handleUphold = useCallback((reportIndex) => {
    const report = reports[reportIndex]

    // Remove template from registry if it has a CID
    if (report.templateCid) {
      removeFromRegistry(report.templateCid)
    }

    const newReports = [...reports]
    newReports[reportIndex] = { ...newReports[reportIndex], status: 'upheld' }
    saveReports(newReports)
  }, [reports, saveReports])

  // Delete a report entirely
  const handleDelete = useCallback((reportIndex) => {
    const newReports = reports.filter((_, i) => i !== reportIndex)
    saveReports(newReports)
  }, [reports, saveReports])

  // Clear all resolved reports
  const handleClearResolved = useCallback(() => {
    const pending = reports.filter(r => r.status === 'pending')
    saveReports(pending)
  }, [reports, saveReports])

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'resolved') return r.status !== 'pending'
    return true
  })

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    upheld: reports.filter(r => r.status === 'upheld').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  return (
    <div className="reports-manager-container">
      <div className="reports-header">
        <h2>Template Reports ({stats.pending} pending)</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
          >
            <option value="all">All Reports ({stats.total})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="resolved">Resolved ({stats.upheld + stats.dismissed})</option>
          </select>
          {stats.upheld + stats.dismissed > 0 && (
            <button
              onClick={handleClearResolved}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Clear Resolved
            </button>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="reports-empty">
          <p>No reports yet</p>
          <p style={{ fontSize: '0.875rem', color: '#999' }}>
            Reports submitted by users will appear here
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="reports-empty">
          <p>No {filter} reports</p>
        </div>
      ) : (
        <div className="reports-list">
          {filteredReports.map((report, index) => {
            const originalIndex = reports.indexOf(report)
            return (
              <div
                key={`${report.reportedAt}-${index}`}
                className={`report-card ${report.status}`}
              >
                <div className="report-header">
                  <div className="report-template">
                    <strong>{report.templateName || 'Unknown Template'}</strong>
                    {report.templateCid && (
                      <span className="report-cid" title={report.templateCid}>
                        {report.templateCid.substring(0, 12)}...
                      </span>
                    )}
                  </div>
                  <span className={`report-status status-${report.status}`}>
                    {report.status}
                  </span>
                </div>

                <div className="report-reason">
                  <span className="reason-badge">{report.reason}</span>
                  {report.additionalInfo && (
                    <p className="report-details">{report.additionalInfo}</p>
                  )}
                </div>

                <div className="report-meta">
                  <span>Reported by: {report.reportedBy?.substring(0, 10) || 'anonymous'}...</span>
                  <span>Template by: {report.templateSubmitter?.substring(0, 10) || 'unknown'}...</span>
                  <span>{new Date(report.reportedAt).toLocaleString()}</span>
                </div>

                {report.status === 'pending' && (
                  <div className="report-actions">
                    <button
                      className="action-btn uphold"
                      onClick={() => handleUphold(originalIndex)}
                    >
                      Uphold (Remove Template)
                    </button>
                    <button
                      className="action-btn dismiss"
                      onClick={() => handleDismiss(originalIndex)}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {report.status !== 'pending' && (
                  <div className="report-actions">
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(originalIndex)}
                    >
                      Delete Report
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f5f7fa',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#666',
      }}>
        <strong>Actions:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li><strong>Uphold</strong> - Removes the template from the community registry</li>
          <li><strong>Dismiss</strong> - Keeps the template, marks report as resolved</li>
        </ul>
      </div>
    </div>
  )
}

export default ReportsManager
