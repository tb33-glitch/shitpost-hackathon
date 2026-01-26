import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getLeaderboard, getWalletXP, syncRegistryFromIPFS } from '../utils/templateRegistry'

export default function useLeaderboard() {
  const { publicKey, connected: isConnected } = useWallet()
  const address = publicKey?.toString()
  const [leaderboard, setLeaderboard] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [userRank, setUserRank] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true)

    try {
      // Sync from IPFS first
      await syncRegistryFromIPFS()

      // Get leaderboard
      const lb = getLeaderboard()
      setLeaderboard(lb)

      // Get user stats if connected
      if (isConnected && address) {
        const stats = getWalletXP(address)
        setUserStats(stats)

        // Calculate user rank
        const rank = lb.findIndex(
          entry => entry.address?.toLowerCase() === address?.toLowerCase()
        ) + 1
        setUserRank(rank > 0 ? rank : null)
      } else {
        setUserStats(null)
        setUserRank(null)
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  // Load on mount and when wallet changes
  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  // Refresh periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(loadLeaderboard, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadLeaderboard])

  return {
    leaderboard,
    userStats,
    userRank,
    isLoading,
    refresh: loadLeaderboard,
  }
}
