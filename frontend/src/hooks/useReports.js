import { useState, useEffect, useCallback } from 'react'
import { removeFromRegistry, getLocalRegistry, saveLocalRegistry } from '../utils/templateRegistry'

const REPORTS_KEY = 'shitpost-reports'
const XP_PENALTY = 50

export default function useReports() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadReports = useCallback(() => {
    try {
      const stored = localStorage.getItem(REPORTS_KEY)
      if (stored) {
        setReports(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load reports:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  /**
   * Submit a new report
   */
  const submitReport = useCallback((report) => {
    const newReports = [...reports, { ...report, id: `report-${Date.now()}`, status: 'pending' }]
    localStorage.setItem(REPORTS_KEY, JSON.stringify(newReports))
    setReports(newReports)
    return report
  }, [reports])

  /**
   * Get pending reports (admin function)
   */
  const getPendingReports = useCallback(() => {
    return reports.filter(r => r.status === 'pending')
  }, [reports])

  /**
   * Uphold a report - remove the template and penalize XP
   */
  const upholdReport = useCallback((reportId) => {
    const report = reports.find(r => r.id === reportId)
    if (!report) return

    // Remove template from registry
    if (report.templateCid) {
      removeFromRegistry(report.templateCid)
    }

    // Penalize the submitter's XP
    if (report.templateSubmitter) {
      const registry = getLocalRegistry()
      registry.templates.forEach(t => {
        if (t.submittedBy === report.templateSubmitter) {
          // Reduce XP for upheld reports
          t.xpPenalty = (t.xpPenalty || 0) + XP_PENALTY
        }
      })
      saveLocalRegistry(registry)
    }

    // Mark report as upheld
    const updatedReports = reports.map(r =>
      r.id === reportId ? { ...r, status: 'upheld', resolvedAt: new Date().toISOString() } : r
    )
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports))
    setReports(updatedReports)
  }, [reports])

  /**
   * Dismiss a report - keep the template
   */
  const dismissReport = useCallback((reportId) => {
    const updatedReports = reports.map(r =>
      r.id === reportId ? { ...r, status: 'dismissed', resolvedAt: new Date().toISOString() } : r
    )
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports))
    setReports(updatedReports)
  }, [reports])

  /**
   * Get report counts by status
   */
  const getReportCounts = useCallback(() => {
    return {
      pending: reports.filter(r => r.status === 'pending').length,
      upheld: reports.filter(r => r.status === 'upheld').length,
      dismissed: reports.filter(r => r.status === 'dismissed').length,
      total: reports.length,
    }
  }, [reports])

  /**
   * Clear all reports (admin function)
   */
  const clearReports = useCallback(() => {
    localStorage.removeItem(REPORTS_KEY)
    setReports([])
  }, [])

  return {
    reports,
    isLoading,
    submitReport,
    getPendingReports,
    upholdReport,
    dismissReport,
    getReportCounts,
    clearReports,
    refresh: loadReports,
  }
}
