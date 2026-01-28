import { useState } from 'react'
import './CoinExplorer.css'

// Map time frame keys to coin object fields
const TIME_FRAME_FIELDS = {
  '5m': 'priceChange5m',
  '1h': 'priceChange1h',
  '6h': 'priceChange6h',
  '24h': 'priceChange24h',
}

/**
 * CoinCard - Pump.fun style coin card
 * Shows coin image, name, symbol, market cap, and price changes
 */
export default function CoinCard({
  coin,
  onClick,
  timeFrame = '24h',
  showBondingProgress = false,
}) {
  const [imageError, setImageError] = useState(false)

  // Format numbers (market cap, volume, etc)
  const formatNumber = (num) => {
    if (!num || num === 0) return '$0'
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return ''
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Format price change
  const formatChange = (change) => {
    if (change === undefined || change === null) return null
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // Get price change for selected time frame
  const priceChangeField = TIME_FRAME_FIELDS[timeFrame] || 'priceChange24h'
  const priceChangeValue = coin[priceChangeField]
  const priceChange = formatChange(priceChangeValue)

  // Bonding progress (for graduating tokens)
  const bondingProgress = coin.bonding_progress || 0
  const isNearGraduation = bondingProgress >= 80

  return (
    <div className="coin-card" onClick={() => onClick(coin)}>
      {/* Image with sticker overlay button */}
      <div className="coin-card-image">
        {!imageError && coin.image_uri ? (
          <img
            src={coin.image_uri}
            alt={coin.symbol}
            onError={() => setImageError(true)}
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="coin-card-placeholder">
            {coin.symbol?.[0] || '?'}
          </div>
        )}

        {/* Graduated badge */}
        {coin.complete && (
          <div className="graduated-badge" title="Graduated to Raydium">
            🚀
          </div>
        )}

        {/* Near graduation badge */}
        {!coin.complete && isNearGraduation && (
          <div className="graduating-badge" title={`${bondingProgress}% to graduation`}>
            🎓
          </div>
        )}
      </div>

      <div className="coin-card-info">
        <div className="coin-card-header">
          <span className="coin-card-name">{coin.name}</span>
          <span className="coin-card-symbol">${coin.symbol}</span>
        </div>

        {/* Bonding Progress Bar (for graduating view) */}
        {showBondingProgress && !coin.complete && bondingProgress > 0 && (
          <div className="bonding-progress">
            <div className="bonding-bar">
              <div
                className={`bonding-fill ${isNearGraduation ? 'near' : ''}`}
                style={{ width: `${Math.min(bondingProgress, 100)}%` }}
              />
            </div>
            <span className="bonding-text">{bondingProgress}%</span>
          </div>
        )}

        <div className="coin-card-stats">
          <span className="coin-card-mcap">
            MC: {formatNumber(coin.market_cap)}
          </span>
          {priceChange && (
            <span className={`coin-card-change ${priceChangeValue >= 0 ? 'positive' : 'negative'}`}>
              {priceChange} <span className="time-label">{timeFrame}</span>
            </span>
          )}
        </div>

        <div className="coin-card-footer">
          <span className="coin-card-volume">
            Vol: {formatNumber(coin.volume24h)}
          </span>
          <span className="coin-card-time">{formatTimeAgo(coin.created_timestamp)}</span>
        </div>
      </div>
    </div>
  )
}
