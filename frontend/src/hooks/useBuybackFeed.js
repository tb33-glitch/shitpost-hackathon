import { useState, useEffect, useCallback, useRef } from 'react'

const WEBSOCKET_URL = import.meta.env.VITE_BUYBACK_WS_URL || 'ws://localhost:8080'
const API_URL = import.meta.env.VITE_BUYBACK_API_URL || 'http://localhost:3001'

/**
 * Hook for subscribing to real-time buyback/burn events
 */
export default function useBuybackFeed() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({
    solanaTotalBurned: '0',
    ethereumTotalBurned: '0',
    solanaBuybackCount: 0,
    ethereumBuybackCount: 0,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  // Fetch initial data from API
  const fetchInitialData = useCallback(async () => {
    try {
      // Fetch recent buybacks
      const eventsRes = await fetch(`${API_URL}/api/buybacks/recent?limit=20`)
      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || [])
      }

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/api/buybacks/stats`)
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (e) {
      // Silently fail - show empty state instead of error
      console.warn('[BuybackFeed] Failed to fetch initial data:', e)
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      wsRef.current = new WebSocket(WEBSOCKET_URL)

      wsRef.current.onopen = () => {
        console.log('[BuybackFeed] WebSocket connected')
        setIsConnected(true)
        setError(null)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'buyback') {
            // Add new event to the front
            setEvents(prev => [data, ...prev].slice(0, 50))

            // Update stats
            setStats(prev => ({
              ...prev,
              solanaTotalBurned: data.chain === 'solana' ? data.totalBurned : prev.solanaTotalBurned,
              ethereumTotalBurned: data.chain === 'ethereum' ? data.totalBurned : prev.ethereumTotalBurned,
              solanaBuybackCount: data.chain === 'solana' ? prev.solanaBuybackCount + 1 : prev.solanaBuybackCount,
              ethereumBuybackCount: data.chain === 'ethereum' ? prev.ethereumBuybackCount + 1 : prev.ethereumBuybackCount,
            }))
          }
        } catch (e) {
          console.warn('[BuybackFeed] Failed to parse message:', e)
        }
      }

      wsRef.current.onclose = () => {
        console.log('[BuybackFeed] WebSocket disconnected')
        setIsConnected(false)

        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }

      wsRef.current.onerror = (e) => {
        // Silently fail - show empty state instead of error
        console.warn('[BuybackFeed] WebSocket error:', e)
      }
    } catch (e) {
      // Silently fail - show empty state instead of error
      console.warn('[BuybackFeed] Failed to connect:', e)
    }
  }, [])

  // Initialize
  useEffect(() => {
    fetchInitialData()
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [fetchInitialData, connect])

  return {
    events,
    stats,
    isConnected,
    error,
  }
}
