import { useState } from 'react'
import './CoinProperties.css'

/**
 * CoinChart - DexScreener/TradingView style chart embed
 * Shows price chart for the coin
 */
export default function CoinChart({ coin }) {
  const [chartType, setChartType] = useState('dexscreener')
  const [timeframe, setTimeframe] = useState('1H')

  // Generate DexScreener embed URL
  const getDexScreenerUrl = () => {
    // DexScreener Solana chart URL
    return `https://dexscreener.com/solana/${coin.mint}?embed=1&theme=dark&trades=0&info=0`
  }

  // Generate Birdeye chart URL (alternative)
  const getBirdeyeUrl = () => {
    return `https://birdeye.so/token/${coin.mint}?chain=solana`
  }

  return (
    <div className="coin-chart">
      <div className="chart-header">
        <div className="chart-tabs">
          <button
            className={`chart-tab ${chartType === 'dexscreener' ? 'active' : ''}`}
            onClick={() => setChartType('dexscreener')}
          >
            DexScreener
          </button>
          <button
            className={`chart-tab ${chartType === 'placeholder' ? 'active' : ''}`}
            onClick={() => setChartType('placeholder')}
          >
            Basic
          </button>
        </div>
        <div className="chart-timeframes">
          {['5M', '15M', '1H', '4H', '1D'].map((tf) => (
            <button
              key={tf}
              className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {chartType === 'dexscreener' ? (
          <iframe
            src={getDexScreenerUrl()}
            title={`${coin.symbol} Chart`}
            frameBorder="0"
            allow="clipboard-write"
            className="chart-iframe"
          />
        ) : (
          <div className="chart-placeholder">
            <div className="placeholder-chart">
              {/* Simple placeholder chart visualization */}
              <svg viewBox="0 0 300 100" className="placeholder-svg">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <path
                  d="M0,80 L20,70 L40,75 L60,50 L80,60 L100,40 L120,45 L140,30 L160,35 L180,25 L200,30 L220,20 L240,25 L260,15 L280,20 L300,10 L300,100 L0,100 Z"
                  fill="url(#chartGradient)"
                />
                {/* Line */}
                <path
                  d="M0,80 L20,70 L40,75 L60,50 L80,60 L100,40 L120,45 L140,30 L160,35 L180,25 L200,30 L220,20 L240,25 L260,15 L280,20 L300,10"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                />
              </svg>
              <div className="placeholder-label">
                Price chart for ${coin.symbol}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chart-footer">
        <a
          href={`https://pump.fun/${coin.mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="chart-link"
        >
          View on pump.fun ↗
        </a>
        <a
          href={getBirdeyeUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="chart-link"
        >
          View on Birdeye ↗
        </a>
      </div>
    </div>
  )
}
