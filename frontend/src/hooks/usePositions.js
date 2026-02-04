import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'shitpost_positions'

/**
 * Position tracking hook - stores cost basis for PnL calculation
 *
 * Position structure:
 * {
 *   mint: string,
 *   symbol: string,
 *   name: string,
 *   image_uri: string,
 *   totalAmount: number,        // Current amount held
 *   totalCostSol: number,       // Total SOL spent (for avg cost calc)
 *   avgCostPerToken: number,    // Average cost per token in SOL
 *   trades: [{                  // History of trades
 *     type: 'buy' | 'sell',
 *     amount: number,
 *     pricePerToken: number,    // SOL per token
 *     solAmount: number,
 *     timestamp: number,
 *     txid: string
 *   }]
 * }
 */

export default function usePositions() {
  const [positions, setPositions] = useState({})

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed
      }
    } catch (err) {
      console.error('[Positions] Failed to load from storage:', err)
    }
    return {}
  }, [])

  // Track if this is the initial mount to avoid saving the empty initial state
  const isInitialMount = useRef(true)

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFromStorage()
    console.log('[Positions] Loaded from storage:', Object.keys(loaded).length, 'positions')
    setPositions(loaded)
    // Mark initial mount complete after a tick to ensure state is set
    setTimeout(() => {
      isInitialMount.current = false
    }, 0)
  }, [loadFromStorage])

  // Save to localStorage whenever positions change (but not on initial empty state)
  useEffect(() => {
    // Don't save on initial mount (would overwrite with empty object)
    if (isInitialMount.current) {
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
      console.log('[Positions] Saved to storage:', Object.keys(positions).length, 'positions')
    } catch (err) {
      console.error('[Positions] Failed to save to storage:', err)
    }
  }, [positions])

  /**
   * Record a buy trade
   */
  const recordBuy = useCallback(({ mint, symbol, name, image_uri, amount, solSpent, txid }) => {
    const pricePerToken = solSpent / amount

    setPositions(prev => {
      const existing = prev[mint] || {
        mint,
        symbol,
        name,
        image_uri,
        totalAmount: 0,
        totalCostSol: 0,
        avgCostPerToken: 0,
        trades: []
      }

      const newTotalAmount = existing.totalAmount + amount
      const newTotalCost = existing.totalCostSol + solSpent
      const newAvgCost = newTotalCost / newTotalAmount

      const updated = {
        ...existing,
        symbol: symbol || existing.symbol,
        name: name || existing.name,
        image_uri: image_uri || existing.image_uri,
        totalAmount: newTotalAmount,
        totalCostSol: newTotalCost,
        avgCostPerToken: newAvgCost,
        trades: [
          ...existing.trades,
          {
            type: 'buy',
            amount,
            pricePerToken,
            solAmount: solSpent,
            timestamp: Date.now(),
            txid
          }
        ]
      }

      console.log('[Positions] Recorded buy:', {
        symbol,
        amount,
        solSpent,
        pricePerToken,
        newAvgCost
      })

      return { ...prev, [mint]: updated }
    })
  }, [])

  /**
   * Record a sell trade
   */
  const recordSell = useCallback(({ mint, amount, solReceived, txid }) => {
    setPositions(prev => {
      const existing = prev[mint]
      if (!existing) {
        console.warn('[Positions] Sell recorded for unknown position:', mint)
        return prev
      }

      const pricePerToken = solReceived / amount
      const newTotalAmount = Math.max(0, existing.totalAmount - amount)

      // Proportionally reduce cost basis
      const soldRatio = amount / existing.totalAmount
      const newTotalCost = existing.totalCostSol * (1 - soldRatio)

      const updated = {
        ...existing,
        totalAmount: newTotalAmount,
        totalCostSol: newTotalCost,
        // Keep avgCostPerToken the same (FIFO-ish)
        trades: [
          ...existing.trades,
          {
            type: 'sell',
            amount,
            pricePerToken,
            solAmount: solReceived,
            timestamp: Date.now(),
            txid
          }
        ]
      }

      console.log('[Positions] Recorded sell:', {
        symbol: existing.symbol,
        amount,
        solReceived,
        pricePerToken,
        remainingAmount: newTotalAmount
      })

      // Remove position if fully sold
      if (newTotalAmount <= 0) {
        const { [mint]: removed, ...rest } = prev
        return rest
      }

      return { ...prev, [mint]: updated }
    })
  }, [])

  /**
   * Calculate PnL for a position given current price
   */
  const calculatePnL = useCallback((mint, currentPriceInSol) => {
    const position = positions[mint]
    if (!position || position.totalAmount <= 0) {
      return null
    }

    const currentValueSol = position.totalAmount * currentPriceInSol
    const costBasisSol = position.totalCostSol
    const pnlSol = currentValueSol - costBasisSol
    const pnlPercent = costBasisSol > 0 ? (pnlSol / costBasisSol) * 100 : 0

    return {
      currentValueSol,
      costBasisSol,
      pnlSol,
      pnlPercent,
      avgCostPerToken: position.avgCostPerToken,
      currentPricePerToken: currentPriceInSol
    }
  }, [positions])

  /**
   * Get all positions as array
   */
  const getPositionsArray = useCallback(() => {
    return Object.values(positions).filter(p => p.totalAmount > 0)
  }, [positions])

  /**
   * Clear a specific position
   */
  const clearPosition = useCallback((mint) => {
    setPositions(prev => {
      const { [mint]: removed, ...rest } = prev
      return rest
    })
  }, [])

  /**
   * Clear all positions
   */
  const clearAllPositions = useCallback(() => {
    setPositions({})
  }, [])

  /**
   * Get position for a specific mint
   */
  const getPosition = useCallback((mint) => {
    return positions[mint] || null
  }, [positions])

  return {
    positions,
    recordBuy,
    recordSell,
    calculatePnL,
    getPositionsArray,
    getPosition,
    clearPosition,
    clearAllPositions
  }
}
