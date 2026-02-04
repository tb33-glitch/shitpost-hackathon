import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Window } from '../Windows98'
import usePositions from '../../hooks/usePositions'
import usePumpCoins from '../../hooks/usePumpCoins'
import './Portfolio.css'

/**
 * Portfolio - Shows tracked positions with PnL
 */
export default function Portfolio({ onClose, onMinimize, onMaximize, isDesktopMode = true }) {
  const { connected: isWalletConnected } = useWallet()
  const { getPositionsArray, calculatePnL, clearPosition, clearAllPositions } = usePositions()
  const { coins } = usePumpCoins('marketCap')

  const [positionsWithPnL, setPositionsWithPnL] = useState([])
  const [totalPnL, setTotalPnL] = useState({ sol: 0, percent: 0, totalValue: 0, totalCost: 0 })
  const [solPrice, setSolPrice] = useState(150) // Default SOL price

  // Fetch SOL price
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
        const data = await res.json()
        if (data.solana?.usd) {
          setSolPrice(data.solana.usd)
        }
      } catch (err) {
        console.error('[Portfolio] Failed to fetch SOL price:', err)
      }
    }
    fetchSolPrice()
    const interval = setInterval(fetchSolPrice, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Calculate PnL for all positions
  useEffect(() => {
    const positions = getPositionsArray()

    if (positions.length === 0) {
      setPositionsWithPnL([])
      setTotalPnL({ sol: 0, percent: 0, totalValue: 0, totalCost: 0 })
      return
    }

    // Match positions with current prices from coins
    const enriched = positions.map(position => {
      const coinData = coins.find(c => c.mint === position.mint)

      // Calculate current price in SOL
      // coinData.price is in USD, we need SOL
      const currentPriceUsd = coinData?.price || 0
      const currentPriceSol = currentPriceUsd / solPrice

      const pnl = calculatePnL(position.mint, currentPriceSol)

      return {
        ...position,
        currentPriceSol,
        currentPriceUsd,
        priceChange24h: coinData?.priceChange24h || 0,
        pnl
      }
    })

    // Calculate totals
    let totalValueSol = 0
    let totalCostSol = 0

    enriched.forEach(p => {
      if (p.pnl) {
        totalValueSol += p.pnl.currentValueSol
        totalCostSol += p.pnl.costBasisSol
      }
    })

    const totalPnLSol = totalValueSol - totalCostSol
    const totalPnLPercent = totalCostSol > 0 ? (totalPnLSol / totalCostSol) * 100 : 0

    setPositionsWithPnL(enriched)
    setTotalPnL({
      sol: totalPnLSol,
      percent: totalPnLPercent,
      totalValue: totalValueSol,
      totalCost: totalCostSol
    })
  }, [getPositionsArray, calculatePnL, coins, solPrice])

  const formatSol = (amount) => {
    if (Math.abs(amount) < 0.0001) return amount.toExponential(2)
    if (Math.abs(amount) < 0.01) return amount.toFixed(6)
    if (Math.abs(amount) < 1) return amount.toFixed(4)
    return amount.toFixed(3)
  }

  const formatUsd = (amount) => {
    if (Math.abs(amount) < 0.01) return '$' + amount.toFixed(4)
    if (Math.abs(amount) < 1) return '$' + amount.toFixed(2)
    return '$' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  const formatPercent = (percent) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  const handleClearPosition = (mint, symbol) => {
    if (confirm(`Remove ${symbol} from tracked positions?`)) {
      clearPosition(mint)
    }
  }

  const handleClearAll = () => {
    if (confirm('Clear all tracked positions? This cannot be undone.')) {
      clearAllPositions()
    }
  }

  return (
    <Window
      title="Portfolio Tracker"
      className="portfolio-window"
      onClose={onClose}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      showControls={isDesktopMode}
    >
      <div className="portfolio-content">
        {!isWalletConnected ? (
          <div className="portfolio-connect-message">
            Connect your wallet to track positions
          </div>
        ) : positionsWithPnL.length === 0 ? (
          <div className="portfolio-empty">
            <div className="portfolio-empty-icon">📊</div>
            <div className="portfolio-empty-text">No positions tracked yet</div>
            <div className="portfolio-empty-hint">
              Buy tokens through the Coin Explorer to start tracking PnL
            </div>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="portfolio-summary">
              <div className="summary-row">
                <span className="summary-label">Total Value</span>
                <span className="summary-value">
                  {formatSol(totalPnL.totalValue)} SOL
                  <span className="summary-usd">
                    ({formatUsd(totalPnL.totalValue * solPrice)})
                  </span>
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Cost Basis</span>
                <span className="summary-value">
                  {formatSol(totalPnL.totalCost)} SOL
                </span>
              </div>
              <div className="summary-row pnl-row">
                <span className="summary-label">Total PnL</span>
                <span className={`summary-pnl ${totalPnL.sol >= 0 ? 'positive' : 'negative'}`}>
                  {totalPnL.sol >= 0 ? '+' : ''}{formatSol(totalPnL.sol)} SOL
                  <span className="pnl-percent">({formatPercent(totalPnL.percent)})</span>
                </span>
              </div>
            </div>

            {/* Positions List */}
            <div className="portfolio-list">
              <div className="portfolio-list-header">
                <span className="col-token">Token</span>
                <span className="col-amount">Amount</span>
                <span className="col-avg">Avg Cost</span>
                <span className="col-current">Current</span>
                <span className="col-pnl">PnL</span>
                <span className="col-actions"></span>
              </div>

              {positionsWithPnL.map(position => (
                <div key={position.mint} className="portfolio-row">
                  <div className="col-token">
                    <div className="token-icon">
                      {position.image_uri ? (
                        <img src={position.image_uri} alt="" onError={(e) => e.target.style.display = 'none'} />
                      ) : (
                        <span>{position.symbol?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="token-info">
                      <span className="token-symbol">{position.symbol}</span>
                      <span className={`token-change ${position.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(position.priceChange24h)} 24h
                      </span>
                    </div>
                  </div>

                  <div className="col-amount">
                    <span className="amount-value">
                      {position.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="col-avg">
                    <span className="price-sol">{formatSol(position.avgCostPerToken)}</span>
                    <span className="price-usd">{formatUsd(position.avgCostPerToken * solPrice)}</span>
                  </div>

                  <div className="col-current">
                    <span className="price-sol">{formatSol(position.currentPriceSol)}</span>
                    <span className="price-usd">{formatUsd(position.currentPriceUsd)}</span>
                  </div>

                  <div className="col-pnl">
                    {position.pnl && (
                      <div className={`pnl-display ${position.pnl.pnlSol >= 0 ? 'positive' : 'negative'}`}>
                        <span className="pnl-sol">
                          {position.pnl.pnlSol >= 0 ? '+' : ''}{formatSol(position.pnl.pnlSol)} SOL
                        </span>
                        <span className="pnl-percent">
                          {formatPercent(position.pnl.pnlPercent)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-actions">
                    <button
                      className="remove-btn"
                      onClick={() => handleClearPosition(position.mint, position.symbol)}
                      title="Remove from tracking"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="portfolio-footer">
              <span className="footer-note">
                * PnL based on swaps made through shitpost.pro
              </span>
              <button className="clear-all-btn" onClick={handleClearAll}>
                Clear All
              </button>
            </div>
          </>
        )}
      </div>
    </Window>
  )
}
