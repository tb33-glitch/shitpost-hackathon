import { useState, useCallback } from 'react'
import { Window } from '../Windows98'
import CoinChart from './CoinChart'
import CoinMemeGallery from './CoinMemeGallery'
import useCoinMemes from '../../hooks/useCoinMemes'
import './CoinProperties.css'

/**
 * CoinProperties - Windows XP Properties dialog style coin details
 * Shows coin info, chart, and community memes
 */
export default function CoinProperties({
  coin,
  onClose,
  onMinimize,
  onMaximize,
  onMakeMeme,
  walletAddress,
  isDesktopMode = true,
}) {
  const [activeTab, setActiveTab] = useState('chart')
  const { getCount } = useCoinMemes()

  const memeCount = getCount(coin?.mint)

  // Format market cap
  const formatMarketCap = (cap) => {
    if (!cap) return 'Unknown'
    if (cap >= 1000000) return `$${(cap / 1000000).toFixed(2)}M`
    if (cap >= 1000) return `$${(cap / 1000).toFixed(2)}K`
    return `$${cap.toFixed(2)}`
  }

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleMakeMeme = useCallback(() => {
    onMakeMeme?.(coin)
  }, [coin, onMakeMeme])

  if (!coin) {
    return (
      <div style={{ padding: 20, background: 'red', color: 'white' }}>
        DEBUG: No coin data received!
      </div>
    )
  }

  return (
    <div className="coin-properties">
      <Window
        title={`${coin.symbol} Properties`}
        className="coin-properties-window"
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        showControls={isDesktopMode}
      >
        {/* Header */}
        <div className="properties-header">
          <div className="coin-avatar">
            {coin.image_uri ? (
              <img src={coin.image_uri} alt={coin.symbol} />
            ) : (
              <span className="avatar-placeholder">{coin.symbol?.[0] || '?'}</span>
            )}
          </div>
          <div className="coin-title">
            <h2 className="coin-name">{coin.name}</h2>
            <div className="coin-meta">
              <span className="coin-symbol-large">${coin.symbol}</span>
              <span className="coin-divider">·</span>
              <span className="coin-mc">MC: {formatMarketCap(coin.market_cap)}</span>
            </div>
          </div>
          <button
            className="make-meme-btn"
            onClick={handleMakeMeme}
            title="Create a meme with this coin"
          >
            🎨 Make Meme
          </button>
        </div>

        {/* Tabs */}
        <div className="properties-tabs">
          <button
            className={`properties-tab ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            📈 Chart
          </button>
          <button
            className={`properties-tab ${activeTab === 'memes' ? 'active' : ''}`}
            onClick={() => setActiveTab('memes')}
          >
            🖼️ Memes ({memeCount})
          </button>
          <button
            className={`properties-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            ℹ️ Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="properties-content">
          {activeTab === 'chart' && (
            <CoinChart coin={coin} />
          )}

          {activeTab === 'memes' && (
            <CoinMemeGallery
              coin={coin}
              walletAddress={walletAddress}
            />
          )}

          {activeTab === 'info' && (
            <div className="coin-info-panel">
              <div className="info-section">
                <h3>Description</h3>
                <p>{coin.description || 'No description available.'}</p>
              </div>

              <div className="info-section">
                <h3>Details</h3>
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td>Contract:</td>
                      <td className="mono">
                        {coin.mint?.slice(0, 8)}...{coin.mint?.slice(-8)}
                        <button
                          className="copy-btn"
                          onClick={() => navigator.clipboard.writeText(coin.mint)}
                          title="Copy address"
                        >
                          📋
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Created:</td>
                      <td>{formatDate(coin.created_timestamp)}</td>
                    </tr>
                    <tr>
                      <td>Market Cap:</td>
                      <td>{formatMarketCap(coin.market_cap)}</td>
                    </tr>
                    <tr>
                      <td>24h Change:</td>
                      <td className={`change ${(coin.priceChange24h || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {(coin.priceChange24h || 0) >= 0 ? '+' : ''}{coin.priceChange24h?.toFixed(2) || 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="info-section">
                <h3>Links</h3>
                <div className="social-links">
                  <a
                    href={`https://pump.fun/${coin.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    🚀 pump.fun
                  </a>
                  {coin.twitter && (
                    <a
                      href={coin.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      🐦 Twitter
                    </a>
                  )}
                  {coin.telegram && (
                    <a
                      href={coin.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      📱 Telegram
                    </a>
                  )}
                  {coin.website && (
                    <a
                      href={coin.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Window>
    </div>
  )
}
