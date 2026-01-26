import { useState, useMemo, useEffect, useCallback } from 'react'
import { Window } from '../Windows98'
import { useUnifiedWallet } from '../../providers/WalletProvider'
import { ConnectButton } from '../Wallet'
import usePumpCoins from '../../hooks/usePumpCoins'
import useJupiterSwap, { SOL_MINT, formatTokenAmount, parseTokenAmount } from '../../hooks/useJupiterSwap'
import useEvmSwap, { ETH_ADDRESS, formatTokenAmount as formatEvmAmount, parseTokenAmount as parseEvmAmount } from '../../hooks/useEvmSwap'
import './SwapWindow.css'

// SOL token info
const SOL_TOKEN = {
  mint: SOL_MINT,
  symbol: 'SOL',
  name: 'Solana',
  decimals: 9,
  image_uri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  price: 150,
  chain: 'solana',
}

// ETH token info
const ETH_TOKEN = {
  mint: ETH_ADDRESS,
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  image_uri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  price: 3000,
  chain: 'eth',
}

// Check if token is EVM
const isEvmToken = (token) => {
  return token?.chain === 'eth' || token?.mint?.startsWith('0x')
}

/**
 * SwapWindow - Two panel layout with token list and swap form
 */
// Get high-res image URL for meme making
const getHighResImageUrl = (imageUri) => {
  if (!imageUri) return null
  // DexScreener images support size parameter
  if (imageUri.includes('dd.dexscreener.com')) {
    return imageUri.includes('?') ? `${imageUri}&size=xl` : `${imageUri}?size=xl`
  }
  return imageUri
}

