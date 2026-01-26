import { useState, useEffect, useCallback } from 'react'
import { getCommunityTemplates, syncRegistryFromIPFS } from '../utils/templateRegistry'

export default function useCommunityTemplates() {
  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const communityTemplates = await getCommunityTemplates()
      setTemplates(communityTemplates)
    } catch (err) {
      console.error('Failed to load community templates:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  // Sync from IPFS periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await syncRegistryFromIPFS()
        const communityTemplates = await getCommunityTemplates()
        setTemplates(communityTemplates)
      } catch (err) {
        console.error('Periodic sync failed:', err)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const refresh = useCallback(async () => {
    await syncRegistryFromIPFS()
    await loadTemplates()
  }, [loadTemplates])

  return {
    templates,
    isLoading,
    error,
    refresh,
  }
}
