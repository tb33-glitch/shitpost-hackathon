import { useState, useCallback } from 'react'
import { Window } from '../Windows98'
import CoinCard from './CoinCard'
import CoinDetail from './CoinDetail'
import usePumpCoins from '../../hooks/usePumpCoins'
import './CoinExplorer.css'

/**
 * CoinExplorer - Pump.fun style coin browser in Windows XP aesthetic
 * Shows card grid, click to view detail, "Make Meme" to open editor
 */
const TIME_FRAMES = [
  { key: '5m', label: '5m', field: 'priceChange5m' },
  { key: '1h', label: '1h', field: 'priceChange1h' },
  { key: '6h', label: '6h', field: 'priceChange6h' },
  { key: '24h', label: '24h', field: 'priceChange24h' },
]

export default function CoinExplorer({
  onMakeMeme,
  onClose,
  onMinimize,
  onMaximize,
  isDesktopMode = true,
}) {
  const [filter, setFilter] = useState('marketCap')
  const [timeFrame, setTimeFrame] = useState('24h')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCoin, setSelectedCoin] = useState(null) // null = grid view, coin = detail view

  const {
    coins,
    isLoading,
    error,
    isConnected,
    refetch,
    searchCoins,
  } = usePumpCoins(filter)

  // Get displayed coins (filtered or search results)
  const displayedCoins = searchQuery.trim()
    ? searchCoins(searchQuery)
    : coins

  // Handle filter change
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter)
    setSearchQuery('')
  }, [])

  // Handle coin click - show detail view
  const handleCoinClick = useCallback((coin) => {
    setSelectedCoin(coin)
  }, [])

  // Handle back to grid
  const handleBack = useCallback(() => {
    setSelectedCoin(null)
  }, [])

  // Handle make meme
  const handleMakeMeme = useCallback((coin) => {
    onMakeMeme?.(coin)
  }, [onMakeMeme])

  return (
    <div className="coin-explorer">
      <Window
        title={selectedCoin ? `${selectedCoin.symbol} - Coin Explorer` : 'Coin Explorer'}
        className="coin-explorer-window"
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        showControls={isDesktopMode}
      >
        {selectedCoin ? (
          // Detail View
          <CoinDetail
            coin={selectedCoin}
            onBack={handleBack}
            onMakeMeme={handleMakeMeme}
          />
        ) : (
          // Grid View
          <>
            {/* Toolbar */}
            <div className="explorer-toolbar">
              <button
                className={`filter-btn ${filter === 'marketCap' ? 'active' : ''}`}
                onClick={() => handleFilterChange('marketCap')}
              >
                💰 Market Cap
              </button>
              <button
                className={`filter-btn ${filter === 'boosted' ? 'active' : ''}`}
                onClick={() => handleFilterChange('boosted')}
              >
                🚀 Boosted
              </button>
              <button
                className={`filter-btn ${filter === 'volume' ? 'active' : ''}`}
                onClick={() => handleFilterChange('volume')}
              >
                📊 Volume
              </button>
              <button
                className={`filter-btn ${filter === 'gainers' ? 'active' : ''}`}
                onClick={() => handleFilterChange('gainers')}
              >
                📈 Gainers
              </button>
              <button
                className={`filter-btn ${filter === 'losers' ? 'active' : ''}`}
                onClick={() => handleFilterChange('losers')}
              >
                📉 Losers
              </button>
              <button
                className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
                onClick={() => handleFilterChange('new')}
              >
                ✨ New
              </button>
              <div className="toolbar-divider" />
              <div className="time-frame-selector">
                {TIME_FRAMES.map(tf => (
                  <button
                    key={tf.key}
                    className={`time-btn ${timeFrame === tf.key ? 'active' : ''}`}
                    onClick={() => setTimeFrame(tf.key)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
              <div className="toolbar-spacer" />
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="refresh-btn" onClick={refetch} title="Refresh">
                🔄
              </button>
            </div>

            {/* Coin Grid */}
            <div className="coin-grid-container">
              {isLoading && coins.length === 0 ? (
                <div className="loading-state">
                  <div className="loading-icon">⏳</div>
                  <div>Loading coins...</div>
                </div>
              ) : error ? (
                <div className="error-state">
                  <div className="error-icon">⚠️</div>
                  <div>{error}</div>
                  <button onClick={refetch}>Retry</button>
                </div>
              ) : displayedCoins.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div>No coins found</div>
                </div>
              ) : (
                <div className="coin-grid">
                  {displayedCoins.map((coin) => (
                    <CoinCard
                      key={coin.mint}
                      coin={coin}
                      onClick={handleCoinClick}
                      timeFrame={timeFrame}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="explorer-status">
              <span>{displayedCoins.length} coins</span>
              <span className={isConnected ? 'status-live' : 'status-offline'}>
                {isConnected ? '🟢 Live' : '🔴 Offline'}
              </span>
            </div>
          </>
        )}
      </Window>
    </div>
  )
}
