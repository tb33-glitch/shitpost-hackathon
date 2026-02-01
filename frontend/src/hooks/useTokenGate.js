import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { SHITPOST_TOKEN_MINT } from '../config/solana'

// Minimum $SHITPOST tokens required for premium features (1000 tokens)
const MIN_TOKEN_AMOUNT = 1000

export default function useTokenGate() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [tokenBalance, setTokenBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  const checkTokenBalance = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setTokenBalance(0)
      setHasAccess(false)
      return
    }

    setIsLoading(true)

    try {
      // Get all token accounts for the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { mint: new PublicKey(SHITPOST_TOKEN_MINT) }
      )

      let totalBalance = 0

      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info
        const amount = parsedInfo.tokenAmount.uiAmount || 0
        totalBalance += amount
      }

      console.log('[TokenGate] $SHITPOST balance:', totalBalance)
      setTokenBalance(totalBalance)
      setHasAccess(totalBalance >= MIN_TOKEN_AMOUNT)
    } catch (err) {
      console.error('[TokenGate] Failed to check token balance:', err)
      setTokenBalance(0)
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }, [connection, wallet.connected, wallet.publicKey])

  // Check balance on mount and when wallet changes
  useEffect(() => {
    checkTokenBalance()
  }, [checkTokenBalance])

  return {
    tokenBalance,
    hasAccess,
    isLoading,
    minRequired: MIN_TOKEN_AMOUNT,
    refresh: checkTokenBalance,
  }
}
