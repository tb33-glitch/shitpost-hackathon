import { useState, useEffect, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ConnectButton } from '../Wallet'
import useJupiterSwap, { SOL_MINT, formatTokenAmount, parseTokenAmount } from '../../hooks/useJupiterSwap'
import { getBalance as getBalanceFromProxy } from '../../utils/solanaRpc'
import './CoinExplorer.css'

// Get high-res image URL for meme making
const getHighResImageUrl = (imageUri) => {
  if (!imageUri) return null
  if (imageUri.includes('dd.dexscreener.com')) {
    return imageUri.includes('?') ? `${imageUri}&size=xl` : `${imageUri}?size=xl`
  }
  return imageUri
}

// SOL token info
const SOL_TOKEN = {
  mint: SOL_MINT,
  symbol: 'SOL',
  name: 'Solana',
  decimals: 9,
  image_uri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
}

/**
 * CoinDetail - Pump.fun style coin detail view with integrated swap
 * Solana-only version for hackathon
 */
export default function CoinDetail({ coin, onBack, onMakeMeme }) {
  const [imageError, setImageError] = useState(false)
  const [inputAmount, setInputAmount] = useState('')
  const [swapSuccess, setSwapSuccess] = useState(null)
  const [slippage, setSlippage] = useState(1)
  const [solBalance, setSolBalance] = useState(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  const { publicKey, connected: isWalletConnected, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()

  const inputToken = SOL_TOKEN

  // Jupiter swap hook
  const { quote, isLoadingQuote, isSwapping, error, getQuote, executeSwap, reset } = useJupiterSwap()

  // Fetch SOL balance when wallet connects (using backend RPC proxy)
  const fetchBalance = useCallback(async () => {
    console.log('[Balance] Fetching via backend proxy...', {
      isWalletConnected,
      publicKey: publicKey?.toString(),
    })

    if (!isWalletConnected || !publicKey) {
      console.log('[Balance] Not connected, skipping')
      setSolBalance(null)
      return
    }

    setIsLoadingBalance(true)
    try {
      // Use backend RPC proxy to keep API keys secure
      const result = await getBalanceFromProxy(publicKey.toString())
      const lamports = result?.value ?? result
      const sol = lamports / LAMPORTS_PER_SOL
      console.log('[Balance] Success via proxy:', { lamports, sol })
      setSolBalance(sol)
    } catch (err) {
      console.error('[Balance] Proxy error:', err.message)
      // Fallback to wallet adapter connection (may be rate limited)
      try {
        console.log('[Balance] Trying fallback via wallet adapter connection...')
        const lamports = await connection.getBalance(publicKey)
        const sol = lamports / LAMPORTS_PER_SOL
        console.log('[Balance] Fallback success:', { lamports, sol })
        setSolBalance(sol)
      } catch (err2) {
        console.error('[Balance] Fallback also failed:', err2.message)
        setSolBalance(null)
      }
    }
    setIsLoadingBalance(false)
  }, [isWalletConnected, publicKey, connection])

  // Fetch balance on mount and when wallet changes
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Refetch balance after successful swap
  useEffect(() => {
    if (swapSuccess) {
      const timeout = setTimeout(fetchBalance, 2000)
      return () => clearTimeout(timeout)
    }
  }, [swapSuccess, fetchBalance])

  // Handle MAX button click
  const handleMaxClick = useCallback(() => {
    if (solBalance !== null && solBalance > 0) {
      // Leave 0.01 SOL for transaction fees
      const maxAmount = Math.max(0, solBalance - 0.01)
      setInputAmount(maxAmount.toFixed(4))
    }
  }, [solBalance])

  // Fetch quote when input changes
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      reset()
      return
    }

    const timeoutId = setTimeout(() => {
      const amountInLamports = parseTokenAmount(inputAmount, 9)
      console.log('[Swap Debug] Solana quote request:', {
        inputMint: SOL_MINT,
        outputMint: coin.mint,
        amount: amountInLamports,
        slippageBps: Math.round(slippage * 100),
        isConnected: isWalletConnected,
      })
      getQuote({
        inputMint: SOL_MINT,
        outputMint: coin.mint,
        amount: amountInLamports,
        slippageBps: Math.round(slippage * 100),
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [inputAmount, slippage, coin.mint, getQuote, reset, isWalletConnected])

  // Handle swap
  const handleSwap = useCallback(async () => {
    if (!quote || !publicKey || !connection) return

    setSwapSuccess(null)
    console.log('[Swap] Starting swap...')

    const wallet = {
      publicKey,
      signTransaction,
      signAllTransactions,
    }

    const txid = await executeSwap({
      wallet,
      connection,
      quoteResponse: quote,
    })

    console.log('[Swap] Result txid:', txid)

    if (txid) {
      console.log('[Swap] Success! Setting swapSuccess to:', txid)
      setSwapSuccess(txid)
      setInputAmount('')
      reset()
    } else {
      console.log('[Swap] No txid returned - check for errors')
    }
  }, [quote, publicKey, connection, signTransaction, signAllTransactions, executeSwap, reset])

  // Debug: Log quote and error changes
  useEffect(() => {
    if (quote) {
      console.log('[Swap Debug] Quote received:', quote)
    }
    if (error) {
      console.log('[Swap Debug] Error:', error)
    }
  }, [quote, error])

  // Calculate output amount
  const outputAmount = quote
    ? formatTokenAmount(quote.outAmount, coin.decimals || 6)
    : ''

  // Format helpers
  const formatMarketCap = (cap) => {
    if (!cap || cap === 0) return '$0'
    if (cap >= 1000000) return `$${(cap / 1000000).toFixed(2)}M`
    if (cap >= 1000) return `$${(cap / 1000).toFixed(2)}K`
    return `$${cap.toFixed(2)}`
  }

  const formatChange = (change) => {
    if (change === undefined || change === null) return { text: '0%', positive: true }
    const sign = change >= 0 ? '+' : ''
    return {
      text: `${sign}${change.toFixed(2)}%`,
      positive: change >= 0
    }
  }

  const change24h = formatChange(coin.priceChange24h)

  const copyAddress = () => {
    navigator.clipboard.writeText(coin.mint)
  }

  // Button state
  const getButtonState = () => {
    if (!isWalletConnected) return { text: 'Connect Wallet', action: 'connect' }
    if (!inputAmount || parseFloat(inputAmount) <= 0) return { text: 'Enter Amount', disabled: true }
    if (isLoadingQuote) return { text: 'Getting Quote...', disabled: true }
    if (isSwapping) return { text: 'Swapping...', disabled: true }
    if (error) return { text: error, disabled: true }
    if (!quote) return { text: 'Swap', disabled: true }
    return { text: `Buy ${outputAmount} ${coin.symbol}`, disabled: false, action: 'swap' }
  }

  const buttonState = getButtonState()

  return (
    <div className="coin-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <div className="detail-coin-info">
          <div className="detail-image">
            {!imageError && coin.image_uri ? (
              <img
                src={coin.image_uri}
                alt={coin.symbol}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="detail-image-placeholder">
                {coin.symbol?.[0] || '?'}
              </div>
            )}
          </div>

          <div className="detail-title">
            <h2 className="detail-name">{coin.name}</h2>
            <div className="detail-meta">
              <span className="detail-symbol">${coin.symbol}</span>
              <span className="detail-chain-badge">SOL</span>
              <button className="copy-btn" onClick={copyAddress} title="Copy address">
                📋 {coin.mint?.slice(0, 6)}...{coin.mint?.slice(-4)}
              </button>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="make-meme-btn header-meme-btn"
            onClick={() => onMakeMeme({
              ...coin,
              image_uri: getHighResImageUrl(coin.image_uri)
            })}
          >
            🎨 Make Meme
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="detail-stats">
        <div className="stat-box main-stat">
          <div className="stat-label">Market Cap</div>
          <div className="stat-value">{formatMarketCap(coin.market_cap)}</div>
          <div className={`stat-change ${change24h.positive ? 'positive' : 'negative'}`}>
            {change24h.text}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Price</div>
          <div className="stat-value small">${coin.price ? coin.price.toFixed(8) : '0'}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">5m</div>
          <div className={`stat-value small ${(coin.priceChange5m || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(coin.priceChange5m || 0) >= 0 ? '+' : ''}{(coin.priceChange5m || 0).toFixed(1)}%
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">1h</div>
          <div className={`stat-value small ${(coin.priceChange1h || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(coin.priceChange1h || 0) >= 0 ? '+' : ''}{(coin.priceChange1h || 0).toFixed(1)}%
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">24h</div>
          <div className={`stat-value small ${(coin.priceChange24h || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(coin.priceChange24h || 0) >= 0 ? '+' : ''}{(coin.priceChange24h || 0).toFixed(1)}%
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Volume</div>
          <div className="stat-value small">{formatMarketCap(coin.volume24h)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Liquidity</div>
          <div className="stat-value small">{formatMarketCap(coin.liquidity)}</div>
        </div>
      </div>

      {/* Main Content: Chart + Swap */}
      <div className="detail-main">
        {/* Chart */}
        <div className="detail-chart">
          <div className="chart-header">
            <span className="chart-title">{coin.symbol}/SOL</span>
            <a
              href={`https://dexscreener.com/solana/${coin.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="chart-external-link"
            >
              DexScreener ↗
            </a>
          </div>
          <div className="chart-container">
            <iframe
              src={`https://dexscreener.com/solana/${coin.mint}?embed=1&loadChartSettings=0&trades=0&info=0&chartLeftToolbar=0&chartTheme=light&theme=light&chartStyle=0&chartType=usd&interval=15`}
              title={`${coin.symbol} Chart`}
              className="chart-iframe"
              allow="clipboard-write"
            />
          </div>
        </div>

        {/* Swap Widget */}
        <div className="detail-swap">
          <div className="swap-widget">
            <div className="swap-widget-header">
              <span>Buy {coin.symbol}</span>
              <span className="swap-slippage">{slippage}% slippage</span>
            </div>

            <div className="swap-input-group">
              <div className="swap-input-label-row">
                <span className="swap-input-label">You Pay</span>
                {isWalletConnected && (
                  <span className="swap-balance">
                    Balance: {isLoadingBalance ? '...' : solBalance !== null ? `${solBalance.toFixed(4)} SOL` : '—'}
                    <button
                      className="swap-refresh-btn"
                      onClick={fetchBalance}
                      disabled={isLoadingBalance}
                      title="Refresh balance"
                    >
                      🔄
                    </button>
                    {solBalance !== null && solBalance > 0.01 && (
                      <button className="swap-max-btn" onClick={handleMaxClick}>MAX</button>
                    )}
                  </span>
                )}
              </div>
              <div className="swap-input-row">
                <div className="swap-token">
                  <img src={inputToken.image_uri} alt={inputToken.symbol} />
                  <span>{inputToken.symbol}</span>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  min="0"
                  step="any"
                />
              </div>
            </div>

            <div className="swap-arrow">↓</div>

            <div className="swap-input-group">
              <div className="swap-input-label">You Receive</div>
              <div className="swap-output-row">
                <div className="swap-token">
                  {coin.image_uri && !imageError ? (
                    <img src={coin.image_uri} alt={coin.symbol} onError={() => setImageError(true)} />
                  ) : (
                    <span className="swap-token-placeholder">{coin.symbol?.[0]}</span>
                  )}
                  <span>{coin.symbol}</span>
                </div>
                <div className="swap-output-amount">
                  {isLoadingQuote ? '...' : outputAmount || '0.00'}
                </div>
              </div>
            </div>

            {/* Slippage */}
            <div className="swap-slippage-row">
              <span>Slippage:</span>
              <div className="slippage-options">
                {[0.5, 1, 2, 3].map(val => (
                  <button
                    key={val}
                    className={slippage === val ? 'active' : ''}
                    onClick={() => setSlippage(val)}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Success Message */}
            {swapSuccess && (
              <div className="swap-success">
                ✓ Swap successful!{' '}
                <a
                  href={`https://solscan.io/tx/${swapSuccess}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View tx
                </a>
              </div>
            )}

            {/* Action Button */}
            {buttonState.action === 'connect' ? (
              <div className="swap-connect-wrapper">
                <ConnectButton />
              </div>
            ) : (
              <button
                className={`swap-action-btn ${buttonState.disabled ? 'disabled' : ''}`}
                disabled={buttonState.disabled}
                onClick={handleSwap}
              >
                {buttonState.text}
              </button>
            )}

            <div className="swap-powered-by">
              Powered by Jupiter
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="detail-links">
        {/* Special button for 444STR */}
        {coin.symbol?.toUpperCase() === '444STR' && (
          <a
            href="https://sacredwaste.io"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn sacred-waste-btn"
          >
            🌀 Sacred Waste
          </a>
        )}
        <a
          href={`https://pump.fun/${coin.mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-btn"
        >
          🚀 pump.fun
        </a>
        {coin.twitter && (
          <a href={coin.twitter} target="_blank" rel="noopener noreferrer" className="link-btn">
            🐦 Twitter
          </a>
        )}
        {coin.telegram && (
          <a href={coin.telegram} target="_blank" rel="noopener noreferrer" className="link-btn">
            💬 Telegram
          </a>
        )}
        {coin.website && (
          <a href={coin.website} target="_blank" rel="noopener noreferrer" className="link-btn">
            🌐 Website
          </a>
        )}
      </div>
    </div>
  )
}
