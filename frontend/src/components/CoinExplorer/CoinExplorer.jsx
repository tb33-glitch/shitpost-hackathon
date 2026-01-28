import { useState, useCallback, useEffect, useRef } from 'react'
import { Window } from '../Windows98'
import CoinCard from './CoinCard'
import CoinDetail from './CoinDetail'
import usePumpCoins, { DATA_SOURCES, SORT_OPTIONS } from '../../hooks/usePumpCoins'
import './CoinExplorer.css'

/**
 * CoinExplorer - Pump.fun style coin browser in Windows XP aesthetic
 * Shows card grid, click to view detail, "Make Meme" to open editor
 * Now with pump.fun integration and multiple data source tabs
 */

const TIME_FRAMES = [
  { key: '5m', label: '5m', field: 'priceChange5m' },
  { key: '1h', label: '1h', field: 'priceChange1h' },
  { key: '6h', label: '6h', field: 'priceChange6h' },
  { key: '24h', label: '24h', field: 'priceChange24h' },
]

const DATA_SOURCE_TABS = [
  { key: DATA_SOURCES.TRENDING, label: 'Trending', icon: '🔥' },
  { key: DATA_SOURCES.NEW, label: 'New', icon: '✨' },
  { key: DATA_SOURCES.GRADUATING, label: 'Graduating', icon: '🎓' },
  { key: DATA_SOURCES.GRADUATED, label: 'Graduated', icon: '🚀' },
  { key: DATA_SOURCES.BOOSTED, label: 'Boosted', icon: '💎' },
]

const SORT_BUTTONS = [
  { key: SORT_OPTIONS.MARKET_CAP, label: 'MC', icon: '💰' },
  { key: SORT_OPTIONS.VOLUME, label: 'Vol', icon: '📊' },
  { key: SORT_OPTIONS.GAINERS, label: 'Gain', icon: '📈' },
  { key: SORT_OPTIONS.LOSERS, label: 'Loss', icon: '📉' },
]

