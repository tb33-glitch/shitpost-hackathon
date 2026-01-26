import { useState, useEffect, useCallback } from 'react'
import { useUnifiedWallet } from '../../providers/WalletProvider'
import { ConnectButton } from '../Wallet'
import useJupiterSwap, { SOL_MINT, formatTokenAmount, parseTokenAmount } from '../../hooks/useJupiterSwap'
import useEvmSwap, { ETH_ADDRESS, formatTokenAmount as formatEvmAmount, parseTokenAmount as parseEvmAmount } from '../../hooks/useEvmSwap'
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

// ETH token info
const ETH_TOKEN = {
  mint: ETH_ADDRESS,
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  image_uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
}

/**
 * CoinDetail - Pump.fun style coin detail view with integrated swap
 */
export default function CoinDetail({ coin, onBack, onMakeMeme }) {
  const [imageError, setImageError] = useState(false)
  const [inputAmount, setInputAmount] = useState('')
  const [swapSuccess, setSwapSuccess] = useState(null)
  const [slippage, setSlippage] = useState(1)

  const { solana, evm } = useUnifiedWallet()

  // Determine chain
  const isEVM = coin.chain === 'eth' || coin.mint?.startsWith('0x')
  const chainName = isEVM ? 'ethereum' : 'solana'

  const quoteSymbol = isEVM ? 'ETH' : 'SOL'
  const inputToken = isEVM ? ETH_TOKEN : SOL_TOKEN

  // Swap hooks
  const jupiterSwap = useJupiterSwap()
  const evmSwap = useEvmSwap()
  const activeSwap = isEVM ? evmSwap : jupiterSwap
  const { quote, isLoadingQuote, isSwapping, error, getQuote, executeSwap, reset } = activeSwap

  // Check wallet connection
  const isWalletConnected = isEVM ? evm.isConnected : solana.isConnected

  // Fetch quote when input changes
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      reset()
      return
    }

    const timeoutId = setTimeout(() => {
      if (isEVM) {
        const amountInWei = parseEvmAmount(inputAmount, 18)
        console.log('[Swap Debug] EVM quote request:', {
          inputToken: ETH_ADDRESS,
          outputToken: coin.mint,
          amount: amountInWei,
          slippageBps: Math.round(slippage * 100),
          chainId: evmSwap.chainId,
          isConnected: evm.isConnected,
        })
        getQuote({
          inputToken: ETH_ADDRESS,
          outputToken: coin.mint,
          amount: amountInWei,
          slippageBps: Math.round(slippage * 100),
        })
      } else {
        const amountInLamports = parseTokenAmount(inputAmount, 9)
        console.log('[Swap Debug] Solana quote request:', {
          inputMint: SOL_MINT,
          outputMint: coin.mint,
          amount: amountInLamports,
          slippageBps: Math.round(slippage * 100),
          isConnected: solana.isConnected,
        })
        getQuote({
          inputMint: SOL_MINT,
          outputMint: coin.mint,
          amount: amountInLamports,
          slippageBps: Math.round(slippage * 100),
        })
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [inputAmount, slippage, coin.mint, isEVM, getQuote, reset, evmSwap.chainId, evm.isConnected, solana.isConnected])

  // Handle swap
  const handleSwap = useCallback(async () => {
    if (!quote) return

    setSwapSuccess(null)
    console.log('[Swap] Starting swap...')

    let txid
    if (isEVM) {
      txid = await executeSwap({ quoteResponse: quote })
    } else {
      if (!solana.wallet || !solana.connection) return
      txid = await executeSwap({
        wallet: solana.wallet,
        connection: solana.connection,
        quoteResponse: quote,
      })
    }

    console.log('[Swap] Result txid:', txid)

    if (txid) {
      console.log('[Swap] Success! Setting swapSuccess to:', txid)
      setSwapSuccess(txid)
      setInputAmount('')
      reset()
    } else {
      console.log('[Swap] No txid returned - check for errors')
    }
  }, [quote, isEVM, solana.wallet, solana.connection, executeSwap, reset])

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
    ? isEVM
      ? formatEvmAmount(quote.outputAmount, coin.decimals || 18)
      : formatTokenAmount(quote.outAmount, coin.decimals || 6)
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
    if (!isWalletConnected) return { text: `Connect ${isEVM ? 'EVM' : 'Solana'} Wallet`, action: 'connect' }
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
              <span className="detail-chain-badge">{isEVM ? 'ETH' : 'SOL'}</span>
              <button className="copy-btn" onClick={copyAddress} title="Copy address">
                📋 {coin.mint?.slice(0, 6)}...{coin.mint?.slice(-4)}
              </button>
            </div>
          </div>
        </div>

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
            <span className="chart-title">{coin.symbol}/{quoteSymbol}</span>
            <a
              href={isEVM
                ? `https://www.geckoterminal.com/eth/pools/${coin.pairAddress}`
                : `https://dexscreener.com/${chainName}/${coin.mint}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="chart-external-link"
            >
              {isEVM ? 'GeckoTerminal ↗' : 'DexScreener ↗'}
            </a>
          </div>
          <div className="chart-container">
            {isEVM ? (
              <iframe
                src={`https://www.geckoterminal.com/eth/pools/${coin.pairAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=1`}
                title={`${coin.symbol} Chart`}
                className="chart-iframe"
                allow="clipboard-write"
              />
            ) : (
              <iframe
                src={`https://dexscreener.com/${chainName}/${coin.mint}?embed=1&loadChartSettings=0&trades=0&info=0&chartLeftToolbar=0&chartTheme=light&theme=light&chartStyle=0&chartType=usd&interval=15`}
                title={`${coin.symbol} Chart`}
                className="chart-iframe"
                allow="clipboard-write"
              />
            )}
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
              <div className="swap-input-label">You Pay</div>
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
                  href={isEVM ? `https://etherscan.io/tx/${swapSuccess}` : `https://solscan.io/tx/${swapSuccess}`}
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
              Powered by {isEVM ? 'Kyberswap' : 'Jupiter'}
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
        {isEVM ? (
          <>
            <a
              href={`https://app.uniswap.org/swap?outputCurrency=${coin.mint}&chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-btn"
            >
              🦄 Uniswap
            </a>
            <a
              href={`https://etherscan.io/token/${coin.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-btn"
            >
              📜 Etherscan
            </a>
          </>
        ) : (
          <a
            href={`https://pump.fun/${coin.mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            🚀 pump.fun
          </a>
        )}
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