export default function SwapWindow({
  onClose,
  onMinimize,
  onMaximize,
  isDesktopMode = true,
  initialOutputMint = null,
  onMakeMeme = null,
}) {
  const { solana, evm } = useUnifiedWallet()
  const { coins: trendingCoins, isLoading: coinsLoading } = usePumpCoins('marketCap')

  // Jupiter (Solana) swap hook
  const jupiterSwap = useJupiterSwap()

  // EVM swap hook (uses Kyberswap aggregator)
  const evmSwap = useEvmSwap()

  const [inputToken, setInputToken] = useState(SOL_TOKEN)
  const [outputToken, setOutputToken] = useState(null)
  const [inputAmount, setInputAmount] = useState('')
  const [swapSuccess, setSwapSuccess] = useState(null)
  const [slippage, setSlippage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  // Determine which swap to use based on output token
  const isEvm = isEvmToken(outputToken)
  const activeSwap = isEvm ? evmSwap : jupiterSwap
  const { quote, isLoadingQuote, isSwapping, error, getQuote, executeSwap, reset } = activeSwap

  // Update input token when chain changes
  useEffect(() => {
    if (outputToken) {
      const newInputToken = isEvmToken(outputToken) ? ETH_TOKEN : SOL_TOKEN
      if (inputToken.chain !== newInputToken.chain) {
        setInputToken(newInputToken)
        setInputAmount('')
        jupiterSwap.reset()
        evmSwap.reset()
      }
    }
  }, [outputToken])

  // Filter tokens based on search
  const displayedTokens = useMemo(() => {
    if (!searchQuery.trim()) return trendingCoins
    const query = searchQuery.toLowerCase()
    return trendingCoins.filter(c =>
      c.symbol?.toLowerCase().includes(query) ||
      c.name?.toLowerCase().includes(query) ||
      c.mint?.toLowerCase().includes(query)
    )
  }, [searchQuery, trendingCoins])

  // Set initial output token if provided
  useEffect(() => {
    if (initialOutputMint && !outputToken && trendingCoins.length > 0) {
      const found = trendingCoins.find(c => c.mint === initialOutputMint)
      if (found) setOutputToken(found)
    }
  }, [initialOutputMint, trendingCoins, outputToken])

  // Fetch quote when inputs change
  useEffect(() => {
    if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) <= 0) {
      reset()
      return
    }

    const timeoutId = setTimeout(() => {
      if (isEvm) {
        // EVM swap via Kyberswap
        const amountInWei = parseEvmAmount(inputAmount, inputToken.decimals || 18)
        getQuote({
          inputToken: inputToken.mint,
          outputToken: outputToken.mint,
          amount: amountInWei,
          slippageBps: Math.round(slippage * 100),
        })
      } else {
        // Solana swap via Jupiter
        const amountInSmallestUnits = parseTokenAmount(inputAmount, inputToken.decimals || 9)
        getQuote({
          inputMint: inputToken.mint,
          outputMint: outputToken.mint,
          amount: amountInSmallestUnits,
          slippageBps: Math.round(slippage * 100),
        })
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [inputToken, outputToken, inputAmount, slippage, getQuote, reset, isEvm])

  // Handle swap
  const handleSwap = useCallback(async () => {
    if (!quote) return

    setSwapSuccess(null)

    let txid
    if (isEvm) {
      // EVM swap
      txid = await executeSwap({
        quoteResponse: quote,
      })
    } else {
      // Solana swap
      if (!solana.wallet || !solana.connection) return
      txid = await executeSwap({
        wallet: solana.wallet,
        connection: solana.connection,
        quoteResponse: quote,
      })
    }

    if (txid) {
      setSwapSuccess(txid)
      setInputAmount('')
      reset()
    }
  }, [quote, solana.wallet, solana.connection, executeSwap, reset, isEvm])

  // Swap input/output tokens
  const handleSwapTokens = () => {
    if (!outputToken) return
    const temp = inputToken
    setInputToken(outputToken)
    setOutputToken(temp)
    setInputAmount('')
    reset()
  }

  // Select token from list
  const selectToken = (token) => {
    if (token.mint === inputToken?.mint) {
      handleSwapTokens()
    } else {
      setOutputToken(token)
    }
  }

  // Format helpers
  const formatPrice = (price) => {
    if (!price) return '-'
    if (price < 0.00000001) return `$${price.toExponential(1)}`
    if (price < 0.0001) return `$${price.toFixed(8)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatMarketCap = (cap) => {
    if (!cap) return '-'
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(0)}K`
    return `$${cap.toFixed(0)}`
  }

  const formatChange = (change) => {
    if (change === undefined || change === null) return '-'
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // Calculate output
  const outputAmount = quote
    ? isEvm
      ? formatEvmAmount(quote.outputAmount, outputToken?.decimals || 18)
      : formatTokenAmount(quote.outAmount, outputToken?.decimals || 6)
    : ''

  const priceImpact = isEvm
    ? quote?.priceImpact
    : quote?.priceImpactPct
      ? (parseFloat(quote.priceImpactPct) * 100).toFixed(2)
      : null

  // Check if correct wallet is connected
  const isWalletConnected = isEvm ? evm.isConnected : solana.isConnected

  // Button state
  const getButtonState = () => {
    if (!isWalletConnected) {
      return {
        text: isEvm ? 'Connect EVM Wallet' : 'Connect Solana Wallet',
        disabled: false,
        action: 'connect'
      }
    }
    if (!outputToken) return { text: 'Select a Token', disabled: true }
    if (!inputAmount || parseFloat(inputAmount) <= 0) return { text: 'Enter Amount', disabled: true }
    if (isLoadingQuote) return { text: 'Getting Quote...', disabled: true }
    if (isSwapping) return { text: 'Swapping...', disabled: true }
    if (error) return { text: 'Try Again', disabled: true }
    if (!quote) return { text: 'Swap', disabled: true }
    return { text: `Swap for ${outputAmount} ${outputToken.symbol}`, disabled: false, action: 'swap' }
  }

  const buttonState = getButtonState()

  // Window title based on chain
  const windowTitle = isEvm ? 'Uniswap Swap' : 'Jupiter Swap'

  return (
    <div className="swap-window">
      <Window
        title={windowTitle}
        className="swap-window-frame"
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        showControls={isDesktopMode}
      >
        <div className="swap-layout">
          {/* LEFT: Token List */}
          <div className="swap-token-panel">
            <div className="token-panel-header">
              <h3>Top Tokens</h3>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="token-search"
              />
            </div>

            <div className="token-list-header">
              <span className="col-rank">#</span>
              <span className="col-name">Token</span>
              <span className="col-price">Price</span>
              <span className="col-mcap">MCap</span>
              <span className="col-change">24h</span>
            </div>

            <div className="token-list">
              {coinsLoading ? (
                <div className="token-list-loading">Loading tokens...</div>
              ) : displayedTokens.length === 0 ? (
                <div className="token-list-empty">No tokens found</div>
              ) : (
                displayedTokens.map((coin, index) => (
                  <div
                    key={coin.mint}
                    className={`token-row ${outputToken?.mint === coin.mint ? 'selected' : ''}`}
                    onClick={() => selectToken(coin)}
                  >
                    <span className="col-rank">{index + 1}</span>
                    <div className="col-name">
                      <div className="token-icon">
                        {coin.image_uri ? (
                          <img src={coin.image_uri} alt="" onError={(e) => e.target.style.display = 'none'} />
                        ) : (
                          <span>{coin.symbol?.[0] || '?'}</span>
                        )}
                      </div>
                      <div className="token-info">
                        <span className="token-symbol">{coin.symbol}</span>
                        <span className="token-name-text">{coin.name}</span>
                      </div>
                    </div>
                    <span className="col-price">{formatPrice(coin.price)}</span>
                    <span className="col-mcap">{formatMarketCap(coin.market_cap)}</span>
                    <span className={`col-change ${(coin.priceChange24h || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {formatChange(coin.priceChange24h)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Swap Form */}
          <div className="swap-form-panel">
            {/* Selected Token Display */}
            {outputToken && (
              <div className="selected-token-card">
                <div className="selected-token-main">
                  <div className="selected-token-icon">
                    {outputToken.image_uri ? (
                      <img src={outputToken.image_uri} alt="" />
                    ) : (
                      <span>{outputToken.symbol?.[0]}</span>
                    )}
                  </div>
                  <div className="selected-token-info">
                    <div className="selected-token-symbol">{outputToken.symbol}</div>
                    <div className="selected-token-name">{outputToken.name}</div>
                  </div>
                  <div className={`selected-token-change ${(outputToken.priceChange24h || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatChange(outputToken.priceChange24h)}
                  </div>
                </div>
                <div className="selected-token-stats">
                  <div className="stat-item">
                    <span className="stat-label">Price</span>
                    <span className="stat-value">{formatPrice(outputToken.price)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Market Cap</span>
                    <span className="stat-value">{formatMarketCap(outputToken.market_cap)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Volume 24h</span>
                    <span className="stat-value">{formatMarketCap(outputToken.volume24h)}</span>
                  </div>
                </div>
                <div className="selected-token-links">
                  {isEvmToken(outputToken) ? (
                    <>
                      <a href={`https://www.geckoterminal.com/eth/pools/${outputToken.pairAddress}`} target="_blank" rel="noopener noreferrer">
                        Chart
                      </a>
                      <a href={`https://etherscan.io/token/${outputToken.mint}`} target="_blank" rel="noopener noreferrer">
                        Explorer
                      </a>
                    </>
                  ) : (
                    <>
                      <a href={`https://dexscreener.com/solana/${outputToken.mint}`} target="_blank" rel="noopener noreferrer">
                        Chart
                      </a>
                      <a href={`https://solscan.io/token/${outputToken.mint}`} target="_blank" rel="noopener noreferrer">
                        Explorer
                      </a>
                    </>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(outputToken.mint)}>
                    Copy CA
                  </button>
                  {onMakeMeme && (
                    <button
                      className="make-meme-btn"
                      onClick={() => onMakeMeme({
                        ...outputToken,
                        image_uri: getHighResImageUrl(outputToken.image_uri)
                      })}
                    >
                      🎨 Make Meme
                    </button>
                  )}
                </div>
              </div>
            )}

            {!outputToken && (
              <div className="no-token-selected">
                <div className="no-token-icon">👈</div>
                <div className="no-token-text">Select a token from the list to swap</div>
              </div>
            )}

            {/* Swap Form */}
            <div className="swap-form">
              <div className="swap-input-section">
                <div className="input-header">
                  <span>You Pay</span>
                  <span className="slippage-display">Slippage: {slippage}%</span>
                </div>
                <div className="input-row">
                  <div className="input-token">
                    <div className="input-token-icon">
                      <img src={inputToken.image_uri} alt="" />
                    </div>
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

              <button className="swap-direction-btn" onClick={handleSwapTokens} disabled={!outputToken}>
                ↕
              </button>

              <div className="swap-output-section">
                <div className="output-header">
                  <span>You Receive</span>
                </div>
                <div className="output-row">
                  <div className="output-token">
                    {outputToken ? (
                      <>
                        <div className="output-token-icon">
                          {outputToken.image_uri ? (
                            <img src={outputToken.image_uri} alt="" />
                          ) : (
                            <span>{outputToken.symbol?.[0]}</span>
                          )}
                        </div>
                        <span>{outputToken.symbol}</span>
                      </>
                    ) : (
                      <span className="no-token">Select token</span>
                    )}
                  </div>
                  <div className="output-amount">
                    {isLoadingQuote ? '...' : outputAmount || '0.00'}
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              {quote && (
                <div className="quote-details">
                  <div className="quote-row">
                    <span>Rate</span>
                    <span>1 {inputToken.symbol} = {(parseFloat(outputAmount) / parseFloat(inputAmount)).toLocaleString()} {outputToken?.symbol}</span>
                  </div>
                  {priceImpact && (
                    <div className={`quote-row ${parseFloat(priceImpact) > 1 ? 'warning' : ''}`}>
                      <span>Price Impact</span>
                      <span>{priceImpact}%</span>
                    </div>
                  )}
                  {!isEvm && (
                    <div className="quote-row">
                      <span>Route</span>
                      <span>{quote.routePlan?.length || 1} hop(s)</span>
                    </div>
                  )}
                  {isEvm && quote.gasUsd && (
                    <div className="quote-row">
                      <span>Est. Gas</span>
                      <span>${parseFloat(quote.gasUsd).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Slippage Selector */}
              <div className="slippage-row">
                <span>Slippage:</span>
                <div className="slippage-buttons">
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

              {/* Error */}
              {error && <div className="swap-error">{error}</div>}

              {/* Success */}
              {swapSuccess && (
                <div className="swap-success">
                  Swap successful!{' '}
                  <a
                    href={isEvm
                      ? `https://etherscan.io/tx/${swapSuccess}`
                      : `https://solscan.io/tx/${swapSuccess}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View tx
                  </a>
                </div>
              )}

              {/* Action Button */}
              {buttonState.action === 'connect' ? (
                <div className="connect-btn-wrapper">
                  <ConnectButton />
                </div>
              ) : (
                <button
                  className="swap-btn"
                  disabled={buttonState.disabled}
                  onClick={handleSwap}
                >
                  {buttonState.text}
                </button>
              )}

              <div className="powered-by">
                Powered by {isEvm ? 'Kyberswap' : 'Jupiter'}
              </div>
            </div>
          </div>
        </div>
      </Window>
    </div>
  )
}
