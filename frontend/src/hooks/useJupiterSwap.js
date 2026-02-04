import { useState, useCallback } from 'react'
import { VersionedTransaction, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

// Jupiter API endpoints (lite-api is public, no API key required)
// Note: lite-api.jup.ag will be deprecated Jan 31, 2026 - migrate to api.jup.ag with API key
const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote'
const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap'

// SOL mint address
export const SOL_MINT = 'So11111111111111111111111111111111111111112'

// Platform fee configuration (0.5% = 50 basis points)
// Fees are collected via direct SOL transfers (no wSOL account needed):
// - BUY (SOL → Token): Fee transferred to treasury BEFORE swap
// - SELL (Token → SOL): Fee transferred to treasury AFTER swap
const TREASURY_WALLET = import.meta.env.VITE_TREASURY_ADDRESS_SOLANA || '6tj7iWbyTmwcEg1R8gLmqNkJUxXBkRDcFZMYV4pEqtJn'
const FEE_ENABLED = true
const PLATFORM_FEE_BPS = 50 // 0.5% fee

/**
 * Check if this is a BUY (input is SOL, output is token)
 */
function isBuyOrder(inputMint) {
  return inputMint === SOL_MINT
}

/**
 * Check if this is a SELL (input is token, output is SOL)
 */
function isSellOrder(outputMint) {
  return outputMint === SOL_MINT
}

/**
 * Calculate fee amount in lamports
 */
function calculateFee(amountLamports) {
  return Math.floor(Number(amountLamports) * PLATFORM_FEE_BPS / 10000)
}

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
      const isBuy = isBuyOrder(inputMint)
      const isSell = isSellOrder(outputMint)

      // For BUYS: We take fee from input SOL, so quote for reduced amount
      // For SELLS: We take fee from output SOL after swap (no Jupiter platformFee)
      let quoteAmount = amount.toString()
      let buyFeeAmount = 0

      if (FEE_ENABLED && isBuy) {
        buyFeeAmount = calculateFee(amount)
        quoteAmount = (Number(amount) - buyFeeAmount).toString()
        console.log('[Jupiter] Buy fee:', buyFeeAmount / LAMPORTS_PER_SOL, 'SOL')
      }

      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: quoteAmount,
        slippageBps: slippageBps.toString(),
        // No platformFeeBps - we handle fees via direct SOL transfer
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

      // Attach fee info to quote for display and execution
      quoteData._buyFeeAmount = buyFeeAmount
      quoteData._originalAmount = amount
      quoteData._isBuy = isBuy
      quoteData._isSell = isSell

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

    const isBuy = quoteResponse._isBuy
    const isSell = quoteResponse._isSell
    const buyFeeAmount = quoteResponse._buyFeeAmount || 0

    // Debug: Log wallet and connection info
    console.log('[Jupiter Swap] Debug info:', {
      walletPublicKey: wallet.publicKey?.toString(),
      rpcEndpoint: connection?.rpcEndpoint,
      inputMint: quoteResponse.inputMint,
      outputMint: quoteResponse.outputMint,
      inAmount: quoteResponse.inAmount,
      outAmount: quoteResponse.outAmount,
      isBuy,
      isSell,
      buyFeeAmount,
    })

    // Fetch and log SOL balance
    try {
      const balance = await connection.getBalance(wallet.publicKey)
      console.log('[Jupiter Swap] Wallet SOL balance:', balance / 1e9, 'SOL')
    } catch (e) {
      console.error('[Jupiter Swap] Failed to fetch balance:', e)
    }

    setIsSwapping(true)
    setError(null)

    try {
      // For BUYS: Transfer fee to treasury BEFORE swap
      if (FEE_ENABLED && isBuy && buyFeeAmount > 0) {
        console.log('[Jupiter Swap] Transferring buy fee:', buyFeeAmount / LAMPORTS_PER_SOL, 'SOL to treasury')

        const feeTransaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(TREASURY_WALLET),
            lamports: buyFeeAmount,
          })
        )

        feeTransaction.feePayer = wallet.publicKey
        feeTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        const signedFeeTx = await wallet.signTransaction(feeTransaction)
        const feeTxid = await connection.sendRawTransaction(signedFeeTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })

        console.log('[Jupiter Swap] Fee transfer sent:', feeTxid)
        await connection.confirmTransaction(feeTxid, 'confirmed')
        console.log('[Jupiter Swap] Fee transfer confirmed')
      }

      // Calculate sell fee (will be transferred after swap)
      const sellFeeAmount = (FEE_ENABLED && isSell) ? calculateFee(quoteResponse.outAmount) : 0
      if (sellFeeAmount > 0) {
        console.log('[Jupiter Swap] Will collect sell fee after swap:', sellFeeAmount / LAMPORTS_PER_SOL, 'SOL')
      }

      // Get the swap transaction from Jupiter (no feeAccount - we handle fees ourselves)
      const swapResponse = await fetch(JUPITER_SWAP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
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

      // SECURITY: Simulate transaction before signing to catch errors early
      console.log('[Jupiter Swap] Simulating transaction...')
      const simulation = await connection.simulateTransaction(transaction, {
        commitment: 'confirmed',
      })

      if (simulation.value.err) {
        console.error('[Jupiter Swap] Simulation failed:', simulation.value.err)
        console.error('[Jupiter Swap] Simulation logs:', simulation.value.logs)
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`)
      }
      console.log('[Jupiter Swap] Simulation successful, units consumed:', simulation.value.unitsConsumed)

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

      // For SELLS: Transfer fee to treasury AFTER swap
      if (FEE_ENABLED && isSell && sellFeeAmount > 0) {
        console.log('[Jupiter Swap] Transferring sell fee:', sellFeeAmount / LAMPORTS_PER_SOL, 'SOL to treasury')

        const feeTransaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(TREASURY_WALLET),
            lamports: sellFeeAmount,
          })
        )

        feeTransaction.feePayer = wallet.publicKey
        feeTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        const signedFeeTx = await wallet.signTransaction(feeTransaction)
        const feeTxid = await connection.sendRawTransaction(signedFeeTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })

        console.log('[Jupiter Swap] Sell fee transfer sent:', feeTxid)
        await connection.confirmTransaction(feeTxid, 'confirmed')
        console.log('[Jupiter Swap] Sell fee transfer confirmed')
      }

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
