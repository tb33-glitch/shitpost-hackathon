import { useState, useCallback } from 'react'
import { VersionedTransaction, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

// Jupiter API endpoints (lite-api is public, no API key required)
// Note: lite-api.jup.ag will be deprecated Jan 31, 2026 - migrate to api.jup.ag with API key
const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote'
const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap'

// SOL mint address
export const SOL_MINT = 'So11111111111111111111111111111111111111112'

// Platform fee configuration (0.5% fee on SOL swaps only)
// Fee account must be a wSOL token account (ATA) owned by the treasury wallet
// To set up:
// 1. Set VITE_SOLANA_FEE_ACCOUNT in .env to your treasury's wSOL ATA address
// 2. Ensure the treasury wallet has wrapped some SOL to create the wSOL account
//
// IMPORTANT: wSOL fee account only works when SOL is part of the swap pair
// For non-SOL pairs, we skip fees (would need separate token accounts for each)
// Fee configuration
// - SELL fees (Token → SOL): Jupiter handles via feeAccount (wSOL)
// - BUY fees (SOL → Token): We transfer SOL to treasury before swap
const FEE_ACCOUNT = import.meta.env.VITE_SOLANA_FEE_ACCOUNT || '' // wSOL ATA for sell fees
const TREASURY_WALLET = import.meta.env.VITE_TREASURY_ADDRESS_SOLANA || '6tj7iWbyTmwcEg1R8gLmqNkJUxXBkRDcFZMYV4pEqtJn' // SOL wallet for buy fees
const FEE_ENABLED = true // Enable fee collection
const PLATFORM_FEE_BPS = 50 // 0.5% fee (50 basis points)

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
      // For SELLS: Jupiter takes fee from output SOL via feeAccount
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
        // Only use platformFeeBps for sells (Jupiter handles the fee)
        ...(FEE_ENABLED && isSell && FEE_ACCOUNT && { platformFeeBps: PLATFORM_FEE_BPS.toString() }),
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
      // For BUYS: Transfer fee to treasury first
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

      // For SELLS: Use Jupiter's feeAccount (if configured)
      const useFeeAccount = FEE_ENABLED && isSell && FEE_ACCOUNT

      // Get the swap transaction from Jupiter
      const swapResponse = await fetch(JUPITER_SWAP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          ...(useFeeAccount && { feeAccount: FEE_ACCOUNT }),
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
