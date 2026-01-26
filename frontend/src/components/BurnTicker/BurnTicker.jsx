import { useState } from 'react'
import useBuybackFeed from '../../hooks/useBuybackFeed'
import './BurnTicker.css'

// Format large numbers with K/M suffix
function formatNumber(num) {
  const n = parseFloat(num)
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

// Format time ago
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Get explorer URL for transaction
function getExplorerUrl(chain, txHash) {
  if (chain === 'solana') {
    return `https://solscan.io/tx/${txHash}`
  }
  return `https://etherscan.io/tx/${txHash}`
}

export default function BurnTicker() {
  const { events, stats, isConnected } = useBuybackFeed()
  const [activeTab, setActiveTab] = useState('feed')

  return (
    <div className="burn-ticker">
      {/* Header with stats */}
      <div className="burn-ticker-header">
        <div className="burn-ticker-title">
          <span className="fire-icon">🔥</span>
          BURN FEED
          {isConnected && <span className="live-dot" title="Live" />}
        </div>
        <div className="burn-ticker-tabs">
          <button
            className={`ticker-tab ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button
            className={`ticker-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {activeTab === 'stats' && (
        <div className="burn-ticker-stats">
          <div className="stats-chain">
            <div className="chain-logo solana">◎</div>
            <div className="chain-info">
              <div className="chain-name">Solana</div>
              <div className="chain-burned">
                <span className="burn-amount">{formatNumber(stats.solanaTotalBurned)}</span>
                <span className="burn-token">$SHITPOST burned</span>
              </div>
              <div className="chain-count">{stats.solanaBuybackCount} buybacks</div>
            </div>
          </div>
          <div className="stats-chain">
            <div className="chain-logo ethereum">Ξ</div>
            <div className="chain-info">
              <div className="chain-name">Ethereum</div>
              <div className="chain-burned">
                <span className="burn-amount">{formatNumber(stats.ethereumTotalBurned)}</span>
                <span className="burn-token">$444STR burned</span>
              </div>
              <div className="chain-count">{stats.ethereumBuybackCount} buybacks</div>
            </div>
          </div>
          <div className="stats-total">
            <div className="total-label">Total Buybacks</div>
            <div className="total-count">
              {stats.solanaBuybackCount + stats.ethereumBuybackCount}
            </div>
          </div>
        </div>
      )}

      {/* Feed Panel */}
      {activeTab === 'feed' && (
        <div className="burn-ticker-feed">
          {events.length === 0 ? (
            <div className="feed-empty">
              <span className="empty-icon">🔥</span>
              <span>No burns yet</span>
            </div>
          ) : (
            events.map((event, index) => (
              <a
                key={`${event.txHash}-${index}`}
                className={`feed-item ${event.chain}`}
                href={getExplorerUrl(event.chain, event.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                title="View transaction"
              >
                <span className="feed-icon">🔥</span>
                <span className="feed-input">
                  {event.inputAmount} {event.inputToken}
                </span>
                <span className="feed-arrow">→</span>
                <span className="feed-output">
                  {formatNumber(event.burnedAmount)} ${event.outputToken}
                </span>
                <span className="feed-label">burned</span>
                <span className="feed-separator">•</span>
                <span className="feed-total">
                  {formatNumber(event.totalBurned)} total
                </span>
                <span className="feed-separator">•</span>
                <span className="feed-time">{timeAgo(event.timestamp)}</span>
              </a>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className="burn-ticker-footer">
        <span className="footer-text">
          Every meme minted feeds the flywheel 💩
        </span>
      </div>
    </div>
  )
}
