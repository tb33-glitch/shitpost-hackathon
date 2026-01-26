import { useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getWalletXP, getLocalRegistry, saveLocalRegistry } from '../utils/templateRegistry'

const CLAIMED_PROFILES_KEY = 'shitpost-claimed-profiles'
const CLAIM_MESSAGE_PREFIX = 'I am claiming my shitpost.pro XP.\n\nWallet: '

/**
 * Hook for claiming XP with wallet signature (Solana version)
 *
 * This allows users to:
 * 1. Prove they own a wallet address by signing a message
 * 2. Persist their XP claim so it can be verified by others
 * 3. Set a display name that's linked to their verified wallet
 */
export default function useXPClaim() {
  const { publicKey, connected: isConnected, signMessage } = useWallet()
  const address = publicKey?.toString()
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState(null)

  // Get all claimed profiles from localStorage
  const getClaimedProfiles = useCallback(() => {
    try {
      const stored = localStorage.getItem(CLAIMED_PROFILES_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }, [])

  // Save claimed profiles to localStorage
  const saveClaimedProfiles = useCallback((profiles) => {
    try {
      localStorage.setItem(CLAIMED_PROFILES_KEY, JSON.stringify(profiles))
    } catch (e) {
      console.error('Failed to save claimed profiles:', e)
    }
  }, [])

  // Check if current wallet has claimed
  const hasClaimedXP = useCallback(() => {
    if (!address) return false
    const profiles = getClaimedProfiles()
    return !!profiles[address.toLowerCase()]
  }, [address, getClaimedProfiles])

  // Get claimed profile for an address
  const getClaimedProfile = useCallback((walletAddress) => {
    const profiles = getClaimedProfiles()
    return profiles[walletAddress?.toLowerCase()] || null
  }, [getClaimedProfiles])

  // Get my claimed profile
  const myClaimedProfile = useCallback(() => {
    if (!address) return null
    return getClaimedProfile(address)
  }, [address, getClaimedProfile])

  // Claim XP by signing a message
  const claimXP = useCallback(async (displayName = null) => {
    if (!isConnected || !address || !signMessage) {
      setError('Wallet not connected')
      return null
    }

    setIsClaiming(true)
    setError(null)

    try {
      // Get current XP stats
      const stats = getWalletXP(address)

      // Create the message to sign
      const timestamp = Date.now()
      const message = `${CLAIM_MESSAGE_PREFIX}${address}\nXP: ${stats.xp}\nTemplates: ${stats.templateCount}\nTimestamp: ${timestamp}`

      // Request signature from Solana wallet
      const encodedMessage = new TextEncoder().encode(message)
      const signatureBytes = await signMessage(encodedMessage)
      const signature = Buffer.from(signatureBytes).toString('base64')

      // Create the claimed profile
      const claimedProfile = {
        address: address.toLowerCase(),
        displayName: displayName || null,
        xp: stats.xp,
        templateCount: stats.templateCount,
        claimedAt: new Date(timestamp).toISOString(),
        signature,
        message,
      }

      // Save to local claimed profiles
      const profiles = getClaimedProfiles()
      profiles[address.toLowerCase()] = claimedProfile
      saveClaimedProfiles(profiles)

      // Also update the display name in the registry for all their templates
      if (displayName) {
        const registry = getLocalRegistry()
        registry.templates = registry.templates.map(t => {
          if (t.submittedBy?.toLowerCase() === address.toLowerCase()) {
            return { ...t, displayName }
          }
          return t
        })
        saveLocalRegistry(registry)
      }

      return claimedProfile
    } catch (err) {
      console.error('Failed to claim XP:', err)
      setError(err.message || 'Failed to sign message')
      return null
    } finally {
      setIsClaiming(false)
    }
  }, [address, isConnected, signMessage, getClaimedProfiles, saveClaimedProfiles])

  // Update display name (requires re-signing)
  const updateDisplayName = useCallback(async (newDisplayName) => {
    return claimXP(newDisplayName)
  }, [claimXP])

  // Verify a claimed profile signature
  const verifyClaimedProfile = useCallback((profile) => {
    // In a production app, you'd verify the signature on-chain
    // For now, we trust localStorage but the signature is there for future verification
    return profile && profile.signature && profile.address
  }, [])

  // Refresh XP (re-claim with updated stats)
  const refreshXP = useCallback(async () => {
    const existingProfile = myClaimedProfile()
    return claimXP(existingProfile?.displayName)
  }, [claimXP, myClaimedProfile])

  return {
    // State
    isClaiming,
    error,

    // Checks
    hasClaimedXP,
    myClaimedProfile,
    getClaimedProfile,

    // Actions
    claimXP,
    updateDisplayName,
    refreshXP,
    verifyClaimedProfile,

    // Utils
    getClaimedProfiles,
  }
}
