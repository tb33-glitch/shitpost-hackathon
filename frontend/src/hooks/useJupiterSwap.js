import { useState, useCallback } from 'react'
import { VersionedTransaction } from '@solana/web3.js'

// Jupiter API endpoints (lite-api is public, no API key required)
// Note: lite-api.jup.ag will be deprecated Jan 31, 2026 - migrate to api.jup.ag with API key
const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote'
const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap'

// SOL mint address
export const SOL_MINT = 'So11111111111111111111111111111111111111112'

// Platform fee configuration (0.5% fee on all swaps)
// Fee account must be a wSOL token account (ATA) owned by the treasury wallet
// To set up:
// 1. Set VITE_SOLANA_FEE_ACCOUNT in .env to your treasury's wSOL ATA address
// 2. Ensure the treasury wallet has wrapped some SOL to create the wSOL account
//
// Fee account is the wSOL Associated Token Account for the treasury
const FEE_ACCOUNT = import.meta.env.VITE_SOLANA_FEE_ACCOUNT || ''
const FEE_ENABLED = !!FEE_ACCOUNT // Auto-enable when fee account is configured
const PLATFORM_FEE_BPS = 50 // 0.5% fee (50 basis points)

/**
 * Hook for Jupiter swap API
 */
export default function useJupiterSwap() {
  const [quote, setQuote] = useState(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Get a quote for a swap
   */
  const getQuote = useCallback(async ({
    inputMint,
    outputMint,
    amount, // in smallest units (lamports for SOL)
    slippageBps = 50, // 0.5% default slippage
  }) => {
    if (!inputMint || !outputMint || !amount || amount === '0') {
      setQuote(null)
      return null
    }

    setIsLoadingQuote(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
        ...(FEE_ENABLED && { platformFeeBps: PLATFORM_FEE_BPS.toString() }),
      })

      const response = await fetch(`${JUPITER_QUOTE_API}?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Provide more helpful error messages
        if (errorData.error?.includes('Could not find any route')) {
          throw new Error('No route found - token may not have Jupiter liquidity')
        }
        throw new Error(errorData.error || 'Failed to get quote')
      }

      const quoteData = await response.json()
      setQuote(quoteData)
      return quoteData
    } catch (err) {
      console.error('Quote error:', err)
      // Handle network errors gracefully
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Network error - check your connection')
      } else {
        setError(err.message || 'Failed to get quote')
      }
      setQuote(null)
      return null
    } finally {
      setIsLoadingQuote(false)
    }
  }, [])

  /**
   * Execute a swap
   */
  const executeSwap = useCallback(async ({
    wallet, // Solana wallet adapter (from useWallet)
    connection, // Solana connection (from useConnection)
    quoteResponse, // Quote from getQuote
  }) => {
    if (!wallet?.publicKey || !quoteResponse) {
      setError('Wallet not connected or no quote')
      return null
    }

    setIsSwapping(true)
    setError(null)

    try {
      // Get the swap transaction from Jupiter
      const swapResponse = await fetch(JUPITER_SWAP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          ...(FEE_ENABLED && { feeAccount: FEE_ACCOUNT }),
        }),
      })

      if (!swapResponse.ok) {
        const errorData = await swapResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get swap transaction')
      }

      const { swapTransaction } = await swapResponse.json()

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

      // Sign the transaction
      const signedTransaction = await wallet.signTransaction(transaction)

      // Send the transaction with proper settings for Address Lookup Tables
      const txid = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      })

      // Wait for confirmation with timeout
      const confirmation = await connection.confirmTransaction(
        {
          signature: txid,
          blockhash: transaction.message.recentBlockhash,
          lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
        },
        'confirmed'
      )

      return txid
    } catch (err) {
      console.error('Swap error:', err)
      setError(err.message || 'Swap failed')
      return null
    } finally {
      setIsSwapping(false)
    }
  }, [])

  /**
   * Clear state
   */
  const reset = useCallback(() => {
    setQuote(null)
    setError(null)
  }, [])

  return {
    quote,
    isLoadingQuote,
    isSwapping,
    error,
    getQuote,
    executeSwap,
    reset,
  }
}

/**
 * Format token amount from smallest units
 */
export function formatTokenAmount(amount, decimals) {
  if (!amount) return '0'
  const value = Number(amount) / Math.pow(10, decimals)
  if (value < 0.000001) return value.toExponential(2)
  if (value < 0.01) return value.toFixed(6)
  if (value < 1) return value.toFixed(4)
  if (value < 1000) return value.toFixed(2)
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/**
 * Parse token amount to smallest units
 */
export function parseTokenAmount(amount, decimals) {
  if (!amount || isNaN(amount)) return '0'
  return Math.floor(Number(amount) * Math.pow(10, decimals)).toString()
}
