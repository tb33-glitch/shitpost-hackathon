import { useState, useEffect, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { ConnectButton } from '../Wallet'
import useJupiterSwap, { SOL_MINT, formatTokenAmount, parseTokenAmount } from '../../hooks/useJupiterSwap'
import usePositions from '../../hooks/usePositions'
import { getBalance as getBalanceFromProxy, getTokenAccountsByOwner } from '../../utils/solanaRpc'
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
  const [tokenBalance, setTokenBalance] = useState(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [swapMode, setSwapMode] = useState('buy') // 'buy' or 'sell'

  const { publicKey, connected: isWalletConnected, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()

  // Determine input/output based on swap mode
  const isBuyMode = swapMode === 'buy'
  const inputToken = isBuyMode ? SOL_TOKEN : { ...coin, decimals: coin.decimals || 6 }
  const outputToken = isBuyMode ? { ...coin, decimals: coin.decimals || 6 } : SOL_TOKEN

  // Jupiter swap hook
  const { quote, isLoadingQuote, isSwapping, error, getQuote, executeSwap, reset } = useJupiterSwap()

  // Position tracking hook
  const { recordBuy, recordSell, getPosition, calculatePnL } = usePositions()

  // Get current position for this coin (for cost basis tracking)
  const position = getPosition(coin.mint)

  // Calculate PnL if we have a position or token balance
  const [positionPnL, setPositionPnL] = useState(null)

  useEffect(() => {
    // Calculate PnL if we have either a tracked position or actual token balance
    const hasHoldings = position || tokenBalance > 0

    if (hasHoldings && coin.price) {
      // Get SOL price to convert token price to SOL
      const fetchSolPrice = async () => {
        try {
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
          const data = await res.json()
          const solPrice = data.solana?.usd || 150
          const currentPriceSol = coin.price / solPrice

          // Use actual wallet balance for calculations
          const actualBalance = tokenBalance ?? position?.totalAmount ?? 0
          const currentValueSol = actualBalance * currentPriceSol

          // Calculate cost basis from actual balance × avg cost per token
          // This gives accurate PnL even if user has different balance than tracked
          const avgCostPerToken = position?.avgCostPerToken ?? currentPriceSol
          const costBasisSol = actualBalance * avgCostPerToken

          const pnlSol = costBasisSol > 0 ? currentValueSol - costBasisSol : 0
          const pnlPercent = costBasisSol > 0 ? (pnlSol / costBasisSol) * 100 : 0

          setPositionPnL({
            currentValueSol,
            costBasisSol,
            pnlSol,
            pnlPercent,
            avgCostPerToken,
            currentPricePerToken: currentPriceSol
          })
        } catch (err) {
          console.error('[PnL] Failed to calculate:', err)
        }
      }
      fetchSolPrice()
    } else {
      setPositionPnL(null)
    }
  }, [position, tokenBalance, coin.price, coin.mint, calculatePnL])

  // Fetch SOL and token balance when wallet connects (using backend RPC proxy)
  const fetchBalance = useCallback(async () => {
    console.log('[Balance] Fetching via backend proxy...', {
      isWalletConnected,
      publicKey: publicKey?.toString(),
    })

    if (!isWalletConnected || !publicKey) {
      console.log('[Balance] Not connected, skipping')
      setSolBalance(null)
      setTokenBalance(null)
      return
    }

    setIsLoadingBalance(true)

    // Fetch SOL balance
    try {
      const result = await getBalanceFromProxy(publicKey.toString())
      const lamports = result?.value ?? result
      const sol = lamports / LAMPORTS_PER_SOL
      console.log('[Balance] SOL balance:', sol)
      setSolBalance(sol)
    } catch (err) {
      console.error('[Balance] SOL balance error:', err.message)
      // Fallback to wallet adapter connection
      try {
        const lamports = await connection.getBalance(publicKey)
        setSolBalance(lamports / LAMPORTS_PER_SOL)
      } catch (err2) {
        setSolBalance(null)
      }
    }

    // Fetch token balance using getTokenAccountsByOwner (works for both Token and Token-2022)
    try {
      console.log('[Balance] Fetching token balance for mint:', coin.mint)
      const tokenAccounts = await getTokenAccountsByOwner(publicKey.toString(), coin.mint)
      console.log('[Balance] Token accounts found:', tokenAccounts?.length || 0)

      if (tokenAccounts && tokenAccounts.length > 0) {
        // Get balance from the first account (usually only one ATA per mint)
        const accountInfo = tokenAccounts[0].account.data.parsed.info
        const balance = accountInfo.tokenAmount.uiAmount || 0
        console.log('[Balance] Token balance:', balance, coin.symbol)
        setTokenBalance(balance)
      } else {
        console.log('[Balance] No token accounts found, balance: 0')
        setTokenBalance(0)
      }
    } catch (err) {
      console.error('[Balance] Token balance error:', err.message)
      setTokenBalance(0)
    }

    setIsLoadingBalance(false)
  }, [isWalletConnected, publicKey, connection, coin.mint])

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
    if (isBuyMode) {
      // Buy mode: use SOL balance, leave some for fees
      if (solBalance !== null && solBalance > 0) {
        const maxAmount = Math.max(0, solBalance - 0.01)
        setInputAmount(maxAmount.toFixed(4))
      }
    } else {
      // Sell mode: use full token balance
      if (tokenBalance !== null && tokenBalance > 0) {
        setInputAmount(tokenBalance.toString())
      }
    }
  }, [isBuyMode, solBalance, tokenBalance])

  // Fetch quote when input changes
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      reset()
      return
    }

    const timeoutId = setTimeout(() => {
      const inputDecimals = isBuyMode ? 9 : (coin.decimals || 6)
      const amountInSmallestUnit = parseTokenAmount(inputAmount, inputDecimals)

      const quoteParams = isBuyMode
        ? { inputMint: SOL_MINT, outputMint: coin.mint }
        : { inputMint: coin.mint, outputMint: SOL_MINT }

      console.log('[Swap Debug] Quote request:', {
        mode: swapMode,
        ...quoteParams,
        amount: amountInSmallestUnit,
        slippageBps: Math.round(slippage * 100),
      })

      getQuote({
        ...quoteParams,
        amount: amountInSmallestUnit,
        slippageBps: Math.round(slippage * 100),
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [inputAmount, slippage, coin.mint, coin.decimals, getQuote, reset, isWalletConnected, isBuyMode, swapMode])

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

      // Record position for PnL tracking
      const inAmount = Number(quote.inAmount)
      const outAmount = Number(quote.outAmount)

      if (isBuyMode) {
        // Buying token with SOL
        const solSpent = inAmount / LAMPORTS_PER_SOL
        const tokenAmount = outAmount / Math.pow(10, coin.decimals || 6)
        recordBuy({
          mint: coin.mint,
          symbol: coin.symbol,
          name: coin.name,
          image_uri: coin.image_uri,
          amount: tokenAmount,
          solSpent,
          txid
        })
      } else {
        // Selling token for SOL
        const tokenAmount = inAmount / Math.pow(10, coin.decimals || 6)
        const solReceived = outAmount / LAMPORTS_PER_SOL
        recordSell({
          mint: coin.mint,
          amount: tokenAmount,
          solReceived,
          txid
        })
      }

      setInputAmount('')
      reset()
    } else {
      console.log('[Swap] No txid returned - check for errors')
    }
  }, [quote, publicKey, connection, signTransaction, signAllTransactions, executeSwap, reset, isBuyMode, coin, recordBuy, recordSell])

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
  const outputDecimals = isBuyMode ? (coin.decimals || 6) : 9
  const outputAmount = quote
    ? formatTokenAmount(quote.outAmount, outputDecimals)
    : ''

  // Reset input when switching modes
  const handleModeChange = useCallback((mode) => {
    setSwapMode(mode)
    setInputAmount('')
    reset()
  }, [reset])

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
    const actionText = isBuyMode ? 'Buy' : 'Sell for'
    const outputSymbol = isBuyMode ? coin.symbol : 'SOL'
    return { text: `${actionText} ${outputAmount} ${outputSymbol}`, disabled: false, action: 'swap' }
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
              src={`https://dexscreener.com/solana/${coin.mint}?embed=1&loadChartSettings=0&trades=0&info=0&chartLeftToolbar=0&chartTheme=light&theme=light&chartStyle=1&chartType=mcap&interval=15`}
              title={`${coin.symbol} Chart`}
              className="chart-iframe"
              allow="clipboard-write"
            />
          </div>
        </div>

        {/* Swap Widget */}
        <div className="detail-swap">
          <div className="swap-widget">
            {/* Buy/Sell Tabs */}
            <div className="swap-mode-tabs">
              <button
                className={`swap-mode-tab ${isBuyMode ? 'active buy' : ''}`}
                onClick={() => handleModeChange('buy')}
              >
                Buy
              </button>
              <button
                className={`swap-mode-tab ${!isBuyMode ? 'active sell' : ''}`}
                onClick={() => handleModeChange('sell')}
              >
                Sell
              </button>
            </div>

            <div className="swap-widget-header">
              <span>{isBuyMode ? 'Buy' : 'Sell'} {coin.symbol}</span>
              <span className="swap-slippage">{slippage}% slippage</span>
            </div>

            {/* Position PnL Display - shows when user has tracked position OR token balance */}
            {(position || tokenBalance > 0) && positionPnL && (
              <div className={`position-pnl-card ${positionPnL.pnlSol >= 0 ? 'positive' : 'negative'}`}>
                <div className="pnl-header">
                  <span className="pnl-label">Your Position</span>
                  <span className={`pnl-value ${positionPnL.pnlSol >= 0 ? 'positive' : 'negative'}`}>
                    {positionPnL.pnlSol >= 0 ? '+' : ''}{positionPnL.pnlSol.toFixed(4)} SOL
                    <span className="pnl-percent">
                      ({positionPnL.pnlPercent >= 0 ? '+' : ''}{positionPnL.pnlPercent.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="pnl-details">
                  <div className="pnl-detail">
                    <span>Holding</span>
                    <span>{(tokenBalance ?? position?.totalAmount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {coin.symbol}</span>
                  </div>
                  <div className="pnl-detail">
                    <span>Avg Cost</span>
                    <span>{positionPnL.avgCostPerToken?.toFixed(8) || '—'} SOL</span>
                  </div>
                  <div className="pnl-detail">
                    <span>Current</span>
                    <span>{positionPnL.currentPricePerToken?.toFixed(8) || '—'} SOL</span>
                  </div>
                </div>
              </div>
            )}

            <div className="swap-input-group">
              <div className="swap-input-label-row">
                <span className="swap-input-label">You Pay</span>
                {isWalletConnected && (
                  <span className="swap-balance">
                    Balance: {isLoadingBalance ? '...' : (
                      isBuyMode
                        ? (solBalance !== null ? `${solBalance.toFixed(4)} SOL` : '—')
                        : (tokenBalance !== null ? `${tokenBalance.toLocaleString()} ${coin.symbol}` : '—')
                    )}
                    <button
                      className="swap-refresh-btn"
                      onClick={fetchBalance}
                      disabled={isLoadingBalance}
                      title="Refresh balance"
                    >
                      🔄
                    </button>
                    {((isBuyMode && solBalance > 0.01) || (!isBuyMode && tokenBalance > 0)) && (
                      <button className="swap-max-btn" onClick={handleMaxClick}>MAX</button>
                    )}
                  </span>
                )}
              </div>
              <div className="swap-input-row">
                <div className="swap-token">
                  {inputToken.image_uri && !imageError ? (
                    <img src={inputToken.image_uri} alt={inputToken.symbol} onError={() => setImageError(true)} />
                  ) : (
                    <span className="swap-token-placeholder">{inputToken.symbol?.[0]}</span>
                  )}
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

            <div
              className="swap-arrow clickable"
              onClick={() => handleModeChange(isBuyMode ? 'sell' : 'buy')}
              title="Switch buy/sell"
            >⇅</div>

            <div className="swap-input-group">
              <div className="swap-input-label">You Receive</div>
              <div className="swap-output-row">
                <div className="swap-token">
                  {outputToken.image_uri && !imageError ? (
                    <img src={outputToken.image_uri} alt={outputToken.symbol} onError={() => setImageError(true)} />
                  ) : (
                    <span className="swap-token-placeholder">{outputToken.symbol?.[0]}</span>
                  )}
                  <span>{outputToken.symbol}</span>
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