export default function CoinExplorer({
  onMakeMeme,
  onClose,
  onMinimize,
  onMaximize,
  isDesktopMode = true,
}) {
  const [dataSource, setDataSource] = useState(DATA_SOURCES.TRENDING)
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.MARKET_CAP)
  const [timeFrame, setTimeFrame] = useState('24h')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [helpPosition, setHelpPosition] = useState({ x: 100, y: 100 })
  const [isDraggingHelp, setIsDraggingHelp] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Help window drag handlers
  const handleHelpDragStart = useCallback((e) => {
    if (e.target.closest('.help-close')) return
    setIsDraggingHelp(true)
    dragOffset.current = {
      x: e.clientX - helpPosition.x,
      y: e.clientY - helpPosition.y,
    }
  }, [helpPosition])

  const handleHelpDrag = useCallback((e) => {
    if (!isDraggingHelp) return
    setHelpPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    })
  }, [isDraggingHelp])

  const handleHelpDragEnd = useCallback(() => {
    setIsDraggingHelp(false)
  }, [])

  useEffect(() => {
    if (isDraggingHelp) {
      window.addEventListener('mousemove', handleHelpDrag)
      window.addEventListener('mouseup', handleHelpDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleHelpDrag)
        window.removeEventListener('mouseup', handleHelpDragEnd)
      }
    }
  }, [isDraggingHelp, handleHelpDrag, handleHelpDragEnd])

  const {
    coins,
    kingOfHill,
    isLoading,
    error,
    isConnected,
    refetch,
    searchCoins,
  } = usePumpCoins(dataSource, sortOption)

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchCoins(searchQuery)
        setSearchResults(results)
      } catch (err) {
        console.warn('Search failed:', err)
        setSearchResults([])
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchCoins])

  // Get displayed coins
  const displayedCoins = searchResults !== null ? searchResults : coins

  // Handle data source change
  const handleDataSourceChange = useCallback((source) => {
    setDataSource(source)
    setSearchQuery('')
    setSearchResults(null)
  }, [])

  // Handle sort change
  const handleSortChange = useCallback((sort) => {
    setSortOption(sort)
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
      {/* Floating Help Window */}
      {showHelp && (
        <div
          className="help-panel floating"
          style={{ left: helpPosition.x, top: helpPosition.y }}
        >
          <div
            className="help-header"
            onMouseDown={handleHelpDragStart}
          >
            <span>Coin Explorer Help</span>
            <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
          </div>
          <div className="help-content">
            <div className="help-section">
              <h4>📊 Data Tabs</h4>
              <ul>
                <li><strong>Trending:</strong> Top performing tokens on pump.fun</li>
                <li><strong>New:</strong> Recently created tokens</li>
                <li><strong>Graduating:</strong> Tokens near bonding curve completion (~$69K)</li>
                <li><strong>Graduated:</strong> Tokens that completed bonding curve</li>
                <li><strong>Boosted:</strong> DexScreener boosted tokens</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>💰 Sort Options</h4>
              <ul>
                <li><strong>MC:</strong> Market Cap (total value)</li>
                <li><strong>Vol:</strong> 24h Trading Volume</li>
                <li><strong>Gain:</strong> Biggest price gainers</li>
                <li><strong>Loss:</strong> Biggest price losers</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>⏱️ Time Frames</h4>
              <ul>
                <li><strong>5m/1h/6h/24h:</strong> Price change period</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>🎨 Card Info</h4>
              <ul>
                <li><strong>Age (e.g. "11d ago"):</strong> When the token was created</li>
                <li><strong>MC:</strong> Market cap in USD</li>
                <li><strong>Vol:</strong> 24h trading volume</li>
                <li><strong>Progress bar:</strong> Bonding curve completion %</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>🎨 Make Meme</h4>
              <p>Click any token, then "Make Meme" to open Meme Studio with the token image!</p>
            </div>
          </div>
        </div>
      )}

      <Window
        title={selectedCoin ? `${selectedCoin.symbol} - Coin Explorer` : 'Coin Explorer'}
        className="coin-explorer-window"
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        showControls={isDesktopMode}
      >
        {selectedCoin ? (
          <CoinDetail
            coin={selectedCoin}
            onBack={handleBack}
            onMakeMeme={handleMakeMeme}
          />
        ) : (
          <>
            {/* Data Source Tabs */}
            <div className="explorer-tabs">
              {DATA_SOURCE_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`tab-btn ${dataSource === tab.key ? 'active' : ''}`}
                  onClick={() => handleDataSourceChange(tab.key)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* King of the Hill Banner (when on KOTH or Trending) */}
            {kingOfHill && (dataSource === DATA_SOURCES.TRENDING || dataSource === DATA_SOURCES.KOTH) && (
              <div className="koth-banner" onClick={() => handleCoinClick(kingOfHill)}>
                <div className="koth-crown">👑</div>
                <div className="koth-info">
                  <span className="koth-label">KING OF THE HILL</span>
                  <span className="koth-name">{kingOfHill.symbol}</span>
                </div>
                {kingOfHill.image_uri && (
                  <img
                    src={kingOfHill.image_uri}
                    alt={kingOfHill.symbol}
                    className="koth-image"
                  />
                )}
                <div className="koth-stats">
                  <span className="koth-mcap">
                    ${kingOfHill.market_cap >= 1000000
                      ? `${(kingOfHill.market_cap / 1000000).toFixed(1)}M`
                      : `${(kingOfHill.market_cap / 1000).toFixed(0)}K`}
                  </span>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="explorer-toolbar">
              {/* Sort Buttons */}
              <div className="sort-buttons">
                {SORT_BUTTONS.map(btn => (
                  <button
                    key={btn.key}
                    className={`sort-btn ${sortOption === btn.key ? 'active' : ''}`}
                    onClick={() => handleSortChange(btn.key)}
                    title={btn.label}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>

              <div className="toolbar-divider" />

              {/* Time Frame Selector */}
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

              {/* Search Box */}
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search token or paste address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <span className="search-spinner">⏳</span>}
              </div>

              {/* Refresh Button */}
              <button className="refresh-btn" onClick={refetch} title="Refresh">
                🔄
              </button>

              {/* Help Button */}
              <button className="help-btn" onClick={() => setShowHelp(!showHelp)} title="Help">
                ?
              </button>
            </div>

            {/* Graduating Tokens Banner */}
            {dataSource === DATA_SOURCES.GRADUATING && displayedCoins.length > 0 && (
              <div className="graduating-info">
                <span className="graduating-icon">🎓</span>
                <span>Tokens approaching graduation - sorted by bonding curve progress</span>
              </div>
            )}

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
                  <div>{searchQuery ? 'No tokens found' : 'No tokens available'}</div>
                </div>
              ) : (
                <div className="coin-grid">
                  {displayedCoins.map((coin) => (
                    <CoinCard
                      key={coin.mint}
                      coin={coin}
                      onClick={handleCoinClick}
                      timeFrame={timeFrame}
                      showBondingProgress={dataSource === DATA_SOURCES.GRADUATING}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="explorer-status">
              <span>{displayedCoins.length} tokens</span>
              <span className="status-source">
                {dataSource === DATA_SOURCES.BOOSTED ? 'DexScreener' : 'pump.fun'}
              </span>
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
